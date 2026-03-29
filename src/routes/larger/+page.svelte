<script lang="ts">
	import { isConnectedStore } from '$lib/data/backend';
	import Loader from '$lib/components/Loader.svelte';

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
	}
</style>

<div class="container">
	<Loader />
</div>
