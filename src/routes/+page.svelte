<script lang="ts">
	import { isConnectedStore } from '$lib/data/backend';
	import Loader from '$lib/v2/Loader.svelte';
	import Header from '$lib/v2/header/Header.svelte';
	import Floorplan from '$lib/v2/floorplan/Floorplan.svelte';
	import Devices from '$lib/v2/devices/Devices.svelte';
	import Stocks from '$lib/v2/stocks/Stocks.svelte';
	import LightDrawer from '$lib/v2/drawer/LightDrawer.svelte';

	let hasLoaded = false;
	isConnectedStore.subscribe((v) => (hasLoaded = v));
</script>

<style>
	.container {
		width: 1080px;
		height: 1920px;
		background-color: var(--color-bg);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}
</style>

<div class="container">
	{#if !hasLoaded}
		<Loader />
	{:else}
		<Header />
		<Floorplan />
		<Devices />
		<Stocks />
		<LightDrawer />
	{/if}
</div>
