<script lang="ts">
	import { onMount } from 'svelte';
	import { changeLightEffect } from '../data/ws';

	export let effectList: string[] = [];
	export let activeEffect: string;
	export let entityid: string;

	const deduppedEffectList = Array.from(new Set(effectList));

	onMount(() => {
		if (activeEffect) {
			const activeEffectButton = document.querySelector('.effect.active');
			if (activeEffectButton) {
				activeEffectButton.scrollIntoView({ block: 'center' });
			}
		}
	});

	function changeEffect(effect: string) {
		changeLightEffect(entityid, effect);
	}
</script>

<style>
	.container {
		height: 100%;
		width: 100%;
		padding: 0 1em;
		display: flex;
		flex-direction: column;
	}
	.effectList {
		width: 100%;
		max-height: calc(100% - 1em);
		overflow-y: scroll;
		background: #666c94;
		border-radius: 3px;
		margin-top: 1em;
	}
	.effectList::-webkit-scrollbar {
		display: none;
	}
	.effect {
		background-color: inherit;
		border: none;
		width: 100%;
		padding: 0.5em;
		text-align: center;
		font-size: 1.5em;
		color: white;
	}
	.effect.active {
		background-color: rebeccapurple;
	}
</style>

<div class="container">
	{#if deduppedEffectList}
		<div class="effectList">
			{#each deduppedEffectList as effect}
				<button
					class="effect"
					class:active={effect === activeEffect}
					on:click={() => changeEffect(effect)}
				>
					{effect}
				</button>
			{/each}
		</div>
	{:else}
		<h2 style="color: white; text-align: center">No effects available</h2>
	{/if}
</div>
