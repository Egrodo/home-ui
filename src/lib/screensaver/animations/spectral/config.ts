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

/** A soft shape held at the center of the screen, in front of the scrolling colors. */
export interface Core {
	/** Half the width of its flat center, as a fraction of the screen's short edge. */
	halfWidth: number;
	/** Half the height of its flat center, as a fraction of the screen's short edge. */
	halfHeight: number;
	/**
	 * The core's colors, measured outward from its flat center. Top applies above it, side
	 * beside it and bottom below it, blending smoothly between them. End each at opacity 0.
	 */
	top: FrameStop[];
	side: FrameStop[];
	bottom: FrameStop[];
}

/** The complete set of colors for one showing of the animation. */
export interface Palette {
	/** Identifies the palette; only used for debugging. */
	name: string;
	/**
	 * The colors scrolling behind the frame, ordered from the top of the ramp down. The ramp
	 * is a loop, so the last stop flows back into the first. Colors are reached exactly and
	 * blended smoothly between; closer stops make quicker changes. Any length of 1 or more works.
	 */
	interior: ColorStop[];
	/** The shape at the center of the screen. Leave it out for an open interior. */
	core?: Core;
	/**
	 * The glowing frame over the interior, from the rim inward. Top applies at the top of the
	 * screen, side halfway down, and bottom at the bottom, blending smoothly between them.
	 * The corner ramps take over toward the corners; distance reads shorter there as corners round.
	 * End each one at opacity 0 and before 0.5, the farthest a pixel can be from an edge.
	 */
	frame: {
		top: FrameStop[];
		side: FrameStop[];
		bottom: FrameStop[];
		topCorner: FrameStop[];
		bottomCorner: FrameStop[];
	};
}

// ---------- Color ----------

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

/** How far the corner ramps reach along each edge, as a fraction of the short edge. Up to 0.5. */
export const FRAME_CORNER_SIZE = 0.4;

/**
 * How square the frame's corners are, from about 2 (very round) to 8 (nearly square).
 * Inner parts of the frame round off more than the rim, without creases at the diagonals.
 */
export const FRAME_CORNER_SHARPNESS = 3;

/**
 * Chance that a showing includes its palette's core, from 0 (never) to 1 (always).
 * A palette with no core is always shown without one.
 */
export const CORE_CHANCE = 0.5;

/**
 * How square the core's rings are, from 2 (round) to about 8 (nearly square). Applies
 * outside its flat center, so higher values turn a capsule into a rounded rectangle.
 */
export const CORE_CORNER_SHARPNESS = 2;

/** The farthest a core's stops can reach from its center, as a fraction of the short edge. */
export const CORE_RAMP_RANGE = 0.6;

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

/**
 * Seconds per cycle of the waves that combine into the core's slow breathing. Unrelated
 * values keep it irregular, and differing from the halo's keeps the two out of step.
 */
export const CORE_BREATH_PERIODS = [13, 19];

/** How far the core grows and shrinks, as a fraction of its size. 0 holds it still. */
export const CORE_BREATH = 0.06;

/** How far HALO_WAVES bend the core's shape, as a fraction of the short edge. 0 keeps it true. */
export const CORE_WOBBLE = 0.012;

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

// ---------- Palettes ----------

/**
 * The known-good color sets. Each showing of the animation takes the next one, playing
 * every palette once in a shuffled order before any repeats. Any length of 1 or more works.
 */
export const PALETTES: Palette[] = [
	{
		name: 'crimson-indigo',
		interior: [
			{ at: 0.0, color: '#2e0f19' }, // warm near-black
			{ at: 0.12, color: '#4d0927' }, // wine
			{ at: 0.24, color: '#490091' }, // violet
			{ at: 0.42, color: '#303cdc' }, // electric blue
			{ at: 0.6, color: '#7a1fb8' }, // purple
			{ at: 0.76, color: '#b5126e' }, // magenta
			{ at: 0.9, color: '#5c0a2a' } // deep crimson
		],
		frame: {
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
		}
	},
	{
		name: 'violet-lagoon',
		interior: [
			{ at: 0, color: '#5291cf' },
			{ at: 0.126, color: '#409bc5' },
			{ at: 0.253, color: '#268fb6' },
			{ at: 0.43, color: '#128fb4' },
			{ at: 0.607, color: '#0f8cb3' },
			{ at: 0.734, color: '#0796b8' },
			{ at: 0.86, color: '#5388c1' }
		],
		core: {
			halfWidth: 0.04,
			halfHeight: 0.219,
			top: [
				{ at: 0, color: '#001647', opacity: 1 },
				{ at: 0.03, color: '#012e55', opacity: 1 },
				{ at: 0.07, color: '#01546b', opacity: 1 },
				{ at: 0.11, color: '#107a79', opacity: 0.95 },
				{ at: 0.15, color: '#2b8f87', opacity: 0.7 },
				{ at: 0.2, color: '#2b8f87', opacity: 0.35 },
				{ at: 0.27, color: '#2b8f87', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#040035', opacity: 1 },
				{ at: 0.03, color: '#040035', opacity: 1 },
				{ at: 0.07, color: '#091d4c', opacity: 1 },
				{ at: 0.11, color: '#1c7882', opacity: 0.95 },
				{ at: 0.15, color: '#248e97', opacity: 0.7 },
				{ at: 0.2, color: '#248e97', opacity: 0.35 },
				{ at: 0.27, color: '#248e97', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#001647', opacity: 1 },
				{ at: 0.03, color: '#012d54', opacity: 1 },
				{ at: 0.07, color: '#025068', opacity: 1 },
				{ at: 0.11, color: '#137070', opacity: 0.95 },
				{ at: 0.15, color: '#22827a', opacity: 0.7 },
				{ at: 0.2, color: '#22827a', opacity: 0.35 },
				{ at: 0.27, color: '#22827a', opacity: 0 }
			]
		},
		frame: {
			top: [
				{ at: 0, color: '#2d2058', opacity: 1 },
				{ at: 0.03, color: '#5749a9', opacity: 1 },
				{ at: 0.06, color: '#7b98e8', opacity: 1 },
				{ at: 0.09, color: '#a19ce5', opacity: 1 },
				{ at: 0.13, color: '#7892ce', opacity: 0.85 },
				{ at: 0.18, color: '#559bc6', opacity: 0.55 },
				{ at: 0.25, color: '#559bc6', opacity: 0.2 },
				{ at: 0.33, color: '#559bc6', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#1c1040', opacity: 1 },
				{ at: 0.03, color: '#312e8d', opacity: 1 },
				{ at: 0.06, color: '#5c67cd', opacity: 1 },
				{ at: 0.09, color: '#8876cb', opacity: 1 },
				{ at: 0.13, color: '#7b8cc9', opacity: 0.85 },
				{ at: 0.18, color: '#4d8bc9', opacity: 0.55 },
				{ at: 0.25, color: '#4d8bc9', opacity: 0.2 },
				{ at: 0.33, color: '#4d8bc9', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#33255f', opacity: 1 },
				{ at: 0.03, color: '#5c3eaa', opacity: 1 },
				{ at: 0.06, color: '#7d77d9', opacity: 1 },
				{ at: 0.09, color: '#688eb5', opacity: 1 },
				{ at: 0.13, color: '#5d8bbf', opacity: 0.85 },
				{ at: 0.18, color: '#139fb2', opacity: 0.55 },
				{ at: 0.25, color: '#139fb2', opacity: 0.2 },
				{ at: 0.33, color: '#139fb2', opacity: 0 }
			],
			topCorner: [
				{ at: 0, color: '#020106', opacity: 1 },
				{ at: 0.03, color: '#1c1645', opacity: 1 },
				{ at: 0.06, color: '#477dd5', opacity: 1 },
				{ at: 0.09, color: '#779de2', opacity: 1 },
				{ at: 0.13, color: '#5694c6', opacity: 0.85 },
				{ at: 0.18, color: '#4b99ca', opacity: 0.55 },
				{ at: 0.25, color: '#4b99ca', opacity: 0.2 },
				{ at: 0.33, color: '#4b99ca', opacity: 0 }
			],
			bottomCorner: [
				{ at: 0, color: '#04041d', opacity: 1 },
				{ at: 0.03, color: '#2b2488', opacity: 1 },
				{ at: 0.06, color: '#7558e9', opacity: 1 },
				{ at: 0.09, color: '#7486ca', opacity: 1 },
				{ at: 0.13, color: '#7580c5', opacity: 0.85 },
				{ at: 0.18, color: '#2196bc', opacity: 0.55 },
				{ at: 0.25, color: '#2196bc', opacity: 0.2 },
				{ at: 0.33, color: '#2196bc', opacity: 0 }
			]
		}
	},
	{
		name: 'solar-amber',
		interior: [
			{ at: 0, color: '#fd7b67' },
			{ at: 0.126, color: '#fe8231' },
			{ at: 0.253, color: '#fd7813' },
			{ at: 0.43, color: '#fe7204' },
			{ at: 0.607, color: '#ff7802' },
			{ at: 0.734, color: '#fe9301' },
			{ at: 0.86, color: '#fda30a' }
		],
		core: {
			halfWidth: 0.04,
			halfHeight: 0.326,
			top: [
				{ at: 0, color: '#fd3006', opacity: 1 },
				{ at: 0.03, color: '#fe3609', opacity: 1 },
				{ at: 0.07, color: '#fd460a', opacity: 1 },
				{ at: 0.11, color: '#fe5c0e', opacity: 0.95 },
				{ at: 0.15, color: '#ff7312', opacity: 0.7 },
				{ at: 0.2, color: '#ff7312', opacity: 0.35 },
				{ at: 0.27, color: '#ff7312', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#fe2b01', opacity: 1 },
				{ at: 0.03, color: '#fe3300', opacity: 1 },
				{ at: 0.07, color: '#fe4a00', opacity: 1 },
				{ at: 0.11, color: '#fd6101', opacity: 0.95 },
				{ at: 0.15, color: '#fe7002', opacity: 0.7 },
				{ at: 0.2, color: '#fe7002', opacity: 0.35 },
				{ at: 0.27, color: '#fe7002', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#ff3601', opacity: 1 },
				{ at: 0.03, color: '#fe4201', opacity: 1 },
				{ at: 0.07, color: '#fe5c02', opacity: 1 },
				{ at: 0.11, color: '#fd7d02', opacity: 0.95 },
				{ at: 0.15, color: '#fe9501', opacity: 0.7 },
				{ at: 0.2, color: '#fe9501', opacity: 0.35 },
				{ at: 0.27, color: '#fe9501', opacity: 0 }
			]
		},
		frame: {
			top: [
				{ at: 0, color: '#1d0318', opacity: 1 },
				{ at: 0.03, color: '#401031', opacity: 1 },
				{ at: 0.06, color: '#6e2580', opacity: 1 },
				{ at: 0.09, color: '#a13ba9', opacity: 1 },
				{ at: 0.13, color: '#da639e', opacity: 0.85 },
				{ at: 0.18, color: '#fc7a73', opacity: 0.55 },
				{ at: 0.25, color: '#fc7a73', opacity: 0.2 },
				{ at: 0.33, color: '#fc7a73', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#470431', opacity: 1 },
				{ at: 0.03, color: '#79045a', opacity: 1 },
				{ at: 0.06, color: '#951784', opacity: 1 },
				{ at: 0.09, color: '#ab2f75', opacity: 1 },
				{ at: 0.13, color: '#da426e', opacity: 0.85 },
				{ at: 0.18, color: '#fd5c3d', opacity: 0.55 },
				{ at: 0.25, color: '#fd5c3d', opacity: 0.2 },
				{ at: 0.33, color: '#fd5c3d', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#320730', opacity: 1 },
				{ at: 0.03, color: '#41096f', opacity: 1 },
				{ at: 0.06, color: '#883fa2', opacity: 1 },
				{ at: 0.09, color: '#da8263', opacity: 1 },
				{ at: 0.13, color: '#fda217', opacity: 0.85 },
				{ at: 0.18, color: '#ffaa03', opacity: 0.55 },
				{ at: 0.25, color: '#ffaa03', opacity: 0.2 },
				{ at: 0.33, color: '#ffaa03', opacity: 0 }
			],
			topCorner: [
				{ at: 0, color: '#150102', opacity: 1 },
				{ at: 0.03, color: '#20031a', opacity: 1 },
				{ at: 0.06, color: '#4e1d71', opacity: 1 },
				{ at: 0.09, color: '#8945b3', opacity: 1 },
				{ at: 0.13, color: '#c75aae', opacity: 0.85 },
				{ at: 0.18, color: '#fd776f', opacity: 0.55 },
				{ at: 0.25, color: '#fd776f', opacity: 0.2 },
				{ at: 0.33, color: '#fd776f', opacity: 0 }
			],
			bottomCorner: [
				{ at: 0, color: '#110104', opacity: 1 },
				{ at: 0.03, color: '#410537', opacity: 1 },
				{ at: 0.06, color: '#6f30bb', opacity: 1 },
				{ at: 0.09, color: '#8f68a7', opacity: 1 },
				{ at: 0.13, color: '#d6846e', opacity: 0.85 },
				{ at: 0.18, color: '#fa9e23', opacity: 0.55 },
				{ at: 0.25, color: '#fa9e23', opacity: 0.2 },
				{ at: 0.33, color: '#fa9e23', opacity: 0 }
			]
		}
	},
	{
		name: 'deep-reef',
		interior: [
			{ at: 0, color: '#02617a' },
			{ at: 0.126, color: '#069ba8' },
			{ at: 0.253, color: '#0aa6c1' },
			{ at: 0.43, color: '#0c9ace' },
			{ at: 0.607, color: '#0894db' },
			{ at: 0.734, color: '#0596e1' },
			{ at: 0.86, color: '#52a1e5' }
		],
		core: {
			halfWidth: 0.04,
			halfHeight: 0.272,
			top: [
				{ at: 0, color: '#160154', opacity: 1 },
				{ at: 0.03, color: '#1c0574', opacity: 1 },
				{ at: 0.07, color: '#231a9b', opacity: 1 },
				{ at: 0.11, color: '#2147b1', opacity: 0.95 },
				{ at: 0.15, color: '#0579be', opacity: 0.7 },
				{ at: 0.2, color: '#0579be', opacity: 0.35 },
				{ at: 0.27, color: '#0579be', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#060120', opacity: 1 },
				{ at: 0.03, color: '#05001f', opacity: 1 },
				{ at: 0.07, color: '#0b043f', opacity: 1 },
				{ at: 0.11, color: '#242bad', opacity: 0.95 },
				{ at: 0.15, color: '#087dd1', opacity: 0.7 },
				{ at: 0.2, color: '#087dd1', opacity: 0.35 },
				{ at: 0.27, color: '#087dd1', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#3b097c', opacity: 1 },
				{ at: 0.03, color: '#461794', opacity: 1 },
				{ at: 0.07, color: '#4539ae', opacity: 1 },
				{ at: 0.11, color: '#3068c2', opacity: 0.95 },
				{ at: 0.15, color: '#0a89d2', opacity: 0.7 },
				{ at: 0.2, color: '#0a89d2', opacity: 0.35 },
				{ at: 0.27, color: '#0a89d2', opacity: 0 }
			]
		},
		frame: {
			top: [
				{ at: 0, color: '#02013f', opacity: 1 },
				{ at: 0.03, color: '#08086d', opacity: 1 },
				{ at: 0.06, color: '#051b8a', opacity: 1 },
				{ at: 0.09, color: '#032c80', opacity: 1 },
				{ at: 0.13, color: '#034072', opacity: 0.85 },
				{ at: 0.18, color: '#035774', opacity: 0.55 },
				{ at: 0.25, color: '#035774', opacity: 0.2 },
				{ at: 0.33, color: '#035774', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#010438', opacity: 1 },
				{ at: 0.03, color: '#021884', opacity: 1 },
				{ at: 0.06, color: '#0242cc', opacity: 1 },
				{ at: 0.09, color: '#0461e1', opacity: 1 },
				{ at: 0.13, color: '#0576dc', opacity: 0.85 },
				{ at: 0.18, color: '#0884d7', opacity: 0.55 },
				{ at: 0.25, color: '#0884d7', opacity: 0.2 },
				{ at: 0.33, color: '#0884d7', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#0e0b40', opacity: 1 },
				{ at: 0.03, color: '#2f2a83', opacity: 1 },
				{ at: 0.06, color: '#5761cf', opacity: 1 },
				{ at: 0.09, color: '#6a86e6', opacity: 1 },
				{ at: 0.13, color: '#6c99e5', opacity: 0.85 },
				{ at: 0.18, color: '#61a2e3', opacity: 0.55 },
				{ at: 0.25, color: '#61a2e3', opacity: 0.2 },
				{ at: 0.33, color: '#61a2e3', opacity: 0 }
			],
			topCorner: [
				{ at: 0, color: '#010011', opacity: 1 },
				{ at: 0.03, color: '#070166', opacity: 1 },
				{ at: 0.06, color: '#0d14a9', opacity: 1 },
				{ at: 0.09, color: '#022e8e', opacity: 1 },
				{ at: 0.13, color: '#024a76', opacity: 0.85 },
				{ at: 0.18, color: '#04647e', opacity: 0.55 },
				{ at: 0.25, color: '#04647e', opacity: 0.2 },
				{ at: 0.33, color: '#04647e', opacity: 0 }
			],
			bottomCorner: [
				{ at: 0, color: '#02010c', opacity: 1 },
				{ at: 0.03, color: '#130b6a', opacity: 1 },
				{ at: 0.06, color: '#4b4adf', opacity: 1 },
				{ at: 0.09, color: '#627ceb', opacity: 1 },
				{ at: 0.13, color: '#6199e4', opacity: 0.85 },
				{ at: 0.18, color: '#4d9de7', opacity: 0.55 },
				{ at: 0.25, color: '#4d9de7', opacity: 0.2 },
				{ at: 0.33, color: '#4d9de7', opacity: 0 }
			]
		}
	},
	{
		name: 'verdant',
		interior: [
			{ at: 0, color: '#0cd965' },
			{ at: 0.126, color: '#02c955' },
			{ at: 0.253, color: '#64bb52' },
			{ at: 0.43, color: '#5eb352' },
			{ at: 0.607, color: '#34bc44' },
			{ at: 0.734, color: '#01c64d' },
			{ at: 0.86, color: '#02cf65' }
		],
		core: {
			halfWidth: 0.04,
			halfHeight: 0.298,
			top: [
				{ at: 0, color: '#00523b', opacity: 1 },
				{ at: 0.03, color: '#036243', opacity: 1 },
				{ at: 0.07, color: '#3f9150', opacity: 1 },
				{ at: 0.11, color: '#64bc50', opacity: 0.95 },
				{ at: 0.15, color: '#55c855', opacity: 0.7 },
				{ at: 0.2, color: '#55c855', opacity: 0.35 },
				{ at: 0.27, color: '#55c855', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#016f42', opacity: 1 },
				{ at: 0.03, color: '#01904b', opacity: 1 },
				{ at: 0.07, color: '#4eba48', opacity: 1 },
				{ at: 0.11, color: '#7fc23f', opacity: 0.95 },
				{ at: 0.15, color: '#83b63d', opacity: 0.7 },
				{ at: 0.2, color: '#83b63d', opacity: 0.35 },
				{ at: 0.27, color: '#83b63d', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#01754d', opacity: 1 },
				{ at: 0.03, color: '#018a54', opacity: 1 },
				{ at: 0.07, color: '#39b753', opacity: 1 },
				{ at: 0.11, color: '#1acf3c', opacity: 0.95 },
				{ at: 0.15, color: '#02cf4c', opacity: 0.7 },
				{ at: 0.2, color: '#02cf4c', opacity: 0.35 },
				{ at: 0.27, color: '#02cf4c', opacity: 0 }
			]
		},
		frame: {
			top: [
				{ at: 0, color: '#1d2404', opacity: 1 },
				{ at: 0.03, color: '#365500', opacity: 1 },
				{ at: 0.06, color: '#2bbd09', opacity: 1 },
				{ at: 0.09, color: '#3bd66c', opacity: 1 },
				{ at: 0.13, color: '#4acf7c', opacity: 0.85 },
				{ at: 0.18, color: '#34cf72', opacity: 0.55 },
				{ at: 0.25, color: '#34cf72', opacity: 0.2 },
				{ at: 0.33, color: '#34cf72', opacity: 0 }
			],
			side: [
				{ at: 0, color: '#01250b', opacity: 1 },
				{ at: 0.03, color: '#015a26', opacity: 1 },
				{ at: 0.06, color: '#41aa76', opacity: 1 },
				{ at: 0.09, color: '#5dc5a2', opacity: 1 },
				{ at: 0.13, color: '#12cc9f', opacity: 0.85 },
				{ at: 0.18, color: '#03ca83', opacity: 0.55 },
				{ at: 0.25, color: '#03ca83', opacity: 0.2 },
				{ at: 0.33, color: '#03ca83', opacity: 0 }
			],
			bottom: [
				{ at: 0, color: '#02340b', opacity: 1 },
				{ at: 0.03, color: '#018404', opacity: 1 },
				{ at: 0.06, color: '#02d355', opacity: 1 },
				{ at: 0.09, color: '#09c17d', opacity: 1 },
				{ at: 0.13, color: '#02c860', opacity: 0.85 },
				{ at: 0.18, color: '#02cf51', opacity: 0.55 },
				{ at: 0.25, color: '#02cf51', opacity: 0.2 },
				{ at: 0.33, color: '#02cf51', opacity: 0 }
			],
			topCorner: [
				{ at: 0, color: '#010101', opacity: 1 },
				{ at: 0.03, color: '#151b01', opacity: 1 },
				{ at: 0.06, color: '#1bb302', opacity: 1 },
				{ at: 0.09, color: '#46e471', opacity: 1 },
				{ at: 0.13, color: '#60dc6d', opacity: 0.85 },
				{ at: 0.18, color: '#02d762', opacity: 0.55 },
				{ at: 0.25, color: '#02d762', opacity: 0.2 },
				{ at: 0.33, color: '#02d762', opacity: 0 }
			],
			bottomCorner: [
				{ at: 0, color: '#011801', opacity: 1 },
				{ at: 0.03, color: '#015714', opacity: 1 },
				{ at: 0.06, color: '#02b06d', opacity: 1 },
				{ at: 0.09, color: '#10b4a3', opacity: 1 },
				{ at: 0.13, color: '#03ca7d', opacity: 0.85 },
				{ at: 0.18, color: '#02cc6b', opacity: 0.55 },
				{ at: 0.25, color: '#02cc6b', opacity: 0.2 },
				{ at: 0.33, color: '#02cc6b', opacity: 0 }
			]
		}
	}
];
