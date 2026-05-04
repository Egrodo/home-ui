export type TemperatureUnit = '°C' | '°F';

export function displayTemp(temp: number, sourceUnit: TemperatureUnit, showFahrenheit: boolean): string {
	if (showFahrenheit && sourceUnit === '°C') {
		return Math.round((temp * 9) / 5 + 32) + '°F';
	}
	if (!showFahrenheit && sourceUnit === '°F') {
		return Math.round(((temp - 32) * 5) / 9) + '°C';
	}
	return Math.round(temp) + sourceUnit;
}
