<script>
	import { weatherStore } from '$lib/data/stores';
	import { formatForecast } from '$lib/utils';
	import Cloudy from 'svelte-material-icons/WeatherCloudy.svelte';
	import Block from './block.svelte';
	const backgroundColor = '#FFE792'; // warm-yellow
	const fontColor = '#000'; // black\

	$: temperature = 0;
	$: forecast = 'Sunny';
	$: humidity = 50;
	weatherStore.subscribe((weatherState) => {
		if (weatherState == null) return;
		temperature = weatherState.attributes.temperature;
		forecast = formatForecast(weatherState.state);
		humidity = weatherState.attributes.humidity;
	});
	// TODO: Correct weather icons
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
		margin: 0.25em 3em;
	}
</style>

<Block {fontColor} {backgroundColor} class="weatherBlock">
	<Cloudy height="8em" width="8em" />
	<h1>
		{temperature}°
	</h1>
	<h2>
		{forecast} with {humidity}% humidity
	</h2>
</Block>
