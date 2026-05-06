export function tempColor(temp: number, unit: string): string {
	const f = unit === '°C' ? (temp * 9) / 5 + 32 : temp;
	const cold = { r: 30, g: 74, b: 140 };
	const mid = { r: 200, g: 120, b: 48 };
	const hot = { r: 140, g: 30, b: 30 };

	let r: number, g: number, b: number;
	if (f <= 40) {
		({ r, g, b } = cold);
	} else if (f <= 65) {
		const t = (f - 40) / 25;
		r = Math.round(cold.r + t * (mid.r - cold.r));
		g = Math.round(cold.g + t * (mid.g - cold.g));
		b = Math.round(cold.b + t * (mid.b - cold.b));
	} else if (f <= 90) {
		const t = (f - 65) / 25;
		r = Math.round(mid.r + t * (hot.r - mid.r));
		g = Math.round(mid.g + t * (hot.g - mid.g));
		b = Math.round(mid.b + t * (hot.b - mid.b));
	} else {
		({ r, g, b } = hot);
	}
	return `rgb(${r}, ${g}, ${b})`;
}
