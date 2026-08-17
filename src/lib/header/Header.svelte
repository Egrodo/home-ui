<script lang="ts">
	import HeaderRow1 from './HeaderRow1.svelte';
	import HeaderRow2 from './HeaderRow2.svelte';
	import HeaderRow3 from './HeaderRow3.svelte';
</script>

<style>
	.header {
		display: grid;
		/* Date/Time Calendar/Weather TemperatureGraph */
		grid-template-rows: 140px 1fr 140px;
		/* The page column can overflow 1920px when many device cards are visible.
		   Without this the header shrinks and HeaderRow3 gets clipped, so the rows
		   appear to change height as the room filter changes. */
		flex-shrink: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		margin: 24px;
		overflow: hidden;
	}
</style>

<header class="header">
	<HeaderRow1 />
	<HeaderRow2 />
	<HeaderRow3 />
</header>
