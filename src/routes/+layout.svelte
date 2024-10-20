<script lang="ts">
	import type { AppConnections } from '$lib/data/types';
	import LoadingIcon from 'svelte-material-icons/Loading.svelte';

	export let data: AppConnections;

	$: hasLoaded = data.wsConnection !== null && data.wsConnection?.connected === true;
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');

	:global(*) {
		font-family: 'Open Sans', sans-serif;
		box-sizing: border-box;
		user-select: none;
	}

	:global(body) {
		/* Page globals */
		--page-background: #0c0d16;
		--page-light-font-color: #f3f4f5;
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

	.loading {
		height: 100%;
		width: 100%;
		background-color: var(--page-background);
		color: var(--page-light-font-color);

		display: flex;
		align-items: center;
		justify-content: center;
	}

	@keyframes loading-animation {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.loader {
		animation: ease-in-out loading-animation 1s infinite;
	}
</style>

{#if hasLoaded === true}
	<slot />
{:else}
	<section class="loading">
		<span class="loader">
			<LoadingIcon height={150} width={150} />
		</span>
	</section>
{/if}
