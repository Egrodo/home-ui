<script lang="ts">
	import { isConnectedStore } from '$lib/data/backend';
	import Loader from '$lib/Loader.svelte';
	import Header from '$lib/header/Header.svelte';
	import Floorplan from '$lib/floorplan/Floorplan.svelte';
	import Devices from '$lib/devices/Devices.svelte';
	import Stocks from '$lib/stocks/Stocks.svelte';
	import LightDrawer from '$lib/drawer/LightDrawer.svelte';

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
	{#if !$isConnectedStore}
		<Loader />
	{:else}
		<Header />
		<Floorplan />
		<Devices />
		<Stocks />
		<LightDrawer />
	{/if}
</div>
