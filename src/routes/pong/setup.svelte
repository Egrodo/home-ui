<script lang="ts">
	import ReturnIcon from 'svelte-material-icons/KeyboardReturn.svelte';
	import MinusIcon from 'svelte-material-icons/MinusThick.svelte';
	import PlusIcon from 'svelte-material-icons/Plus.svelte';

	export let players: [string, string];
	export let onBack: () => void;
	export let onSubmit: (maxScore: number, serveCount: number, whoFirst: 0 | 1) => void;

	let maxScore = 5;
	let serveCount = 1;
	// TODO: Refac & figure out a profile system
	let whoFirst: 0 | 1 = 0;

	const handleSubmit = () => {
		onSubmit(maxScore, serveCount, whoFirst);
	};
	// TODO: Increment / decrement by presets; 5 point game -> 11 points -> 21 points -> ?
	const incrementMaxScore = () => maxScore++;
	const decrementMaxScore = () => (maxScore > 1 ? (maxScore -= 1) : 1);
	const incrementServeCont = () => (serveCount += 1);
	const decrementServeCont = () => (serveCount > 1 ? (serveCount -= 1) : 1);
	const toggleWhoFirst = () => (whoFirst = whoFirst ? 0 : 1);
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
	.backBtn {
		position: absolute;
		top: 0;
		left: 0;
		height: 8em;
		width: 8em;
		padding-top: 1em;
	}
	.nextBtn {
		position: absolute;
		bottom: 0;
		right: 0;
		height: 8em;
		width: 8em;
		padding-top: 1em;
		transform: scaleX(-1);
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
</style>

<section class="setup">
	<button class="backBtn" on:click={onBack}>
		<ReturnIcon height={64} width={64} />
	</button>
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
		<h1 on:click={toggleWhoFirst}>{players[whoFirst]}</h1>
	</div>
	<button class="nextBtn" on:click={handleSubmit}>
		<ReturnIcon height={64} width={64} />
	</button>
</section>
