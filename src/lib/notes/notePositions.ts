/** Persistence + default layout for sticky-note positions (localStorage-backed). */

export interface NotePosition {
	x: number;
	y: number;
	/** Stacking order — highest wins; the most recently dragged note is on top. */
	z: number;
}

export type NotePositions = Record<string, NotePosition>;

const STORAGE_KEY = 'stickyNotePositions';

/** Note geometry + board spacing used for the default grid layout. */
export const NOTE_WIDTH = 320;
export const NOTE_MARGIN = 24;
export const BOARD_PADDING = 24;
/** Rough note height, used only for default vertical spacing (notes grow with content). */
const DEFAULT_ROW_HEIGHT = 240;

export function loadPositions(): NotePositions {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as NotePositions) : {};
	} catch {
		return {};
	}
}

export function savePositions(positions: NotePositions): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
	} catch {
		// Ignore quota / serialization errors — positions are non-critical.
	}
}

/** The `index`-th slot of the neat wrapping grid the notes rest in by default. */
function gridSlot(index: number, boardWidth: number): { x: number; y: number } {
	const usable = boardWidth - BOARD_PADDING * 2 + NOTE_MARGIN;
	const perRow = Math.max(1, Math.floor(usable / (NOTE_WIDTH + NOTE_MARGIN)));
	const col = index % perRow;
	const row = Math.floor(index / perRow);
	return {
		x: BOARD_PADDING + col * (NOTE_WIDTH + NOTE_MARGIN),
		y: BOARD_PADDING + row * (DEFAULT_ROW_HEIGHT + NOTE_MARGIN)
	};
}

/** Approximate-rectangle overlap test used only for initial placement. */
function overlaps(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
	return (
		a.x < b.x + NOTE_WIDTH &&
		b.x < a.x + NOTE_WIDTH &&
		a.y < b.y + DEFAULT_ROW_HEIGHT &&
		b.y < a.y + DEFAULT_ROW_HEIGHT
	);
}

/**
 * First grid slot that doesn't collide with an already-placed note. This keeps a
 * newly discovered list from dropping on top of notes the user has dragged around
 * — placement is aware of where notes actually are, not just their index.
 */
export function findFreeSlot(
	occupied: { x: number; y: number }[],
	boardWidth: number
): { x: number; y: number } {
	for (let i = 0; i < 500; i++) {
		const slot = gridSlot(i, boardWidth);
		if (!occupied.some((pos) => overlaps(pos, slot))) return slot;
	}
	return gridSlot(occupied.length, boardWidth);
}
