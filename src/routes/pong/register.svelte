<script lang="ts">
	import type { HassEvent } from 'home-assistant-js-websocket';
	import type { Writable } from 'svelte/store';
	import type { PongEvent } from '$lib/data/types';

	import BackBtn from '$lib/components/backBtn.svelte';
	import NextBtn from '$lib/components/nextBtn.svelte';
	import { onMount } from 'svelte';

	export let onBack: () => void;
	export let onSubmit: () => void;
	export let pongEventStore: Writable<HassEvent[]>;

	// Blue registers first always
	let blueBtnId: string | null = null;
	let redBtnId: string | null = null;

	function handlePongEventBus(pongEventBus: PongEvent[]) {
		// const lastEvent = eventBus[eventBus.length - 1];
		// if (!blueBtnId && !redBtnId) {
		// 	blueBtnId = lastEvent.data.device_id
		// } else if (blueBtnId && !redBtnId) {
		// 	redBtnId = lastEvent.data.device_id
	}

	onMount(() => {
		// const unsub = eventBusStore.subscribe(handleEvent);
		// return unsub;
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

		background-color: #242424;
	}
	.team {
		flex-grow: 1;
		flex-basis: 50%;
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2em solid var(--team-color);
	}
	.blue {
		--team-color: #7fd0ff;
	}
	.red {
		--team-color: #f54b61;
	}
	.registered {
		background-color: var(--team-color);
	}
</style>

<section class="register">
	<BackBtn {onBack} />
	<main class="teamContainer">
		<aside class="blue team" class:registered={blueBtnId}>
			{#if blueBtnId}
				<h2>Blue successfully registered</h2>
			{:else}
				<h2>First click button to register blue</h2>
			{/if}
		</aside>
		<aside class="red team" class:registered={redBtnId}>
			{#if !blueBtnId && !redBtnId}
				<h2 />
			{:else if blueBtnId && !redBtnId}
				<h2>Next click button to register red</h2>
			{:else}
				<h2>Red successfully registered</h2>
			{/if}
		</aside>
		{#if blueBtnId && redBtnId}
			<NextBtn onNext={onSubmit} />
		{/if}
	</main>
</section>
