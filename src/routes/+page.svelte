<script lang="ts">
	import { selectedLightIdStore } from '$lib/data/stores';
	import LeftDrawer from '$lib/drawers/left.svelte';
	import MainDrawer from '$lib/drawers/main.svelte';
	import RightDrawer from '$lib/drawers/right.svelte';

	// If selectedLight is not null, show the right drawer. Otherwise, hide it.
	let selectedLightId: string | null = null;
	selectedLightIdStore.subscribe((newSelectedLightId) => {
		selectedLightId = newSelectedLightId;
	});

	let _containerRef: HTMLElement;
</script>

<style>
	.container {
		background-color: var(--page-background);
		height: 100%;
		width: 100%;
		display: flex;
	}
</style>

<div class="container" bind:this={_containerRef}>
	<LeftDrawer />
	<MainDrawer />
	<RightDrawer lightId={selectedLightId} />
</div>
