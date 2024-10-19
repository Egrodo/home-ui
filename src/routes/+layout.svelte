<script lang="ts">
	import type { AppConnections } from '$lib/data/types';

	export let data: AppConnections;

	const hasLoaded = data.wsConnection !== null && data.wsConnection?.connected === true;
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');

	:global(*) {
		font-family: 'Open Sans', sans-serif;
		box-sizing: border-box;
		user-select: none;
	}

	:global(body) {
		/* Page size globals */
		--page-background: #0c0d16;
		--page-height: 768px;
		--page-width: 1360px;
		--page-drawer-background: #1f212e;

		/* Block globals */
		--block-border-radius: 32px;
		--block-padding: 38px;
		--block-default-light-color: #fff7dc;
		--block-default-dark-color: #1f212e;

		height: var(--page-height);
		width: var(--page-width);
		margin: 0;
	}

	:global(body::-webkit-scrollbar) {
		display: none;
	}
</style>

{#if hasLoaded === true}
	<slot />
{:else}
	<div class="loading">Loading...</div>
{/if}
