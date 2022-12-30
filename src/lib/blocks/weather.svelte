<script lang="ts">
	import type { WeatherStates } from '$lib/data/types';
	import { weatherStore } from '$lib/data/stores';
	import WeatherCloudy from 'svelte-material-icons/WeatherCloudy.svelte';
	import { formatForecast, getWeatherIcon } from '$lib/utils';
	import Block from './block.svelte';
	const backgroundColor = '#FFE792'; // warm-yellow
	const fontColor = '#000'; // black

	$: temperature = 5;
	$: forecast = 'Sunny';
	$: humidity = 50;
	$: WeatherIcon = WeatherCloudy;

	const updateWeatherIcon = async (weatherState: WeatherStates | 'off' | 'on') => {
		WeatherIcon = await getWeatherIcon(weatherState);
	};
	weatherStore.subscribe((weatherState) => {
		if (weatherState == null) return;
		temperature = weatherState.attributes.temperature;
		forecast = formatForecast(weatherState.state);
		humidity = weatherState.attributes.humidity;
		updateWeatherIcon(weatherState.state);
	});
</script>

<style>
	:global(.weatherBlock) {
		align-items: center;
	}

	h1 {
		font-size: 3em;
		font-weight: 600;
		margin: 0;
		letter-spacing: 1px;
	}

	h2 {
		font-size: 1.5em;
		font-weight: 600;
		margin: 0.25em;
	}
</style>

<Block {fontColor} {backgroundColor} class="weatherBlock">
	<svelte:component this={WeatherIcon} height="8em" width="8em" />
	<h1>
		{temperature}°
	</h1>
	<h2>
		{forecast} with {humidity}% humidity
	</h2>
</Block>
