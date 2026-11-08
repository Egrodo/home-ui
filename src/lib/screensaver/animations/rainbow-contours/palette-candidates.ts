import { createDeck } from '../../deck';
import { hexToOklab, oklabToHex } from '../../oklab';
import type { Lab } from '../../oklab';
import type { Palette } from './config';

/** A palette proposed for review, and the family it came from. */
export interface Candidate {
	family: string;
	palette: Palette;
}

interface Family {
	name: string;
	/** Soft, print-like colors that candidates are varied from. */
	anchors: string[];
	/** Outline color as a #rrggbb hex code. */
	line: string;
}

const DARK_LINE = '#140f12';
const CREAM_LINE = '#f1e7d3';

const FAMILIES: Family[] = [
	{
		name: '70s stripes',
		anchors: ['#f3e3c3', '#e0a526', '#dd7a26', '#b5482a', '#6e3b23', '#8a8a3c', '#d9b88a'],
		line: DARK_LINE
	},
	{
		name: 'coastal',
		anchors: ['#1f3a5f', '#2f7f8f', '#7fc4b8', '#e7d6b0', '#f2efe3', '#d98a6a', '#4a6fa5'],
		line: DARK_LINE
	},
	{
		name: 'riso print',
		anchors: ['#ef8fb2', '#f0735f', '#f6d97c', '#a5dcc0', '#9aa6e8', '#fbeedd', '#e06a8e'],
		line: DARK_LINE
	},
	{
		name: 'forest',
		anchors: ['#55682f', '#97a77b', '#c9a23c', '#b8623a', '#2f4a35', '#e3d9b7', '#7d5a3a'],
		line: DARK_LINE
	},
	{
		name: 'plum',
		anchors: ['#3b2a58', '#5d3f86', '#8a69b5', '#bda6d8', '#e9e0ef', '#f2b84b', '#d6699a'],
		line: DARK_LINE
	},
	{
		name: 'night',
		anchors: ['#152238', '#2d2f5f', '#54305f', '#7a2c4f', '#1f4f55', '#8a6a2c', '#34523d'],
		line: CREAM_LINE
	}
];

/** Fewest bands in a candidate. */
const MIN_BANDS = 5;
/** Most bands in a candidate, limited further by how many anchors its family has. */
const MAX_BANDS = 9;

/** Largest random change to an anchor's OKLab lightness. */
const LIGHTNESS_VARIATION = 0.04;
/** Largest random change to an anchor's chroma, as a fraction of it. */
const CHROMA_VARIATION = 0.2;
/** Largest random change to an anchor's hue, in radians. */
const HUE_VARIATION = 0.17;
/** Upper limit on chroma, which keeps flat bands soft rather than vibrating against each other. */
const MAX_CHROMA = 0.18;

/** Touching bands, including last and first, must be at least this far apart in OKLab. */
const MIN_NEIGHBOR_DISTANCE = 0.09;
/** The average lightness change between touching bands must reach this, or they turn to mush. */
const MIN_AVERAGE_LIGHTNESS_STEP = 0.06;
/** Every band must differ from the outline by this much lightness, or the outline disappears. */
const MIN_LINE_CONTRAST = 0.12;

/** Tries before giving up on a family, which only happens if the rules above are too strict. */
const MAX_ATTEMPTS = 2000;

const pairs = <T>(items: T[]) => items.map((item, i) => [item, items[(i + 1) % items.length]]);

const hue = ([, a, b]: Lab) => Math.atan2(b, a);

function vary(hex: string, random: () => number): Lab {
	const [L, a, b] = hexToOklab(hex);
	const spread = (range: number) => (random() * 2 - 1) * range;
	const chroma = Math.min(MAX_CHROMA, Math.hypot(a, b) * (1 + spread(CHROMA_VARIATION)));
	const angle = Math.atan2(b, a) + spread(HUE_VARIATION);
	return [L + spread(LIGHTNESS_VARIATION), chroma * Math.cos(angle), chroma * Math.sin(angle)];
}

function shuffled<T>(items: T[], random: () => number): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/** Whether touching bands read clearly apart, and against the outline. */
export function isGoodSequence(bands: Lab[], line: Lab): boolean {
	const neighbors = pairs(bands);
	const lightnessStep = neighbors.reduce((sum, [p, q]) => sum + Math.abs(p[0] - q[0]), 0);
	return (
		neighbors.every(
			([p, q]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) >= MIN_NEIGHBOR_DISTANCE
		) &&
		lightnessStep / neighbors.length >= MIN_AVERAGE_LIGHTNESS_STEP &&
		bands.every((band) => Math.abs(band[0] - line[0]) >= MIN_LINE_CONTRAST)
	);
}

function propose(family: Family, random: () => number): Palette {
	const line = hexToOklab(family.line);
	const most = Math.min(MAX_BANDS, family.anchors.length);
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const count = MIN_BANDS + Math.floor(random() * (most - MIN_BANDS + 1));
		const picked = shuffled(family.anchors, random)
			.slice(0, count)
			.map((hex) => vary(hex, random));
		// Half sweep around the hues like a spectrum; half are in any order.
		const bands = random() < 0.5 ? picked.sort((p, q) => hue(p) - hue(q)) : picked;
		// Judged after conversion, since clamping and rounding can nudge a color past a limit.
		const hexes = bands.map(oklabToHex);
		if (isGoodSequence(hexes.map(hexToOklab), line)) return { bands: hexes, line: family.line };
	}
	throw new Error(`No acceptable palette found for the "${family.name}" family`);
}

/** Returns a function that proposes an endless stream of candidates, rotating through families. */
export function createCandidateSource(random: () => number = Math.random) {
	const families = createDeck(FAMILIES, random);
	return (): Candidate => {
		const family = families.next();
		return { family: family.name, palette: propose(family, random) };
	};
}
