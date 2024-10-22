<script lang="ts">
	import type { HassEvent } from 'home-assistant-js-websocket';
	import type { Writable } from 'svelte/store';
	import type { GameConfig, PongEvent } from '$lib/data/types';

	import BackBtn from '$lib/components/backBtn.svelte';
	import NextBtn from '$lib/components/nextBtn.svelte';
	import { onMount } from 'svelte';

	export let onBack: () => void;
	export let onSubmit: ({
		blueBtnName,
		redBtnName
	}: {
		blueBtnName: string;
		redBtnName: string;
	}) => void;
	export let pongEventStore: Writable<PongEvent[]>;
	export let gameConfig: GameConfig | null;
	// Blue registers first always
	let blueBtnName: string | null = gameConfig?.blueBtnName ?? null;
	let redBtnName: string | null = gameConfig?.redBtnName ?? null;

	function handleEvent(pongEventBus: PongEvent[]) {
		const lastEvent = pongEventBus[pongEventBus.length - 1];
		if (!lastEvent) return;

		const { deviceName } = lastEvent;
		if (!blueBtnName && !redBtnName) {
			blueBtnName = deviceName;
		} else if (blueBtnName && !redBtnName && deviceName != blueBtnName) {
			redBtnName = deviceName;
		}
		// If already set up, button presses shouldn't do anything.
		// User needs to press next or (if they want to restart) previous
	}

	function handleSubmit() {
		if (blueBtnName && redBtnName) {
			onSubmit({ blueBtnName, redBtnName });
		}
	}

	onMount(() => {
		const unsub = pongEventStore.subscribe(handleEvent);
		return unsub;
	});
</script>

<style>
	.register {
		display: flex;
		flex-direction: row;
		align-items: center;
		position: relative;
		padding: 5em;
		height: 100%;
		width: 100%;
	}
	.teamContainer {
		display: flex;
		flex-direction: row;
		width: 100%;
		height: 100%;

		--background-black: #242424;
		background-color: var(--background-black);
	}
	.team {
		flex-grow: 1;
		flex-basis: 50%;
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2em solid var(--team-color);
		flex-direction: column;
	}
	.blue {
		--team-color: var(--pong-blue);
	}
	.red {
		--team-color: var(--pong-red);
	}
	.registered {
		background-color: var(--team-color);
		border-color: var(--background-black);
	}
</style>

<section class="register">
	<BackBtn {onBack} />
	<main class="teamContainer">
		<aside class="blue team" class:registered={blueBtnName}>
			{#if blueBtnName}
				<h2>Blue ready</h2>
				<h3>Using {blueBtnName}</h3>
			{:else}
				<h2>Blue player tap in!</h2>
			{/if}
		</aside>
		<aside class="red team" class:registered={redBtnName}>
			{#if blueBtnName && !redBtnName}
				<h2>Red player tap in!</h2>
			{:else if redBtnName && blueBtnName}
				<h2>Red ready</h2>
				<h3>Using {redBtnName}</h3>
			{/if}
		</aside>
		{#if blueBtnName && redBtnName}
			<NextBtn onNext={handleSubmit} />
		{/if}
	</main>
</section>
