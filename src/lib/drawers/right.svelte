<script lang="ts">
	export let open: boolean = false;
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
</script>

<style>
	.rightDrawer {
		height: 100%;
		width: 25%;
		max-width: 0%;
		transition: max-width 0.75s cubic-bezier(0.19, 0.86, 0.47, 1);
		overflow: hidden;

		background-color: green;
	}

	.open {
		max-width: 25%;
	}

	.contents {
		padding: 0 1em;
		overflow: auto;
	}

	.blocksContainer {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
	}
</style>

<section class="rightDrawer" class:open>
	{#if open}
		<div class="contents" transition:fly={{ y: 10 }}>
			<div class="blocksContainer" />
		</div>
	{/if}
</section>
