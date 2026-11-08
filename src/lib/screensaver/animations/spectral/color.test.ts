import { describe, it, expect } from 'vitest';
import { bakeDistanceRamps, bakeLoopingRamp, hexToOklab } from './color';
import { CORE_RAMP_RANGE, PALETTES, type FrameStop } from './config';

const SIZE = 1000;
const STOPS = [
	{ at: 0, color: '#2e0f19' },
	{ at: 0.25, color: '#490091' },
	{ at: 0.6, color: '#303cdc' }
];

const lightness = (pixels: Float32Array) => Array.from(pixels).filter((_, i) => i % 4 === 0);

describe('hexToOklab', () => {
	it('converts black and white', () => {
		expect(hexToOklab('#000000')[0]).toBeCloseTo(0);
		expect(hexToOklab('#ffffff')[0]).toBeCloseTo(1);
		expect(hexToOklab('#ffffff')[1]).toBeCloseTo(0);
	});
});

describe('bakeDistanceRamps', () => {
	const ramp = [
		{ at: 0, color: '#ff0000', opacity: 1 },
		{ at: 0.1, color: '#00ff00', opacity: 0.5 },
		{ at: 0.3, color: '#00ff00', opacity: 0 }
	];
	const maxDistance = 0.5;
	const opacityAt = (pixels: Float32Array, row: number, distance: number) =>
		pixels[(row * SIZE + Math.round((distance / maxDistance) * SIZE)) * 4 + 3];

	it('stores one row per ramp', () => {
		expect(bakeDistanceRamps([ramp, ramp, ramp], SIZE, maxDistance).length).toBe(SIZE * 3 * 4);
	});

	it('follows the opacity stops and holds the last one beyond the end', () => {
		const pixels = bakeDistanceRamps([ramp], SIZE, maxDistance);
		expect(opacityAt(pixels, 0, 0)).toBeCloseTo(1, 3);
		expect(opacityAt(pixels, 0, 0.1)).toBeCloseTo(0.5, 2);
		expect(opacityAt(pixels, 0, 0.4)).toBe(0);
	});

	it('fades out without a slope break at the last stop', () => {
		const pixels = bakeDistanceRamps([ramp], SIZE, maxDistance);
		const step = 0.5 / SIZE;
		expect(opacityAt(pixels, 0, 0.3 - 2 * step) - opacityAt(pixels, 0, 0.3)).toBeLessThan(1e-3);
	});
});

describe('bakeLoopingRamp', () => {
	it('reaches each stop', () => {
		const ramp = lightness(bakeLoopingRamp(STOPS, SIZE));
		for (const stop of STOPS) {
			expect(ramp[Math.round(stop.at * SIZE)]).toBeCloseTo(hexToOklab(stop.color)[0], 3);
		}
	});

	it('never overshoots the stops', () => {
		const ramp = lightness(bakeLoopingRamp(STOPS, SIZE));
		const anchors = STOPS.map((stop) => hexToOklab(stop.color)[0]);
		expect(Math.min(...ramp)).toBeGreaterThanOrEqual(Math.min(...anchors) - 1e-6);
		expect(Math.max(...ramp)).toBeLessThanOrEqual(Math.max(...anchors) + 1e-6);
	});

	it('loops without a jump at the seam', () => {
		const ramp = lightness(bakeLoopingRamp(STOPS, SIZE));
		expect(Math.abs(ramp[0] - ramp[SIZE - 1])).toBeLessThan(0.01);
	});

	it('handles a single stop', () => {
		const ramp = lightness(bakeLoopingRamp([STOPS[0]], 8));
		expect(ramp.every((v) => Math.abs(v - hexToOklab(STOPS[0].color)[0]) < 1e-6)).toBe(true);
	});
});

describe('PALETTES', () => {
	const isHex = (color: string) => /^#[0-9a-f]{6}$/i.test(color);
	const isIncreasing = (stops: { at: number }[]) =>
		stops.every((stop, i) => i === 0 || stop.at > stops[i - 1].at);

	it('has uniquely named palettes', () => {
		expect(new Set(PALETTES.map((p) => p.name)).size).toBe(PALETTES.length);
	});

	it.each(PALETTES.map((p) => [p.name, p] as const))('%s has valid stops', (_, palette) => {
		expect(isIncreasing(palette.interior)).toBe(true);
		expect(palette.interior[0].at).toBeGreaterThanOrEqual(0);
		expect(palette.interior[palette.interior.length - 1].at).toBeLessThan(1);
		expect(palette.interior.every((stop) => isHex(stop.color))).toBe(true);

		const check = (ramp: FrameStop[], limit: number) => {
			const last = ramp[ramp.length - 1];
			expect(isIncreasing(ramp)).toBe(true);
			expect(last.at).toBeLessThan(limit);
			expect(last.opacity).toBe(0);
			expect(ramp.every((stop) => isHex(stop.color))).toBe(true);
		};
		Object.values(palette.frame).forEach((ramp) => check(ramp, 0.5));
		if (palette.core) {
			const { top, side, bottom } = palette.core;
			[top, side, bottom].forEach((ramp) => check(ramp, CORE_RAMP_RANGE));
		}
	});
});
