<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import Floorplan from '$lib/floorplan/Floorplan.svelte';
	import Devices from '$lib/devices/Devices.svelte';
	import Stocks from '$lib/stocks/Stocks.svelte';
	import LightDrawer from '$lib/drawer/LightDrawer.svelte';
	import { currentPageStore } from '$lib/pager/pagerStore';
	import { lightDrawerStore } from '$lib/drawer/drawerStore';

	// If a swipe that started on the drawer body lands on page 2, dismiss the drawer.
	// (Swipes starting outside the drawer already dismiss it via its document-capture pointerdown.)
	$: if ($currentPageStore !== 0 && $lightDrawerStore !== null) lightDrawerStore.set(null);
</script>

<style>
	.home {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* CRITICAL: LightDrawer is position:absolute bottom:0 and must anchor to
		   page 1, so it rides with page 1 during swipes. */
		position: relative;
	}
</style>

<div class="home">
	<Header />
	<Floorplan />
	<Devices />
	<Stocks />
	<LightDrawer />
</div>
