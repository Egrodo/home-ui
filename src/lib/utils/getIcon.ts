// Maps HA weather condition strings (non-mdi: prefixed) to @mdi/js keys
const weatherIconMap: Record<string, string> = {
	'clear-night': 'mdiWeatherNight',
	'weather-sunny': 'mdiWeatherSunny',
	cloudy: 'mdiWeatherCloudy',
	exceptional: 'mdiWeatherSunny',
	fog: 'mdiWeatherFog',
	hail: 'mdiWeatherHail',
	lightning: 'mdiWeatherLightning',
	'lightning-rainy': 'mdiWeatherLightningRainy',
	partlycloudy: 'mdiWeatherPartlyCloudy',
	pouring: 'mdiWeatherPouring',
	rainy: 'mdiWeatherRainy',
	snowy: 'mdiWeatherSnowy',
	'snowy-rainy': 'mdiWeatherSnowyRainy',
	sunny: 'mdiWeatherSunny',
	windy: 'mdiWeatherWindy',
	'windy-variant': 'mdiWeatherWindyVariant'
};

function toMdiKey(kebabName: string): string {
	return (
		'mdi' +
		kebabName
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join('')
	);
}

export function getIconKey(iconName: string): string {
	if (iconName.startsWith('mdi:')) {
		return toMdiKey(iconName.slice(4));
	}
	return weatherIconMap[iconName] ?? 'mdiHelpRhombusOutline';
}
