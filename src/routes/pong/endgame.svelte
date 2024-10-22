<script lang="ts">
	import NextBtn from '$lib/components/nextBtn.svelte';
	import type { GameState, PlayerData } from '$lib/data/types';

	export let onNewGame: () => void;
	export let endGameState: GameState;

	const [winner, loser] = Object.values(endGameState).sort(
		(playerAData, playerBData) => (playerBData?.score ?? 0) - (playerAData?.score ?? 0)
	);

	$: blueWon = winner.whichColor === 'blue';
	$: redWon = winner.whichColor === 'red';
</script>

<style>
	.endGame {
		height: 100%;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}
	.endGame > h1 {
		margin: 0;
		color: white;
		font-size: 8em;
	}
	.endGame.blue {
		background-color: var(--pong-blue);
	}
	.endGame.red {
		background-color: var(--pong-red);
	}
</style>

<section class="endGame" class:blue={blueWon} class:red={redWon}>
	{#if blueWon}
		<h1>Blue won!</h1>
	{:else}
		<h1>Red won!</h1>
	{/if}
	<h1>{winner.score ?? 0} – {loser.score ?? 0}</h1>
	<NextBtn onNext={onNewGame} />
</section>
