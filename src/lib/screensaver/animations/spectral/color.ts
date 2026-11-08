import type { ColorStop, FrameStop } from './config';

type Lab = [number, number, number];

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function hexToOklab(hex: string): Lab {
	const [r, g, b] = [1, 3, 5].map((i) => srgbToLinear(parseInt(hex.substring(i, i + 2), 16) / 255));
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	];
}

/**
 * Slope at the knot between two segments, keeping the curve from overshooting either
 * neighbor (Fritsch-Butland). It's flat where the value peaks or dips.
 */
function monotoneSlope(hBefore: number, hAfter: number, dBefore: number, dAfter: number): number {
	if (dBefore * dAfter <= 0) return 0;
	const weightBefore = 2 * hAfter + hBefore;
	const weightAfter = hAfter + 2 * hBefore;
	return (weightBefore + weightAfter) / (weightBefore / dBefore + weightAfter / dAfter);
}

/**
 * Builds a smooth curve through knots. Straight blends would change slope abruptly at
 * each knot, which shows as a faint ridge in a slow gradient. A looping curve spans 0 to
 * 1 and joins its ends; otherwise it levels out at its ends and holds them beyond.
 */
function createSpline(positions: number[], knots: number[][], looping: boolean) {
	const count = positions.length;
	const last = count - 1;
	const next = (i: number) => (i + 1) % count;
	const previous = (i: number) => (i + count - 1) % count;

	// The final segment crosses the end of the loop.
	const lengths = positions.map((at, i) => positions[next(i)] - at + (i === last ? 1 : 0));
	const slopes = knots.map((knot, i) => knot.map((v, c) => (knots[next(i)][c] - v) / lengths[i]));
	const tangents = knots.map((knot, i) =>
		knot.map((_, c) =>
			!looping && (i === 0 || i === last)
				? 0
				: monotoneSlope(lengths[previous(i)], lengths[i], slopes[previous(i)][c], slopes[i][c])
		)
	);

	return (position: number): number[] => {
		if (!looping && position <= positions[0]) return knots[0];
		if (!looping && position >= positions[last]) return knots[last];

		// Before the first knot is the end of the loop's final segment.
		const unwrapped = position < positions[0] ? position + 1 : position;
		let segment = last;
		for (let i = 0; i < last; i++) {
			if (unwrapped >= positions[i] && unwrapped < positions[i + 1]) segment = i;
		}

		const h = lengths[segment];
		const t = (unwrapped - positions[segment]) / h;
		const t2 = t * t;
		const t3 = t2 * t;
		return knots[segment].map(
			(from, c) =>
				(2 * t3 - 3 * t2 + 1) * from +
				(t3 - 2 * t2 + t) * h * tangents[segment][c] +
				(-2 * t3 + 3 * t2) * knots[next(segment)][c] +
				(t3 - t2) * h * tangents[next(segment)][c]
		);
	};
}

/** Bakes stops into RGBA float pixels holding OKLab colors along a loop. */
export function bakeLoopingRamp(stops: ColorStop[], size: number): Float32Array {
	const spline = createSpline(
		stops.map((stop) => stop.at),
		stops.map((stop) => hexToOklab(stop.color)),
		true
	);
	const pixels = new Float32Array(size * 4);
	for (let texel = 0; texel < size; texel++) {
		pixels.set([...spline((texel + 0.5) / size), 1], texel * 4);
	}
	return pixels;
}

/**
 * Bakes one row per ramp into RGBA float pixels holding OKLab colors and opacity, with
 * size samples per row spanning distances from 0 to maxDistance.
 */
export function bakeFrameRamps(
	ramps: FrameStop[][],
	size: number,
	maxDistance: number
): Float32Array {
	const pixels = new Float32Array(size * ramps.length * 4);
	ramps.forEach((stops, row) => {
		const spline = createSpline(
			stops.map((stop) => stop.at),
			stops.map((stop) => [...hexToOklab(stop.color), stop.opacity]),
			false
		);
		for (let texel = 0; texel < size; texel++) {
			pixels.set(spline(((texel + 0.5) / size) * maxDistance), (row * size + texel) * 4);
		}
	});
	return pixels;
}
