/** A color on a ramp. */
export interface ColorStop {
	/** Position along the ramp, from 0 up to but not including 1. Must increase stop by stop. */
	at: number;
	/** Color as a #rrggbb hex code. */
	color: string;
}

/** A point on the frame, measured inward from the screen's edge. */
export interface FrameStop {
	/** Distance from the edge as a fraction of the screen's short edge. Must increase stop by stop. */
	at: number;
	/** Color as a #rrggbb hex code. Keep it steady into the last stop so the fade stays clean. */
	color: string;
	/** How much the frame hides the interior here: 1 fully, 0 not at all. */
	opacity: number;
}

// ---------- Color ----------

/**
 * The colors scrolling behind the frame, ordered from the top of the ramp down. The ramp
 * is a loop, so the last stop flows back into the first. Colors are reached exactly and
 * blended smoothly between; closer stops make quicker changes. Any length of 1 or more works.
 */
export const INTERIOR_STOPS: ColorStop[] = [
	{ at: 0.0, color: '#2e0f19' }, // warm near-black
	{ at: 0.12, color: '#4d0927' }, // wine
	{ at: 0.24, color: '#490091' }, // violet
	{ at: 0.42, color: '#303cdc' }, // electric blue
	{ at: 0.6, color: '#7a1fb8' }, // purple
	{ at: 0.76, color: '#b5126e' }, // magenta
	{ at: 0.9, color: '#5c0a2a' } // deep crimson
];

/**
 * How much of the ramp fits on screen at once, from just above 0 to 1. Lower values show
 * fewer colors at a time in longer, gentler gradients.
 */
export const INTERIOR_VISIBLE_FRACTION = 0.5;

/**
 * How far the colors bow, in screen heights between the center and the sides. Keeps them
 * from reading as flat horizontal bands. Positive makes a smile, negative a frown, 0 is straight.
 */
export const INTERIOR_CURVE = 0.06;

/**
 * The glowing frame over the interior, from the rim inward. Top applies at the top of the
 * screen, side halfway down, and bottom at the bottom, blending smoothly between them.
 * The corner ramps take over toward the corners; distance reads shorter there as corners round.
 * End each one at opacity 0 and before 0.5, the farthest a pixel can be from an edge.
 */
export const FRAME_STOPS: {
	top: FrameStop[];
	side: FrameStop[];
	bottom: FrameStop[];
	topCorner: FrameStop[];
	bottomCorner: FrameStop[];
} = {
	top: [
		{ at: 0.0, color: '#a80a05', opacity: 1 },
		{ at: 0.02, color: '#ee0301', opacity: 1 },
		{ at: 0.05, color: '#d8402e', opacity: 1 },
		{ at: 0.09, color: '#c8305a', opacity: 0.75 },
		{ at: 0.16, color: '#a8124f', opacity: 0.25 },
		{ at: 0.27, color: '#a8124f', opacity: 0 }
	],
	side: [
		{ at: 0.0, color: '#d63a26', opacity: 1 },
		{ at: 0.03, color: '#fc9b88', opacity: 1 },
		{ at: 0.07, color: '#f5607f', opacity: 1 },
		{ at: 0.11, color: '#c8109a', opacity: 0.9 },
		{ at: 0.18, color: '#a0009a', opacity: 0.5 },
		{ at: 0.32, color: '#a0009a', opacity: 0 }
	],
	bottom: [
		{ at: 0.0, color: '#b00608', opacity: 1 },
		{ at: 0.02, color: '#dc0a2a', opacity: 1 },
		{ at: 0.05, color: '#ec5a80', opacity: 1 },
		{ at: 0.09, color: '#de66ae', opacity: 1 },
		{ at: 0.14, color: '#b860bc', opacity: 0.85 },
		{ at: 0.2, color: '#9a60c4', opacity: 0.45 },
		{ at: 0.31, color: '#9a60c4', opacity: 0 }
	],
	topCorner: [
		{ at: 0.0, color: '#7a0103', opacity: 1 },
		{ at: 0.016, color: '#d21801', opacity: 1 },
		{ at: 0.032, color: '#fe7923', opacity: 1 },
		{ at: 0.048, color: '#f7865f', opacity: 1 },
		{ at: 0.068, color: '#dc5068', opacity: 1 },
		{ at: 0.095, color: '#c02a5a', opacity: 0.85 },
		{ at: 0.14, color: '#a8124f', opacity: 0.42 },
		{ at: 0.24, color: '#a8124f', opacity: 0 }
	],
	bottomCorner: [
		{ at: 0.0, color: '#6a0208', opacity: 1 },
		{ at: 0.016, color: '#a80000', opacity: 1 },
		{ at: 0.032, color: '#f3040a', opacity: 1 },
		{ at: 0.048, color: '#fb434b', opacity: 1 },
		{ at: 0.066, color: '#ea6a96', opacity: 1 },
		{ at: 0.095, color: '#dd49ab', opacity: 0.95 },
		{ at: 0.125, color: '#c045a5', opacity: 0.88 },
		{ at: 0.16, color: '#9a55b8', opacity: 0.62 },
		{ at: 0.27, color: '#9a55b8', opacity: 0 }
	]
};

/** How far the corner ramps reach along each edge, as a fraction of the short edge. Up to 0.5. */
export const FRAME_CORNER_SIZE = 0.4;

/**
 * How square the frame's corners are, from about 2 (very round) to 8 (nearly square).
 * Inner parts of the frame round off more than the rim, without creases at the diagonals.
 */
export const FRAME_CORNER_SHARPNESS = 3;

// ---------- Motion ----------

/**
 * Seconds for the whole ramp to scroll past once. Higher is slower. Negative scrolls
 * downward instead of upward. Must not be 0; use ANIMATION_SPEED to freeze the image.
 */
export const INTERIOR_LOOP_SECONDS = 48;

/**
 * Seconds per cycle of the waves that combine into the halo's pulse. Unrelated values keep
 * it from feeling like a metronome. Lower is faster. Any length of 1 or more works.
 */
export const HALO_PULSE_PERIODS = [7, 11];

/** How far the halo's inner edge swells and shrinks, as a fraction of its width. 0 holds still. */
export const HALO_REACH_PULSE = 0.1;

/** How much the halo thickens and thins as it pulses. 0 holds its density; keep it below 1. */
export const HALO_DENSITY_PULSE = 0.2;

/**
 * Broad waves moving through the frame, making it uneven and always shifting. x and y are
 * waves per short edge of the screen; keep them low, around 1 or below, for gentle
 * differences. period is seconds per cycle. Any length of 1 or more works.
 */
export const HALO_WAVES = [
	{ x: 0.8, y: 0.35, period: 23 },
	{ x: -0.55, y: 0.7, period: 31 },
	{ x: 0.35, y: -0.95, period: 41 }
];

/** How much the waves widen and narrow the halo, as a fraction of its width. 0 keeps it even. */
export const HALO_UNEVENNESS = 0.2;

/** How far the waves move the frame's colors along its edges, in screen heights. 0 holds them. */
export const HALO_COLOR_WANDER = 0.18;

/** Master speed for all motion. 1 is normal; raise it to preview slow drift quickly; 0 freezes. */
export const ANIMATION_SPEED = 2;

// ---------- Rendering ----------

/** Samples stored for each baked color ramp. Higher is more accurate and uses more memory. */
export const RAMP_SIZE = 1024;

/**
 * Strength of the noise that hides banding, in 8-bit color steps. About 1 is enough;
 * higher becomes visible as grain; 0 turns it off to compare.
 */
export const DITHER_STRENGTH = 1;

/**
 * Whether the dither noise changes every frame. Changing noise averages out for smoother
 * gradients but might fizz on some panels; still noise can crawl as colors move through it.
 */
export const DITHER_ANIMATED = true;
