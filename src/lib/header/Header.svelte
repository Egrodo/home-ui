<script lang="ts">
	import HeaderRow1 from './HeaderRow1.svelte';
	import HeaderRow2 from './HeaderRow2.svelte';
	import HeaderRow3 from './HeaderRow3.svelte';
</script>

<style>
	.header {
		display: grid;
		grid-template-rows: 140px 1fr 100px;
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
