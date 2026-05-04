const MAX_COLORS = 8;

function key(entityId: string) {
	return `color_history_${entityId}`;
}

// 3 elements → RGB color; 4 elements → color temperature (first 3 for display, 4th is Kelvin)
export type HistoryEntry = [number, number, number] | [number, number, number, number];

export function getColorHistory(entityId: string): HistoryEntry[] {
	try {
		const raw = localStorage.getItem(key(entityId));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function addToHistory(entityId: string, entry: HistoryEntry): HistoryEntry[] {
	const sig = entry.join(',');
	const deduped = getColorHistory(entityId).filter((e) => e.join(',') !== sig);
	const updated: HistoryEntry[] = [entry, ...deduped].slice(0, MAX_COLORS);
	localStorage.setItem(key(entityId), JSON.stringify(updated));
	return updated;
}
