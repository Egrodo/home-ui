<script lang="ts">
	import Slider from './slider.svelte';
	import debounce from '$lib/utils/debounce';
	import { changeLightTemperature } from '$lib/data/ws';
	// Range of temperature supported by selected device in Kelvin
	export let range: [max: number, min: number];
	export let initialValue: number = range[0];
	export let entityid: string;

	// Kelvin is source of truth, displayedKelvin will tween for large changes
	$: kelvin = initialValue ?? range[0];
	let displayedKelvin = initialValue ?? range[0];

	const debouncedChangeLightTemperature = debounce(500, changeLightTemperature);

	let intervalId: NodeJS.Timer;
	function tweenToKelvin(newKelvin: number) {
		const difference = Math.abs(newKelvin - kelvin);
		const duration = Math.min(500, difference / 2);
		const start = Date.now();
		const startingVal = displayedKelvin;
		const newVal = newKelvin;
		clearInterval(intervalId);
		intervalId = setInterval(() => {
			const elapsed = Date.now() - start;
			const percent = elapsed / duration;
			if (percent >= 1) {
				clearInterval(intervalId);
				displayedKelvin = newVal;
			} else {
				displayedKelvin = Math.round((newVal - startingVal) * percent + startingVal);
			}
		}, 10);
	}

	function handleChange(percentage: number) {
		const [max, min] = range;
		const newKelvin = Math.round((min - max) * percentage + max);
		const difference = Math.abs(newKelvin - kelvin);
		if (difference > 100) {
			// If user quickly switches kelvin to a new value more than 500 away,
			// lets animate the transition (go from startingVal to newVal)
			tweenToKelvin(newKelvin);
		} else {
			displayedKelvin = newKelvin;
		}
		kelvin = newKelvin;

		debouncedChangeLightTemperature(entityid, kelvin);
	}

	// Since kelvin has the high value at the left and the low value on the right, invert the percentage
	// before passing to Slider.
	$: initialPercent = 1 - (initialValue - range[1]) / (range[0] - range[1]);

	// If user quickly switches kelvin to a new value more than 500 away,
	// lets animate the transition (go from startingVal to newVal)
</script>

<style>
	.container {
		width: 100%;
		padding-top: 3em;
	}
	.container > h1 {
		font-size: 3em;
		text-align: center;
		font-weight: 600;
		margin: 0.5em 0 0 0;
		color: white;
	}
	.container > h3 {
		font-size: 1.2em;
		text-align: center;
		font-weight: 600;
		margin: 0;
		color: white;
	}
</style>

<div class="container">
	<Slider
		{initialPercent}
		background="linear-gradient(to right, #A6D1FF, #FFA001)"
		onChange={handleChange}
	/>
	<h1>{displayedKelvin}°</h1>
	<h3>Kelvin</h3>
</div>
