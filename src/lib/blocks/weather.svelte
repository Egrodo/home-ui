<script lang="ts">
	import type { WeatherStates } from '$lib/data/types';
	import { weatherStore } from '$lib/data/stores';
	import WeatherCloudy from 'svelte-material-icons/WeatherCloudy.svelte';
	import { formatForecast, getWeatherIcon } from '$lib/utils';
	import Block from './block.svelte';
	const backgroundColor = '#FFE792'; // warm-yellow
	const fontColor = '#000'; // black

	let forecast = 'Sunny';
	let humidity = 50;
	let WeatherIcon = WeatherCloudy;

	// We want to allow the user to toggle between °C and °F, regardless of the
	// unit that the weather entity originally provides (givenUnit)
	let givenUnit: '°C' | '°F' = '°F';
	let shownUnit: '°C' | '°F' = '°F';

	// Calculate the temperature by converting the given unit to the selected unit
	let givenTemperature: number = 0;
	$: shownTemperature = givenUnit === shownUnit ? givenTemperature : convertTemp();

	const convertTemp = () => {
		if (givenUnit === '°C') {
			return Number(((givenTemperature * 9) / 5 + 32).toFixed(1));
		} else if (givenUnit === '°F') {
			return Number((((givenTemperature - 32) * 5) / 9).toFixed(1));
		}
	};
	const toggleUnit = () => {
		shownUnit = shownUnit === '°C' ? '°F' : '°C';
	};

	const updateWeatherIcon = async (weatherState: WeatherStates | 'off' | 'on') => {
		WeatherIcon = await getWeatherIcon(weatherState);
	};

	weatherStore.subscribe((weatherState) => {
		if (weatherState == null) return;
		forecast = formatForecast(weatherState.state);
		humidity = weatherState.attributes.humidity;
		givenUnit = weatherState.attributes.temperature_unit;
		givenTemperature = weatherState.attributes.temperature;
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

<Block {fontColor} {backgroundColor} class="weatherBlock" onClick={toggleUnit}>
	<svelte:component this={WeatherIcon} height="8em" width="8em" />
	<h1>
		{shownTemperature}{shownUnit}
	</h1>
	<h2>
		{forecast} with {humidity}% humidity
	</h2>
</Block>
