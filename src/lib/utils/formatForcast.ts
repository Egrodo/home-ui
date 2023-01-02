// TODO: Further text processing is needed to handle the case where the forecast is
// multiple words not being separated by dashes
export function formatForecast(newForecast: string): string {
	const formattedForecast = newForecast.split('-');
	return formattedForecast.map((s) => s[0].toUpperCase() + s.slice(1)).join(' ');
}
