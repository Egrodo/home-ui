<script lang="ts">
	import { isConnectedStore } from '$lib/data/backend';
	import Loader from '$lib/Loader.svelte';
	import Pager from '$lib/pager/Pager.svelte';
	import HomePage from '$lib/pages/HomePage.svelte';
	import SecondPage from '$lib/pages/SecondPage.svelte';
	import { lightDrawerStore } from '$lib/drawer/drawerStore';
	import Screensaver from '$lib/screensaver/Screensaver.svelte';

	let pager: Pager | undefined;

	// Waking always lands on a known state. Leaving page 2 also ends any note editing.
	function resetToHome() {
		pager?.goToFirstPage();
		lightDrawerStore.set(null);
	}
</script>

<style>
	.container {
		width: 1080px;
		height: 1920px;
		background-color: var(--color-bg);
		color: var(--ink-1);
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
		<Pager bind:this={pager}>
			<HomePage slot="page1" />
			<SecondPage slot="page2" />
		</Pager>
	{/if}
	<Screensaver onActivate={resetToHome} />
</div>
