/** A setting that wanders randomly and smoothly between min and max. */
export interface DriftRange {
	min: number;
	max: number;
	/** Seconds between new random targets. Lower values change more restlessly. */
	period: number;
}

export interface NumberRange {
	min: number;
	max: number;
}

export interface Shape {
	/** 0 circle, 1 polygon/star, 2 soft flower. */
	type: number;
	/** Sides, points, or lobes. */
	n: number;
	/** Star sharpness, or flower amplitude. */
	m: number;
}

export const between = (min: number, max: number) => min + Math.random() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const circle = (): Shape => ({ type: 0, n: 1, m: 0 });
const polygon = (sides: number): Shape => ({ type: 1, n: sides, m: sides });
const star = (points: number, sharpness: number): Shape => ({ type: 1, n: points, m: sharpness });
const flower = (lobes: number, amplitude: number): Shape => ({ type: 2, n: lobes, m: amplitude });

// ---------- Rendering ----------

/**
 * Resolution of the expensive shape and warp calculation, relative to the screen. Lower
 * is faster but rounds the sharp seams between shapes. 1 is exact, 0.5 draws a quarter
 * of the pixels, 0.25 a sixteenth. Bands, outlines and grain always stay full resolution.
 */
export const FIELD_SCALE = 0.25;

// ---------- Color ----------

/** Band colors as #rrggbb hex codes, used in order and repeating. Any length of 1 or more works. */
export const PALETTE = [
	'#d8322a',
	'#ea7426',
	'#f1c93a',
	'#e9e04a',
	'#7db82c',
	'#4fa3d6',
	'#4a62ad',
	'#6c3f92',
	'#c4378a'
];

/** Color of the thin outline between bands, as a #rrggbb hex code. */
export const LINE_COLOR = '#140f12';

/** Outline thickness in pixels. 0 removes the outlines. */
export const LINE_WEIGHT = 1.5;

/** How much the screen darkens toward its corners. 0 is none; higher is darker. */
export const VIGNETTE = 0.09;

/** Strength of the static film grain. Drifts for a subtly changing paper texture. */
export const GRAIN: DriftRange = { min: 0.02, max: 0.08, period: 50 };

// ---------- Overall motion ----------

/** Master speed for all motion and drifting. 1 is normal, 0.5 half speed, 2 double speed. */
export const ANIMATION_SPEED = 1;

/** Converts the BAND_FLOW value into bands per second. */
export const FLOW_RATE = 2;

/** How fast bands flow outward from the shapes. Negative values flow inward. */
export const BAND_FLOW: DriftRange = { min: 0.02, max: 0.35, period: 40 };

/** How fast shapes wander and spin. */
export const MORPH: DriftRange = { min: 0.05, max: 0.55, period: 40 };

// ---------- Bands and distortion ----------

/** Width of each color band, as a fraction of the screen's short edge. */
export const BAND_WIDTH: DriftRange = { min: 0.03, max: 0.1, period: 28 };

/** How strongly the bands are bent out of shape. 0 leaves perfect geometric outlines. */
export const WARP: DriftRange = { min: 0.06, max: 0.5, period: 22 };

/** How much neighboring shapes melt together. 0 keeps the sharp V-shaped seams between them. */
export const ROUNDING: DriftRange = { min: 0, max: 0.18, period: 32 };

/** Size of the bending pattern. Lower values make broad curves; higher makes tight wiggles. */
export const WOBBLE_SCALE = 0.5;

/** Layers of detail in the bending pattern. Each adds fine detail and costs GPU time. */
export const NOISE_OCTAVES = 4;

/** How fast the bending pattern evolves over time. */
export const NOISE_SPEED = 0.05;

/** Size of the loop the bending pattern travels. Larger takes longer to repeat. */
export const NOISE_RADIUS = 40;

// ---------- Shapes ----------

/**
 * The most shapes that can exist at once. Sets the shader's size, and every slot is
 * evaluated for every FIELD_SCALE pixel, so this is a direct performance control.
 */
export const SEED_SLOTS = 6;

/** How many shapes are visible at a time. Keep max at or below SEED_SLOTS. */
export const SEED_COUNT: DriftRange = { min: 3, max: SEED_SLOTS, period: 45 };

/** Seconds for a shape to fully appear or disappear. */
export const SEED_FADE_SECONDS = 20;

/** How far a hidden shape sits below the surface. Must be large enough to stay out of view. */
export const SEED_SINK_DEPTH = 1.8;

/** Size of each new shape's core, as a fraction of the screen's short edge. */
export const SEED_RADIUS: NumberRange = { min: 0.05, max: 0.18 };

/** Width of the area shapes appear in. The short edge of the screen spans 1, so 1 fills it. */
export const SEED_SPAWN_WIDTH = 1.6;

/** Height of the area shapes appear in. The portrait screen spans about 1.78, in the same units. */
export const SEED_SPAWN_HEIGHT = 1.6;

/** How far each shape wanders from its home position. */
export const SEED_ORBIT_RADIUS = 0.12;

/** Range of each shape's wandering rate along x and y. Differing rates create looping paths. */
export const SEED_ORBIT_FREQUENCY: NumberRange = { min: 0.3, max: 1 };

/** Offsets the vertical wander from the horizontal, so paths aren't simple diagonals. */
export const SEED_ORBIT_PHASE_SKEW = 1.3;

/** How fast shapes rotate, relative to MORPH. 0 stops them turning. */
export const SEED_SPIN_RATE = 0.5;

/** The shapes to choose from, picked with equal chance. Repeat an entry to make it more common. */
export const SHAPES: (() => Shape)[] = [
	() => circle(),
	() => polygon(3),
	() => polygon(4),
	() => polygon(5),
	() => polygon(6),
	() => polygon(8),
	() => star(5, between(2.2, 3)),
	() => star(intBetween(6, 8), between(2.4, 3.6)),
	() => star(intBetween(12, 17), between(4, 7)), // starburst
	() => flower(intBetween(3, 7), between(0.2, 0.45))
];
