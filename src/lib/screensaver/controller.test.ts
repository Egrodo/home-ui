import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	createScreensaverController,
	CYCLE_INTERVAL_MS,
	IDLE_TIMEOUT_MS,
	SHIELD_FAILSAFE_MS,
	SHIELD_RELEASE_MS,
	TRANSITION_MS,
	type Phase
} from './controller';
import type { Screensaver, ScreensaverContext, ScreensaverLoader } from './types';

function fakeAnimation(cleanup = vi.fn()) {
	const contexts: ScreensaverContext[] = [];
	const start = vi.fn((ctx: ScreensaverContext) => {
		contexts.push(ctx);
		return cleanup;
	});
	const load: ScreensaverLoader = async () => ({ start });
	return { load, start, cleanup, contexts };
}

const pointer = (type: string, buttons = 0) =>
	window.dispatchEvent(new MouseEvent(type, { buttons }));

describe('createScreensaverController', () => {
	let stage: HTMLDivElement;
	let phases: Phase[];
	let onActivate: ReturnType<typeof vi.fn<() => void>>;
	let controller: ReturnType<typeof createScreensaverController>;

	const setup = (animations: Record<string, ScreensaverLoader>) => {
		controller = createScreensaverController({
			animations,
			stage,
			onActivate,
			onPhaseChange: (phase) => phases.push(phase)
		});
	};
	const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms);
	const lastPhase = () => phases[phases.length - 1];

	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		stage = document.createElement('div');
		phases = [];
		onActivate = vi.fn<() => void>();
	});

	afterEach(() => {
		controller.destroy();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('activates after the idle timeout', async () => {
		const animation = fakeAnimation();
		setup({ a: animation.load });

		await advance(IDLE_TIMEOUT_MS - 1);
		expect(animation.start).not.toHaveBeenCalled();

		await advance(1);
		expect(animation.start).toHaveBeenCalledOnce();
		expect(lastPhase()).toBe('active');
		expect(onActivate).toHaveBeenCalledOnce();
		expect(stage.style.opacity).toBe('1');
	});

	it('restarts the idle timeout on touches and drags, but not hover', async () => {
		const animation = fakeAnimation();
		setup({ a: animation.load });

		await advance(IDLE_TIMEOUT_MS - 1);
		pointer('pointerdown');
		await advance(IDLE_TIMEOUT_MS - 1);
		pointer('pointermove', 1);
		await advance(IDLE_TIMEOUT_MS - 1);
		expect(animation.start).not.toHaveBeenCalled();

		pointer('pointermove', 0);
		await advance(1);
		expect(animation.start).toHaveBeenCalledOnce();
	});

	it('gives each animation a fresh mounted canvas', async () => {
		const a = fakeAnimation();
		const b = fakeAnimation();
		setup({ a: a.load, b: b.load });

		controller.activate('a');
		await advance(0);
		expect(stage.querySelectorAll('canvas')).toHaveLength(1);
		const first = a.contexts[0].canvas;
		expect(stage.contains(first)).toBe(true);

		controller.activate('b');
		await advance(TRANSITION_MS);
		expect(stage.querySelectorAll('canvas')).toHaveLength(1);
		expect(stage.contains(first)).toBe(false);
		expect(stage.contains(b.contexts[0].canvas)).toBe(true);
	});

	it('cycles every interval, tearing the old animation down first', async () => {
		const a = fakeAnimation();
		const b = fakeAnimation();
		setup({ a: a.load, b: b.load });
		controller.activate('a');
		await advance(0);

		await advance(CYCLE_INTERVAL_MS - 1);
		expect(a.cleanup).not.toHaveBeenCalled();

		await advance(1);
		expect(a.cleanup).toHaveBeenCalledOnce();
		expect(a.contexts[0].signal.aborted).toBe(true);
		expect(stage.style.opacity).toBe('0');

		await advance(TRANSITION_MS);
		expect(a.start.mock.calls.length + b.start.mock.calls.length).toBe(2);
		expect(stage.style.opacity).toBe('1');
	});

	it('leaves a lone animation running across cycles', async () => {
		const a = fakeAnimation();
		setup({ a: a.load });
		controller.activate();
		await advance(CYCLE_INTERVAL_MS * 3);

		expect(a.start).toHaveBeenCalledOnce();
		expect(a.cleanup).not.toHaveBeenCalled();
	});

	it('wakes on touch, holding the shield until the touch lifts', async () => {
		const a = fakeAnimation();
		setup({ a: a.load });
		controller.activate();
		await advance(0);

		pointer('pointerdown');
		expect(a.cleanup).toHaveBeenCalledOnce();
		expect(lastPhase()).toBe('waking');

		await advance(SHIELD_RELEASE_MS * 2);
		expect(lastPhase()).toBe('waking');
		expect(stage.querySelector('canvas')).not.toBeNull();

		pointer('pointerup');
		await advance(SHIELD_RELEASE_MS - 1);
		expect(lastPhase()).toBe('waking');

		await advance(1);
		expect(lastPhase()).toBe('off');
		expect(stage.querySelector('canvas')).toBeNull();
	});

	it('drops the shield if the pointerup never arrives', async () => {
		setup({ a: fakeAnimation().load });
		controller.activate();
		await advance(0);

		pointer('pointerdown');
		await advance(SHIELD_FAILSAFE_MS + SHIELD_RELEASE_MS);
		expect(lastPhase()).toBe('off');
	});

	it('stops cycling after waking, and activates again after another idle period', async () => {
		const a = fakeAnimation();
		const b = fakeAnimation();
		setup({ a: a.load, b: b.load });
		controller.activate('a');
		await advance(0);

		pointer('pointerdown');
		pointer('pointerup');
		await advance(SHIELD_RELEASE_MS);
		await advance(IDLE_TIMEOUT_MS - SHIELD_RELEASE_MS - 1);
		expect(a.start.mock.calls.length + b.start.mock.calls.length).toBe(1);

		await advance(1);
		expect(a.start.mock.calls.length + b.start.mock.calls.length).toBe(2);
		expect(lastPhase()).toBe('active');
		expect(onActivate).toHaveBeenCalledTimes(2);
	});

	it('moves on to another animation when one fails to start', async () => {
		const good = fakeAnimation();
		const bad: Screensaver = {
			start() {
				throw new Error('no webgl');
			}
		};
		setup({ bad: async () => bad, good: good.load });

		controller.activate();
		await advance(0);

		expect(good.start).toHaveBeenCalledOnce();
		expect(stage.querySelectorAll('canvas')).toHaveLength(1);
	});

	it('cleans up an animation that finishes starting after the user woke the screen', async () => {
		const cleanup = vi.fn();
		let finishStart: (c: () => void) => void = () => {};
		setup({
			slow: async () => ({
				start: () => new Promise((resolve) => (finishStart = resolve))
			})
		});

		controller.activate();
		await advance(0);
		pointer('pointerdown');
		finishStart(cleanup);
		await advance(0);

		expect(cleanup).toHaveBeenCalledOnce();
		expect(stage.querySelector('canvas')).toBeNull();
	});

	it('releases WebGL contexts on teardown', async () => {
		const loseContext = vi.fn();
		const gl = { getExtension: () => ({ loseContext }) };
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
			type === 'webgl' ? gl : null) as never);
		setup({ a: fakeAnimation().load });

		controller.activate();
		await advance(0);
		pointer('pointerdown');
		pointer('pointerup');
		await advance(SHIELD_RELEASE_MS);

		expect(loseContext).toHaveBeenCalledOnce();
	});

	it('never activates with no animations', async () => {
		setup({});
		await advance(IDLE_TIMEOUT_MS);
		expect(phases).toEqual([]);
		expect(onActivate).not.toHaveBeenCalled();
	});
});
