<script lang="ts">
	import BackBtn from '$lib/components/backBtn.svelte';
	import NextBtn from '$lib/components/nextBtn.svelte';
	import MinusIcon from 'svelte-material-icons/MinusThick.svelte';
	import PlusIcon from 'svelte-material-icons/Plus.svelte';
	import type { GameConfig } from '$lib/data/types';

	export let onBack: () => void;
	export let onSubmit: (maxScore: number, serveCount: number, whoFirst: 'blue' | 'red') => void;
	export let gameConfig: GameConfig;

	const { maxScoreOptions } = gameConfig;
	let maxScore = gameConfig.maxScore;
	let serveCount = gameConfig.serveCount;
	let whoFirst = gameConfig.firstPlayer;

	const handleSubmit = () => {
		onSubmit(maxScore, serveCount, whoFirst);
	};

	const incrementMaxScore = () => {
		const currentMaxScoreIndex = maxScoreOptions.indexOf(maxScore);
		const nextMaxScoreIndex =
			currentMaxScoreIndex === maxScoreOptions.length - 1 ? 0 : currentMaxScoreIndex + 1;
		maxScore = maxScoreOptions[nextMaxScoreIndex];
	};

	const decrementMaxScore = () => {
		const currentMaxScoreIndex = maxScoreOptions.indexOf(maxScore);
		const nextMaxScoreIndex =
			currentMaxScoreIndex === 0 ? maxScoreOptions.length - 1 : currentMaxScoreIndex - 1; // maxScore = nextMaxScoreIndex === -1 ? maxScoreOptions.length -1 :
		maxScore = maxScoreOptions[nextMaxScoreIndex];

		// If decrewmenting max score puts serveCount higher, reduce that too
		if (serveCount > maxScore) {
			serveCount = maxScore;
		}
	};
	const incrementServeCont = () => {
		if (serveCount >= maxScore) {
			return;
		}
		serveCount++;
	};
	const decrementServeCont = () => {
		if (serveCount === 1) {
			return;
		}

		serveCount--;
	};
	const toggleWhoFirst = () => (whoFirst = whoFirst === 'blue' ? 'red' : 'blue');
</script>

<style>
	.setup {
		display: flex;
		flex-direction: row;
		align-items: center;
		position: relative;
		padding: 5em;
		height: 100%;
		width: 100%;
	}

	.leftContainer {
		flex-basis: 60%;

		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;

		font-size: 5em;
	}
	.leftContainer > h1 {
		margin: 0;
	}
	.rightContainer {
		flex-basis: 40%;

		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;

		font-size: 5em;
	}
	.rightContainer > h1 {
		margin: 0;
	}
	.scoreBox {
		display: flex;
		align-items: center;
	}
	.scoreBox > button {
		height: 5em;
	}
	.scoreBox > h1 {
		display: inline-block;
		margin: 0 0.3em;
	}
	.whoFirst {
		text-transform: capitalize;
	}
	.whoFirst.blue {
		color: var(--pong-blue);
	}
	.whoFirst.red {
		color: var(--pong-red);
	}
</style>

<section class="setup">
	<BackBtn {onBack} />
	<div class="leftContainer">
		<span />
		<h1>Play to:</h1>
		<h1>Serves:</h1>
		<h1>First player:</h1>
	</div>
	<div class="rightContainer">
		<div class="scoreBox">
			<button on:click={decrementMaxScore}><MinusIcon width={48} height={48} /></button>
			<h1>{maxScore}</h1>
			<button on:click={incrementMaxScore}><PlusIcon width={48} height={48} /></button>
		</div>
		<div class="scoreBox">
			<button on:click={decrementServeCont}><MinusIcon width={48} height={48} /></button>
			<h1>{serveCount}</h1>
			<button on:click={incrementServeCont}><PlusIcon width={48} height={48} /></button>
		</div>
		<h1
			on:click={toggleWhoFirst}
			class="whoFirst"
			class:blue={whoFirst === 'blue'}
			class:red={whoFirst === 'red'}
		>
			{whoFirst}
		</h1>
	</div>
	<NextBtn onNext={handleSubmit} />
</section>
