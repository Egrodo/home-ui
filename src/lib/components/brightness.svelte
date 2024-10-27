<script lang="ts">
	import type { AppConnections } from '$lib/data/types';

	import Slider from './slider.svelte';
	import debounce from '$lib/utils/debounce';
	import { changeLightBrightness } from '$lib/data/ws';
	// Currently set brightness value, 0-255.
	export let initialValue: number | undefined;
	export let entityid: string;
	export let data: AppConnections;

	$: initialPercent = initialValue ? initialValue / 255 : 0;
	$: percentage = initialPercent;

	const debouncedChangeLightBrightness = debounce(500, changeLightBrightness);

	function handleChange(newPercentage: number) {
		percentage = newPercentage;
		debouncedChangeLightBrightness(data.wsConnection, entityid, percentage * 255);
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
