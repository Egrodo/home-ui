<script lang="ts">
	export const prerender = true;
	import { connectionStore, lightStore, selectedLightIdStore } from '$lib/data/stores';
	import { initWsConnection, handleStateMessage, type WsStateMessage } from '$lib/data/ws';
	import LeftDrawer from '$lib/drawers/left.svelte';
	import MainDrawer from '$lib/drawers/main.svelte';
	import RightDrawer from '$lib/drawers/right.svelte';
	import { Connection, subscribeEntities } from 'home-assistant-js-websocket';
	import { onMount } from 'svelte';

	// If selectedLight is not null, show the right drawer. Otherwise, hide it.
	let selectedLightId: string | null = null;
	selectedLightIdStore.subscribe((newSelectedLightId) => {
		selectedLightId = newSelectedLightId;
	});

	let containerRef: HTMLElement;
	let connection: Connection;

	// Code to eat a touch event after 5 minutes of inactivity
	let timerRef: NodeJS.Timeout;
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

	function startTimerToEatTouchOnce() {
		hasEatenTouch = false;
		containerRef.addEventListener('touchstart', eatTouchAndRestart);
	}

	onMount(async () => {
		// Initialize connection to websocket. Return callback for unsubscribe on unmount
		connection = await initWsConnection();
		connectionStore.set(connection);
		const unsubscribe = subscribeEntities<WsStateMessage>(connection, handleStateMessage);

		/**
		 * The device goes to sleep after some time, and the user has to touch the
		 * screen to wake it up. Therefore we should eat that touch event
		 * so it doesn't accidentally open a menu or something.
		 */
		startTimerToEatTouchOnce();

		return unsubscribe;
	});
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

		background-color: var(--page-background);

		height: var(--page-height);
		width: var(--page-width);
		margin: 0;
	}

	:global(body::-webkit-scrollbar) {
		display: none;
	}

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
