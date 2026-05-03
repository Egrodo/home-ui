const MAX_COLORS = 8;

function key(entityId: string) {
	return `color_history_${entityId}`;
}

export function getColorHistory(entityId: string): [number, number, number][] {
	try {
		const raw = localStorage.getItem(key(entityId));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function addColorToHistory(
	entityId: string,
	rgb: [number, number, number]
): [number, number, number][] {
	const deduped = getColorHistory(entityId).filter(
		([r, g, b]) => !(r === rgb[0] && g === rgb[1] && b === rgb[2])
	);
	const updated: [number, number, number][] = [rgb, ...deduped].slice(0, MAX_COLORS);
	localStorage.setItem(key(entityId), JSON.stringify(updated));
	return updated;
}
