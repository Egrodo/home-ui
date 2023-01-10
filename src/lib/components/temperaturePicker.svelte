<script lang="ts">
	import Slider from './slider.svelte';
	// Range of temperature supported by selected device in Kelvin
	export let range: [max: number, min: number];
	export let initialValue: number = 0;
	$: kelvin = initialValue ?? 0;
	function handleChange(percentage: number) {
		console.log(`change to ${percentage}`);
		const [max, min] = range;
		kelvin = Math.round((min - max) * percentage + max);

		// TODO: Debounce send command
	}

	// Since kelvin has the high value at the left and the low value on the right, invert the percentage
	// before passing to Slider.
	$: initialPercent = (initialValue - range[1]) / (range[0] - range[1]);
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
		background="linear-gradient(to right, #FFA001, #A6D1FF)"
		onChange={handleChange}
	/>
	<h1>{kelvin}°</h1>
	<h3>Kelvin</h3>
</div>
