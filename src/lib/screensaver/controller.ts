import { createDeck } from './deck';
import type { Cleanup, ScreensaverLoader } from './types';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const CYCLE_INTERVAL_MS = 15 * 60 * 1000;
/** Fade between animations; matches .stage's transition in Screensaver.svelte. */
export const TRANSITION_MS = 1000;
/** How long the overlay keeps absorbing input after the waking touch lifts. */
export const SHIELD_RELEASE_MS = 350;
/** A missed pointerup must never leave an invisible overlay blocking the panel. */
export const SHIELD_FAILSAFE_MS = 3000;
/** Debug: shows a frame rate readout over the animation. */
export const SHOW_FPS = false;

export type Phase = 'off' | 'active' | 'waking';

interface Running {
	/** Stops rendering; the last frame stays on screen so it can fade. */
	stop(): void;
	/** Frees the canvas once nothing is showing it. */
	dispose(): void;
}

interface ControllerOptions {
	animations: Record<string, ScreensaverLoader>;
	/** Element the canvases mount into. */
	stage: HTMLElement;
	onActivate(): void;
	onPhaseChange(phase: Phase): void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Browsers cap live WebGL contexts and removing a canvas only frees its context on GC,
// which a panel swapping animations for weeks can't rely on. getContext returns the
// existing context of a matching type and null for any other.
export function releaseCanvas(canvas: HTMLCanvasElement) {
	const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
	gl?.getExtension('WEBGL_lose_context')?.loseContext();
	canvas.width = 0;
	canvas.height = 0;
	canvas.remove();
}

export function createScreensaverController(options: ControllerOptions) {
	const { animations, stage, onActivate, onPhaseChange } = options;
	const names = Object.keys(animations);
	const deck = createDeck(names);
	const listeners = new AbortController();

	let phase: Phase = 'off';
	let current: Running | null = null;
	// Bumped whenever a pending show() is superseded, so it can bail after each await.
	let generation = 0;
	let idleTimer: ReturnType<typeof setTimeout>;
	let cycleTimer: ReturnType<typeof setInterval>;
	let shieldTimer: ReturnType<typeof setTimeout>;
	let failsafeTimer: ReturnType<typeof setTimeout>;
	let releaseShield: (() => void) | null = null;

	function setPhase(next: Phase) {
		phase = next;
		onPhaseChange(next);
	}

	async function launch(name: string): Promise<Running | null> {
		const canvas = document.createElement('canvas');
		canvas.width = stage.clientWidth;
		canvas.height = stage.clientHeight;
		stage.append(canvas);

		const abort = new AbortController();
		let cleanup: void | Cleanup;
		const running: Running = {
			stop() {
				if (abort.signal.aborted) return;
				abort.abort();
				try {
					cleanup?.();
				} catch (e) {
					console.error(`Screensaver "${name}" failed to clean up`, e);
				}
			},
			dispose: () => releaseCanvas(canvas)
		};

		try {
			const animation = await animations[name]();
			cleanup = await animation.start({
				canvas,
				width: canvas.width,
				height: canvas.height,
				signal: abort.signal
			});
			return running;
		} catch (e) {
			console.error(`Screensaver "${name}" failed to start`, e);
			running.stop();
			running.dispose();
			return null;
		}
	}

	async function show(name?: string) {
		const run = ++generation;

		if (current) {
			const outgoing = current;
			current = null;
			outgoing.stop();
			stage.style.opacity = '0';
			await delay(TRANSITION_MS);
			outgoing.dispose();
			if (run !== generation) return;
		}

		// On failure, try the rest of the deck; if all fail, stay black until the next cycle.
		const attempts = name === undefined ? names.length : 1;
		for (let i = 0; i < attempts; i++) {
			const running = await launch(name ?? deck.next());
			if (run !== generation) {
				running?.stop();
				running?.dispose();
				return;
			}
			if (running) {
				current = running;
				stage.style.opacity = '1';
				return;
			}
		}
	}

	/** Brings the screensaver up, or switches to the named animation if it's already up. */
	function activate(name?: string) {
		if (names.length === 0 || phase === 'waking') return;
		if (name !== undefined && !animations[name]) {
			console.error(`Unknown screensaver "${name}". Available: ${names.join(', ')}`);
			return;
		}

		if (phase === 'off') {
			setPhase('active');
			onActivate();
		}
		void show(name);

		clearInterval(cycleTimer);
		cycleTimer = setInterval(() => {
			// A lone animation just keeps running rather than restarting itself.
			if (names.length > 1 || !current) void show();
		}, CYCLE_INTERVAL_MS);
	}

	function wake() {
		generation++;
		clearInterval(cycleTimer);
		const outgoing = current;
		current = null;
		outgoing?.stop();
		setPhase('waking');

		// Stay in place until the touch has lifted. Otherwise the tap that woke the
		// screen lands on whatever is underneath, and toggles a light.
		releaseShield = () => {
			releaseShield = null;
			clearTimeout(failsafeTimer);
			shieldTimer = setTimeout(() => {
				outgoing?.dispose();
				stage.style.opacity = '0';
				setPhase('off');
			}, SHIELD_RELEASE_MS);
		};
		failsafeTimer = setTimeout(releaseShield, SHIELD_FAILSAFE_MS);
	}

	function resetIdleTimer() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			if (phase === 'off') activate();
		}, IDLE_TIMEOUT_MS);
	}

	// Capture phase: several components stopPropagation or capture the pointer.
	const capture = { capture: true, passive: true, signal: listeners.signal };
	window.addEventListener(
		'pointerdown',
		() => {
			resetIdleTimer();
			if (phase === 'active') wake();
		},
		capture
	);
	window.addEventListener(
		'pointermove',
		(e) => {
			// Drags only: a resting cursor or touch controller glitch isn't activity.
			if (e.buttons > 0) resetIdleTimer();
		},
		capture
	);
	window.addEventListener('keydown', resetIdleTimer, capture);
	window.addEventListener('wheel', resetIdleTimer, capture);
	window.addEventListener('pointerup', () => releaseShield?.(), capture);
	window.addEventListener('pointercancel', () => releaseShield?.(), capture);
	resetIdleTimer();

	return {
		activate,
		destroy() {
			generation++;
			listeners.abort();
			clearTimeout(idleTimer);
			clearInterval(cycleTimer);
			clearTimeout(shieldTimer);
			clearTimeout(failsafeTimer);
			current?.stop();
			current?.dispose();
			current = null;
		}
	};
}
