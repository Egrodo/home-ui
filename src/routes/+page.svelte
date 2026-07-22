<script lang="ts">
	import { isConnectedStore } from '$lib/data/backend';
	import Loader from '$lib/Loader.svelte';
	import Pager from '$lib/pager/Pager.svelte';
	import HomePage from '$lib/pages/HomePage.svelte';
	import SecondPage from '$lib/pages/SecondPage.svelte';
	import TouchProbe from '$lib/pager/TouchProbe.svelte';
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
	<TouchProbe />
	{#if !$isConnectedStore}
		<Loader />
	{:else}
		<Pager>
			<HomePage slot="page1" />
			<SecondPage slot="page2" />
		</Pager>
	{/if}
</div>
