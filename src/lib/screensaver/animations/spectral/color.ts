import { hexToOklab } from '../../oklab';
import type { ColorStop, FrameStop } from './config';

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
export function bakeDistanceRamps(
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
