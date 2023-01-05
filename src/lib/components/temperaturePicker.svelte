<script lang="ts">
	import Slider from './slider.svelte';
	// Range of temperature supported by selected device in Kelvin
	export let range: [max: number, min: number];

	let kelvin: number = 0;
	function handleChange(percentage: number) {
		const [max, min] = range;
		kelvin = Math.round((min - max) * percentage + max);
	}
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
	<Slider background="linear-gradient(to right, #FFA001, #A6D1FF)" onChange={handleChange} />
	<h1>{kelvin}°</h1>
	<h3>Kelvin</h3>
</div>
