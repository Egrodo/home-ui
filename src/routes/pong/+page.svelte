<script lang="ts">
	import type { HassEvent } from 'home-assistant-js-websocket/dist/types';
	import { connectionStore } from '$lib/data/stores';
	import { Connection } from 'home-assistant-js-websocket';
	import { onMount } from 'svelte';
	import Setup from './setup.svelte';
	import Playing from './playing.svelte';
	import Endgame from './endgame.svelte';

	// WS STUFF
	let connection: Connection;

	const EVENT_NAME = 'zha_event';

	interface PlayerData {
		score: number; // Total score for this player
		pointTs: string[]; // Timestamps for each point that's scored
	}
	// There can only be two devices playing; I don't know a good way to set up which
	// device is which, probably will have to be a setup screen (press device 1, now press device 2).
	const gameState = new Map<string, PlayerData>();

	function handleEvent(event: HassEvent) {
		console.log(event);

		// TODO: This needs to do different things for each different game stage
		try {
			const deviceId = event.data['device_id'];
			console.count(deviceId);

			const currentPlayerState = gameState.get(deviceId) ?? {
				score: 0,
				pointTs: []
			};

			currentPlayerState.score += 1;
			currentPlayerState.pointTs.push(event.time_fired);

			gameState.set(deviceId, currentPlayerState);
		} catch (err) {
			console.error('Failed to handle ZHA event', err);
		}

		console.log(gameState);
	}
	onMount(async () => {
		let unsubscribe;
		// Subscribe to the connection store, get connection, use it to subscribe to ZHA events,
		// unregister this listener on unmount of the page.
		connectionStore.subscribe((c) => {
			if (!c) return;
			connection = c;
			connection.subscribeEvents<HassEvent>(handleEvent, EVENT_NAME).then((u) => (unsubscribe = u));
		});
		return unsubscribe;
	});

	// GAME STUFF
	enum GAME_STAGE {
		SETUP,
		PLAYING,
		ENDGAME
	}

	let currentStage = GAME_STAGE.SETUP;
</script>

<style>
	:global(body) {
		--pong-background: #ffedd8;
	}

	.Pong {
		height: 100%;
		width: 100%;
		border: 2em solid black;
		background-color: var(--pong-background);
	}
</style>

<section class="Pong">
	{#if currentStage === GAME_STAGE.SETUP}
		<Setup />
	{:else if currentStage === GAME_STAGE.PLAYING}
		<Playing />
	{:else if currentStage === GAME_STAGE.ENDGAME}
		<Endgame />
	{/if}
</section>
