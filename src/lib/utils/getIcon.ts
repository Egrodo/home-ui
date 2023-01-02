import type { ComponentType } from 'svelte';
import type { WeatherStates } from '../data/types';

export async function getIcon(iconName: WeatherStates | string): Promise<ComponentType> {
	if (iconName.includes('mdi:')) iconName = iconName.replace('mdi:', '');
	switch (iconName) {
		case 'clear-night':
			return (await await import('svelte-material-icons/WeatherNight.svelte'))
				.default as unknown as ComponentType;
		case 'weather-sunny':
			return (await await import('svelte-material-icons/WeatherSunny.svelte'))
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
		case 'partlycloudy':
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
		case 'skull-outline':
			return (await import('svelte-material-icons/SkullOutline.svelte'))
				.default as unknown as ComponentType;
		default:
			return (await import('svelte-material-icons/HelpRhombusOutline.svelte'))
				.default as unknown as ComponentType;
	}
}
