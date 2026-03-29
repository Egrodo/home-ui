<script lang="ts">
	import { isConnectedStore } from '$lib/data/backend';
	import { selectedLightIdStore } from '$lib/data/stores';
	import Loader from '$lib/components/Loader.svelte';
	import LeftDrawer from '$lib/drawers/left.svelte';
	import MainDrawer from '$lib/drawers/main.svelte';
	import RightDrawer from '$lib/drawers/right.svelte';

	let hasLoaded = false;
	isConnectedStore.subscribe((connected) => {
		hasLoaded = connected;
	});

	let selectedLightId: string | null = null;
	selectedLightIdStore.subscribe((newSelectedLightId) => {
		selectedLightId = newSelectedLightId;
	});

	let _containerRef: HTMLElement;
</script>

<style>
	.container {
		background-color: var(--page-background);
		width: 1360px;
		height: 768px;
		display: flex;
	}
</style>

<div class="container" bind:this={_containerRef}>
	{#if hasLoaded}
		<LeftDrawer />
		<MainDrawer />
		<RightDrawer lightId={selectedLightId} />
	{:else}
		<Loader />
	{/if}
</div>
