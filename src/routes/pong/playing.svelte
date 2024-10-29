<script lang="ts">
	import type { AppConnections, GameConfig, GameState, PongEvent } from '$lib/data/types';
	import type { Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import BackBtn from '$lib/components/backBtn.svelte';
	import TennisIcon from 'svelte-material-icons/Tennis.svelte';
	import { changeLightColor } from '$lib/data/ws';

	const ENTITY_NAME_FOR_WHO_SERVING_LIGHT = 'light.sconce_2';

	export let onBack: () => void;
	export let onGameEnd: (gameState: GameState) => void;
	export let gameConfig: GameConfig;
	export let pongEventStore: Writable<PongEvent[]>;
	export let data: AppConnections;

	const { blueBtnName, redBtnName, maxScore, serveCount, firstPlayer } = gameConfig;

	// We need to track maxScore separately from GameConfig in case we need to increase it at the end.
	let ourMaxScore = maxScore;

	let gameState: GameState = {};

	let whoServing = firstPlayer;

	const helperInvertColor = (c: 'blue' | 'red') => (c === 'blue' ? 'red' : 'blue');
	const helperDeviceToColorStr = (deviceName: string) =>
		deviceName === blueBtnName ? 'blue' : 'red';
	const helperGetBlankPlayerData = (whichColor: 'blue' | 'red') => ({
		score: 0,
		pointTs: [],
		whichColor
	});

	function handleEvent(pongEventBus: PongEvent[]) {
		const lastEvent = pongEventBus[pongEventBus.length - 1];
		if (!lastEvent) return;
		const { deviceName } = lastEvent;
		if (deviceName !== blueBtnName && deviceName !== redBtnName) {
			console.error('Point scored with nonregistered device?', lastEvent, gameConfig);
			return;
		}

		const currentPlayerData =
			gameState[deviceName] ?? helperGetBlankPlayerData(helperDeviceToColorStr(deviceName));
		const otherPlayerData =
			(deviceName === redBtnName ? gameState[blueBtnName] : gameState[redBtnName]) ??
			helperGetBlankPlayerData(helperInvertColor(helperDeviceToColorStr(deviceName)));

		currentPlayerData.score += 1;
		currentPlayerData.pointTs.push(lastEvent.timestamp);

		const playerIsNearWinning = currentPlayerData.score === ourMaxScore - 1;
		const otherPlayerIsNearWinning = otherPlayerData.score === ourMaxScore - 1;

		const newGameState = { ...gameState, [deviceName]: currentPlayerData };

		if (currentPlayerData.score === ourMaxScore) {
			// In the case where someone wins without the other player gaining a single point, we
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
		// If one player is ourMaxScore - 1 the other should be serving until they're also at ourMaxScore - 1
		// TODO: BUG: there's one more rule; if player A was 1 point away and thus serve went to player B, but then
		// player B also got 1 point away, player B should continue to serve.
		console.log({ playerIsNearWinning, otherPlayerIsNearWinning });
		if (playerIsNearWinning) {
			whoServing = helperInvertColor(currentPlayerData.whichColor);

			// TODO: Set the color of the light to `whoServing`
			const rgbValue: [number, number, number] = whoServing === 'blue' ? [0, 0, 255] : [255, 0, 0];
			changeLightColor(data.wsConnection, ENTITY_NAME_FOR_WHO_SERVING_LIGHT, rgbValue);
		} else if (
			otherPlayerIsNearWinning === false &&
			totalScore > 0 &&
			totalScore % serveCount === 0
		) {
			whoServing = helperInvertColor(whoServing);
			// TODO: Set the color of the light to `whoServing`l\
			const rgbValue: [number, number, number] = whoServing === 'blue' ? [0, 0, 255] : [255, 0, 0];
			changeLightColor(data.wsConnection, ENTITY_NAME_FOR_WHO_SERVING_LIGHT, rgbValue);
		}

		// For Svelte reactivity reasons, we need to re-set the value of gameState each time
		gameState = newGameState;
	}

	onMount(() => {
		// Set initial color of the ENTITY LIGHT to

		const rgbValue: [number, number, number] = whoServing === 'blue' ? [0, 0, 255] : [255, 0, 0];
		changeLightColor(data.wsConnection, ENTITY_NAME_FOR_WHO_SERVING_LIGHT, rgbValue);

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
	$: maxScoreStr = ourMaxScore.toString().padStart(2, '0');
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
		<h1>{maxScoreStr}</h1>
		{#if whoServing === 'blue'}
			<span class="servingIcon"><TennisIcon width={96} height={96} /></span>
		{/if}
	</div>
	<div class="side red">
		<h1>{derivedRedScoreStr}</h1>
		<div class="divider" />
		<h1>{maxScoreStr}</h1>
		{#if whoServing === 'red'}
			<span class="servingIcon"><TennisIcon width={96} height={96} /></span>
		{/if}
	</div>
</section>
