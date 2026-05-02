<script lang="ts">
	import Slider from './slider.svelte';
	import debounce from '$lib/utils/debounce';
	import { changeBrightness } from '$lib/data/backend';
	// Currently set brightness value, 0-255.
	export let initialValue: number | undefined;
	export let entityid: string;

	$: initialPercent = initialValue ? initialValue / 255 : 0;
	$: percentage = initialPercent;

	const debouncedChangeBrightness = debounce(500, changeBrightness);

	function handleChange(newPercentage: number) {
		percentage = newPercentage;
		debouncedChangeBrightness(entityid, percentage * 255);
	}
</script>

<style>
	.container {
		width: 100%;
		margin-top: 1em;
	}
	.container > h2 {
		font-size: 1.2em;
		text-align: center;
		font-weight: 600;
		margin-top: 0.25em;
		color: white;
	}
</style>

<div class="container">
	<h2>Brightness</h2>
	<Slider
		background="linear-gradient(to right, #5d6387, white)"
		{initialPercent}
		onChange={handleChange}
	/>
</div>
