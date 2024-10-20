<script lang="ts">
	import type { HassEvent } from 'home-assistant-js-websocket/dist/types';
	import type { AppConnections } from '$lib/data/types';

	import { onMount } from 'svelte';
	import Setup from './setup.svelte';
	import Playing from './playing.svelte';
	import Endgame from './endgame.svelte';

	export let data: AppConnections;

	const EVENT_NAME = 'zha_event';

	interface PlayerData {
		score: number; // Total score for this player
		pointTs: string[]; // Timestamps for each point that's scored
	}
	// There can only be two devices playing; I don't know a good way to set up which
	// device is which, probably will have to be a setup screen (press device 1, now press device 2).
	const gameState = new Map<string, PlayerData>();

	function handleEvent(event: HassEvent) {
		// TODO: This needs to do different things for each different game stage
		try {
			const deviceId = event.data['device_id'];

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

	const unsubs: (() => void)[] = [];
	onMount(() => {
		// No need to validate connection bc layout should have done it before rendering this page
		data.wsConnection
			.subscribeEvents<HassEvent>(handleEvent, EVENT_NAME)
			.then((u) => unsubs.push(u))
			.catch((err) => console.error('Failed to subscribe to ZHA event', err));

		return () => unsubs.map((u) => u());
	});

	// GAME STUFF
	enum GAME_STAGE {
		SETUP,
		PLAYING,
		ENDGAME
	}

	let currentStage = GAME_STAGE.SETUP;

	const onBack = () => {
		if (currentStage === GAME_STAGE.SETUP) {
			return;
		} else if (currentStage === GAME_STAGE.PLAYING) {
			currentStage = GAME_STAGE.ENDGAME;
		} else if (currentStage === GAME_STAGE.ENDGAME) {
			currentStage = GAME_STAGE.SETUP;
		} else throw new Error('In an invalid game state somehow?');
	};
	const onSetupSubmit = (maxScore: number, serveCount: number, whoFirst: 0 | 1): void => {
		console.log(
			`Starting game with: maxScore: ${maxScore}, serveCount: ${serveCount}, whoFirst: ${players[whoFirst]}`
		);
		// TODO: store this
		currentStage = GAME_STAGE.PLAYING;
	};
	// TODO: systemetize
	const players = ['Noah', 'Jordan'];
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
		<Setup {players} {onBack} onSubmit={onSetupSubmit} />
	{:else if currentStage === GAME_STAGE.PLAYING}
		<Playing />
	{:else if currentStage === GAME_STAGE.ENDGAME}
		<Endgame />
	{/if}
</section>
