<script lang="ts">
	import type { AppConnections, GameConfig, GameState, PongEvent } from '$lib/data/types';
	import type { Writable } from 'svelte/store';

	import { onMount } from 'svelte';
	import Setup from './setup.svelte';
	import Playing from './playing.svelte';
	import Endgame from './endgame.svelte';
	import Register from './register.svelte';
	import { subscribeToPongEvents } from '$lib/data/pongEventBus';
	import Loader from '$lib/components/Loader.svelte';

	export let data: AppConnections;

	const MAX_SCORE_OPTIONS = [3, 5, 8, 11, 13, 21];
	const INITIAL_MAX_SCORE = 11;
	const INITIAL_SERVE_COUNT = 3;

	// Local store for raw feed of ZHA events. Rather than creating this as an app-wide
	// store in stores.ts, we can keep it local so it will be destroyed if user navs away.
	let pongEventStore: Writable<PongEvent[]> | null;

	let gameConfig: GameConfig | null; // Defined after register step to default values
	let endGameState: GameState | null = null; // Defined after game is over for display in ENDGAME

	onMount(() => {
		// No need to validate connection bc layout should have done it before rendering this page
		const [_pongEventStore, unsub] = subscribeToPongEvents(
			data.wsConnection,
			data.deviceLookupTable
		);

		pongEventStore = _pongEventStore;

		pongEventStore.subscribe(console.log);

		return () => Promise.resolve(unsub).then((u) => u());
	});

	enum GAME_STAGE {
		REGISTER,
		SETUP,
		PLAYING,
		ENDGAME
	}

	let currentStage = GAME_STAGE.REGISTER;

	const onBack = () => {
		if (currentStage === GAME_STAGE.REGISTER) {
			window.location.replace('/');
			return;
		} else if (currentStage === GAME_STAGE.SETUP) {
			currentStage = GAME_STAGE.REGISTER;
		} else if (currentStage === GAME_STAGE.PLAYING) {
			currentStage = GAME_STAGE.SETUP;
		} else if (currentStage === GAME_STAGE.ENDGAME) {
			currentStage = GAME_STAGE.PLAYING;
		} else throw new Error('In an invalid game state somehow?');
	};

	const onNewGame = () => {
		// If restart game can go straight into another assuming same settings;
		// if user wants to change settings they can just use back btn
		endGameState = null;
		pongEventStore?.set([]);
		currentStage = GAME_STAGE.PLAYING;
	};

	function handleRegisterSubmit(opts: { blueBtnName: string; redBtnName: string }) {
		gameConfig = {
			blueBtnName: opts.blueBtnName,
			redBtnName: opts.redBtnName,
			maxScore: INITIAL_MAX_SCORE,
			maxScoreOptions: MAX_SCORE_OPTIONS,
			serveCount: INITIAL_SERVE_COUNT,
			firstPlayer: 'blue'
		};
		currentStage = GAME_STAGE.SETUP;
	}

	const onSetupSubmit = (maxScore: number, serveCount: number, whoFirst: 'blue' | 'red'): void => {
		gameConfig = {
			blueBtnName: gameConfig?.blueBtnName ?? '', // This nullish coalesor should never hit bc register comes before setup, just type safety
			redBtnName: gameConfig?.redBtnName ?? '',
			maxScore,
			maxScoreOptions: MAX_SCORE_OPTIONS,
			serveCount,
			firstPlayer: whoFirst === 'blue' ? 'blue' : 'red'
		};

		// Patch bug where PLAYING is init'd with existing pong events by resetting pongEventBus here
		pongEventStore?.set([]);
		currentStage = GAME_STAGE.PLAYING;
	};

	const onGameEnd = (gameState: GameState): void => {
		endGameState = gameState;
		currentStage = GAME_STAGE.ENDGAME;
	};
</script>

<style>
	:global(body) {
		--pong-background: #ffedd8;

		--pong-blue: #7fd0ff;
		--pong-red: #f54b61;
	}

	.Pong {
		height: 100%;
		width: 100%;
		border: 2em solid black;
		background-color: var(--pong-background);
	}
</style>

<section class="Pong">
	{#if pongEventStore == null}
		<Loader />
	{:else if currentStage === GAME_STAGE.REGISTER}
		<Register {onBack} {pongEventStore} {gameConfig} onSubmit={handleRegisterSubmit} />
	{:else if gameConfig && currentStage === GAME_STAGE.SETUP}
		<Setup {onBack} {gameConfig} onSubmit={onSetupSubmit} />
	{:else if gameConfig && currentStage === GAME_STAGE.PLAYING}
		<Playing {gameConfig} {onBack} {pongEventStore} {onGameEnd} {data} />
	{:else if endGameState && currentStage === GAME_STAGE.ENDGAME}
		<Endgame {onNewGame} {endGameState} />
	{/if}
</section>
