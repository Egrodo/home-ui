// TODO: Further text processing is needed to handle the case where the forecast is

import type { ComponentType } from 'svelte';
import type { WeatherStates } from './data/types';

// multiple words not being separated by dashes
export function formatForecast(newForecast: string): string {
	const formattedForecast = newForecast.split('-');
	return formattedForecast.map((s) => s[0].toUpperCase() + s.slice(1)).join(' ');
}

export async function getWeatherIcon(
	weatherState: WeatherStates | 'off' | 'on'
): Promise<ComponentType> {
	switch (weatherState) {
		case 'clear-night':
			return (await await import('svelte-material-icons/WeatherNight.svelte'))
				.default as unknown as ComponentType;
		case 'cloudy':
			return (await import('svelte-material-icons/WeatherCloudy.svelte'))
				.default as unknown as ComponentType;
		case 'exceptional':
			return (await import('svelte-material-icons/WeatherSunny.svelte'))
				.default as unknown as ComponentType;
		case 'fog':
			return (await import('svelte-material-icons/WeatherFog.svelte'))
				.default as unknown as ComponentType;
		case 'hail':
			return (await import('svelte-material-icons/WeatherHail.svelte'))
				.default as unknown as ComponentType;
		case 'lightning':
			return (await import('svelte-material-icons/WeatherLightning.svelte'))
				.default as unknown as ComponentType;
		case 'lightning-rainy':
			return (await import('svelte-material-icons/WeatherLightningRainy.svelte'))
				.default as unknown as ComponentType;
		case 'partycloudy':
			return (await import('svelte-material-icons/WeatherCloudy.svelte'))
				.default as unknown as ComponentType;
		case 'pouring':
			return (await import('svelte-material-icons/WeatherPouring.svelte'))
				.default as unknown as ComponentType;
		case 'rainy':
			return (await import('svelte-material-icons/WeatherRainy.svelte'))
				.default as unknown as ComponentType;
		case 'snowy':
			return (await import('svelte-material-icons/WeatherSnowy.svelte'))
				.default as unknown as ComponentType;
		case 'snowy-rainy':
			return (await import('svelte-material-icons/WeatherSnowyRainy.svelte'))
				.default as unknown as ComponentType;
		case 'sunny':
			return (await import('svelte-material-icons/WeatherSunny.svelte'))
				.default as unknown as ComponentType;
		case 'windy':
			return (await import('svelte-material-icons/WeatherWindy.svelte'))
				.default as unknown as ComponentType;
		case 'windy-variant':
			return (await import('svelte-material-icons/WeatherWindyVariant.svelte'))
				.default as unknown as ComponentType;
		default:
			return (await import('svelte-material-icons/WeatherCloudy.svelte'))
				.default as unknown as ComponentType;
	}
}
