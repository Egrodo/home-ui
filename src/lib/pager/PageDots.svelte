<script lang="ts">
	import { currentPageStore, PAGE_COUNT } from './pagerStore';
	import { lightDrawerStore } from '$lib/drawer/drawerStore';
</script>

<style>
	.dots {
		position: absolute;
		bottom: 26px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 14px;
		/* Purely decorative; never steals touches. */
		pointer-events: none;
		transition: opacity 300ms ease;
	}

	/* Fade out while the LightDrawer is open (drawer covers the bottom of the screen). */
	.dots--hidden {
		opacity: 0;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--ink-3) 45%, transparent);
		/* background-color already transitions via the global theme.css rule. */
		transition: transform 300ms ease;
	}

	.dot--active {
		background: var(--ink-2);
		transform: scale(1.25);
	}
</style>

<div class="dots" class:dots--hidden={$lightDrawerStore !== null} aria-hidden="true">
	{#each Array(PAGE_COUNT) as _, i}
		<div class="dot" class:dot--active={$currentPageStore === i}></div>
	{/each}
</div>
