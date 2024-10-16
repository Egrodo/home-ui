<script>
	import { PUBLIC_HOME_NAME } from '$env/static/public';
	import DateBlock from '$lib/blocks/date.svelte';
	import Pong from '$lib/blocks/pong.svelte';
	import TimeBlock from '$lib/blocks/time.svelte';
	import Weather from '$lib/blocks/weather.svelte';
	import Wifi from '$lib/blocks/wifi.svelte';
</script>

<style>
	.leftDrawer {
		height: 100%;
		width: 25%;
		display: flex;
		flex-direction: column;
		row-gap: 10px;
		padding: 0 1em;
		overflow: auto;
	}

	.leftDrawer > h2 {
		text-align: center;
		color: white;
		margin: 1.5em 0;
		font-weight: 500;
	}
	:global(.leftDrawer > *) {
		min-width: 100%;
	}
	.blockRow {
		display: flex;
		column-gap: 10px;
		align-items: center;
	}
</style>

<section class="leftDrawer">
	<h2 on:click={() => location.reload()}>{PUBLIC_HOME_NAME}</h2>
	<div class="blockRow">
		<DateBlock />
		<TimeBlock />
	</div>
	<Weather />
	<Wifi />
	<Pong />
</section>
