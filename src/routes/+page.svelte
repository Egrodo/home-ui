<script lang="ts">
	import { selectedLightIdStore } from '$lib/data/stores';
	import LeftDrawer from '$lib/drawers/left.svelte';
	import MainDrawer from '$lib/drawers/main.svelte';
	import RightDrawer from '$lib/drawers/right.svelte';
	import { Connection, subscribeEntities } from 'home-assistant-js-websocket';

	// If selectedLight is not null, show the right drawer. Otherwise, hide it.
	let selectedLightId: string | null = null;
	selectedLightIdStore.subscribe((newSelectedLightId) => {
		selectedLightId = newSelectedLightId;
	});

	let containerRef: HTMLElement;

	// Code to eat a touch event after 5 minutes of inactivity
	let timerRef: number | undefined;
	let hasEatenTouch = false;
	const eatTouchAndRestart = (e: TouchEvent) => {
		if (hasEatenTouch === false) {
			e.preventDefault();
			e.stopPropagation();
			hasEatenTouch = true;
		}

		// Let each touch event restart the timer and kill the last
		clearTimeout(timerRef);
		timerRef = setTimeout(startTimerToEatTouchOnce, 5 * 60 * 1000);
	};

	/**
	 * The device goes to sleep after some time, and the user has to touch the
	 * screen to wake it up. Therefore we should eat that touch event
	 * so it doesn't accidentally open a menu or something.
	 *
	 * 10/10/24: The device doesn't go to sleep rn so no need for this
	 */
	function startTimerToEatTouchOnce() {
		hasEatenTouch = false;
		containerRef.addEventListener('touchstart', eatTouchAndRestart);
	}
</script>

<style>
	.container {
		background-color: var(--page-background);
		height: 100%;
		width: 100%;
		display: flex;
	}
</style>

<div class="container" bind:this={containerRef}>
	<LeftDrawer />
	<MainDrawer />
	<RightDrawer lightId={selectedLightId} />
</div>
