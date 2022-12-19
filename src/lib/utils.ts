export function formatForecast(newForecast: string): string {
	const formattedForecast = newForecast.split('-');
	return formattedForecast.map((s) => s[0].toUpperCase() + s.slice(1)).join(' ');
}
