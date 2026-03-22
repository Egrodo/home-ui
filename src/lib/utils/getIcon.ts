import type { ComponentType } from 'svelte';
import type { WeatherStates } from '../data/types';

const weatherIconMap: Record<string, string> = {
	'clear-night': 'WeatherNight',
	'weather-sunny': 'WeatherSunny',
	cloudy: 'WeatherCloudy',
	exceptional: 'WeatherSunny',
	fog: 'WeatherFog',
	hail: 'WeatherHail',
	lightning: 'WeatherLightning',
	'lightning-rainy': 'WeatherLightningRainy',
	partlycloudy: 'WeatherCloudy',
	pouring: 'WeatherPouring',
	rainy: 'WeatherRainy',
	snowy: 'WeatherSnowy',
	'snowy-rainy': 'WeatherSnowyRainy',
	sunny: 'WeatherSunny',
	windy: 'WeatherWindy',
	'windy-variant': 'WeatherWindyVariant'
};

function toPascalCase(name: string): string {
	return name
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');
}

const allIcons = import.meta.glob<{ default: ComponentType }>(
	'/node_modules/svelte-material-icons/*.svelte'
);

async function loadIcon(pascalName: string): Promise<ComponentType> {
	const path = `/node_modules/svelte-material-icons/${pascalName}.svelte`;
	const loader = allIcons[path];
	if (!loader)
		return (
			await allIcons['/node_modules/svelte-material-icons/HelpRhombusOutline.svelte']!()
		).default;
	return (await loader()).default;
}

export async function getIcon(iconName: WeatherStates | string): Promise<ComponentType> {
	if (iconName.includes('mdi:')) {
		return await loadIcon(toPascalCase(iconName.replace('mdi:', '')));
	}

	const mapped = weatherIconMap[iconName];
	if (mapped) return await loadIcon(mapped);
	return await loadIcon('HelpRhombusOutline');
}
