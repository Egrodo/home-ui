<script lang="ts">
	import { isConnectedStore } from '$lib/data/backend';
	import Loader from '$lib/v1/components/Loader.svelte';
	import Header from '$lib/v1/components/larger/Header.svelte';

	let hasLoaded = false;
	isConnectedStore.subscribe((connected) => {
		hasLoaded = connected;
	});
</script>

<style>
	.container {
		width: 1080px;
		height: 1920px;
		background-color: var(--page-background);
		display: flex;
		flex-direction: column;
	}
</style>

<div class="container">
	{#if !hasLoaded}
		<Loader />
	{:else}
		<Header />
	{/if}
</div>
