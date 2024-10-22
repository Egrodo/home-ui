<script lang="ts">
	import type { GameConfig, GameState, PongEvent } from '$lib/data/types';
	import type { Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import BackBtn from '$lib/components/backBtn.svelte';
	import TennisIcon from 'svelte-material-icons/Tennis.svelte';

	export let onBack: () => void;
	export let onGameEnd: (gameState: GameState) => void;
	export let gameConfig: GameConfig;
	export let pongEventStore: Writable<PongEvent[]>;

	const { blueBtnName, redBtnName, maxScore, serveCount, firstPlayer } = gameConfig;

	let gameState: GameState = {};

	let whoServing = firstPlayer;

	function handleEvent(pongEventBus: PongEvent[]) {
		const lastEvent = pongEventBus[pongEventBus.length - 1];
		if (!lastEvent) return;
		const { deviceName } = lastEvent;
		if (deviceName !== blueBtnName && deviceName !== redBtnName) {
			console.error('Point scored with nonregistered device?', lastEvent, gameConfig);
			return;
		}

		const currentPlayerData = gameState[deviceName] ?? {
			score: 0,
			pointTs: [],
			whichColor: deviceName === blueBtnName ? 'blue' : 'red'
		};

		currentPlayerData.score += 1;
		currentPlayerData.pointTs.push(lastEvent.timestamp);

		const newGameState = { ...gameState, [deviceName]: currentPlayerData };

		if (currentPlayerData.score === maxScore) {
			// TODO: In the case where someone wins without the other player gaining a single point, we
			// should create a PlayerData for them anyways.
			if (Object.keys(newGameState).length === 1) {
				newGameState['fillerUser'] = {
					score: 0,
					pointTs: [],
					whichColor: deviceName === blueBtnName ? 'red' : 'blue'
				};
			}
			onGameEnd(newGameState);
			return;
		}

		const totalScore = Object.values(newGameState).reduce((acc, { score }) => acc + score, 0);
		// If totalScore % serveCount === 0, toggle whoServing
		if (totalScore > 0 && totalScore % serveCount === 0) {
			whoServing = whoServing === 'blue' ? 'red' : 'blue';
		}

		gameState = newGameState;
		console.log({ gameState });
		// For Svelte reactivity reasons, we need to re-set the value of gameState each time
	}

	onMount(() => {
		const unsub = pongEventStore.subscribe(handleEvent);
		return unsub;
	});

	let derivedBlueScoreStr = '00';
	let derivedRedScoreStr = '00';
	$: {
		if (blueBtnName && gameState[blueBtnName]) {
			derivedBlueScoreStr = gameState[blueBtnName].score.toString().padStart(2, '0');
		}
		if (redBtnName && gameState[redBtnName]) {
			derivedRedScoreStr = gameState[redBtnName].score.toString().padStart(2, '0');
		}
	}

	// TODO: Padd max score
</script>

<style>
	.playing {
		display: flex;
		height: 100%;
	}
	.side {
		flex-grow: 1;
		flex-basis: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 10em;
		position: relative;
	}
	.side > h1 {
		margin: 0;
		font-weight: 500;
		position: relative;
	}
	.blue {
		background-color: var(--pong-blue);
	}
	.red {
		background-color: var(--pong-red);
	}
	.divider {
		height: 10px;
		background-color: white;
		width: 2em;
	}
	.servingIcon {
		position: absolute;
		top: 0;
	}
	.blue .servingIcon {
		right: 0.5em;
	}
	.red .servingIcon {
		left: 0.5em;
	}
</style>

<section class="playing">
	<BackBtn {onBack} />
	<div class="side blue">
		<h1>{derivedBlueScoreStr}</h1>
		<div class="divider" />
		<h1>{maxScore}</h1>
		{#if whoServing === 'blue'}
			<span class="servingIcon"><TennisIcon width={96} height={96} /></span>
		{/if}
	</div>
	<div class="side red">
		<h1>{derivedRedScoreStr}</h1>
		<div class="divider" />
		<h1>{maxScore}</h1>
		{#if whoServing === 'red'}
			<span class="servingIcon"><TennisIcon width={96} height={96} /></span>
		{/if}
	</div>
</section>
