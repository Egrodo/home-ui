<script lang="ts">
	import { fly } from 'svelte/transition';
	import CloseIcon from 'svelte-material-icons/Close.svelte';
	import { lightStore, selectedLightIdStore, type LightStore } from '$lib/data/stores';
	import { getIcon } from '$lib/utils/getIcon';
	import type { ComponentType } from 'svelte';
	import stripRoomNames from '$lib/utils/stripRoomNames';
	import ColorPicker from '$lib/components/colorPicker.svelte';
	import Brightness from '$lib/components/brightness.svelte';
	export let lightId: string | null;

	function closeDrawer() {
		selectedLightIdStore.set(null);
	}

	let lights: LightStore = {};
	lightStore.subscribe((newLights) => {
		const stringifiedNew = JSON.stringify(newLights);
		if (JSON.stringify(lights) === stringifiedNew) return;
		lights = JSON.parse(stringifiedNew);
	});

	$: light = lightId != null ? lights[lightId] : null;

	let lightIcon: ComponentType;

	$: {
		const updateLightIcon = async () => {
			if (light != null) {
				const icon = await getIcon(light.attributes.icon);
				lightIcon = icon;
			}
		};
		updateLightIcon();
	}

	$: console.log(lights);

	// UI state stuff
	$: colorMode = light?.attributes.color_mode;
</script>

<style>
	.rightDrawer {
		height: 100%;
		width: 25%;
		max-width: 0%;
		transition: max-width 0.75s cubic-bezier(0.19, 0.86, 0.47, 1);
		overflow: hidden;

		background-color: var(--page-drawer-background);
	}

	.open {
		max-width: 25%;
	}

	.contents {
		height: 100%;
		width: 100%;
		padding: 0 1em;
		overflow: auto;
		position: relative;
	}

	.closeIconContainer {
		position: absolute;
		top: 1em;
		right: 1em;
	}

	header {
		width: 100%;
		margin-top: 2em;
		text-align: center;
	}
	header > h2 {
		font-size: 2em;
		text-align: center;
		font-weight: 600;
		margin-top: 0.25em;
		color: white;
	}

	.colorModeBtnContainer {
		display: flex;
		justify-content: center;
		margin-top: 2em;
	}
	.colorModeBtn {
		background-color: transparent;
		border: 2px solid white;
		color: white;
		font-size: 1.25em;
		text-align: center;
		font-weight: 600;
		padding: 0.5em 0;
		margin: 0;
		width: 50%;
	}

	.colorModeBtn.active {
		background-color: #666c94;
	}
</style>

<section class="rightDrawer" class:open={lightId}>
	{#if light != null}
		<div class="contents" transition:fly={{ y: 10 }}>
			<span class="closeIconContainer" role="button" on:click={closeDrawer}
				><CloseIcon height="3em" width="3em" color="#fff" /></span
			>
			<header>
				<svelte:component this={lightIcon} height="8em" width="8em" color="#fff" />
				<h2>{stripRoomNames(light.attributes.friendly_name)}</h2>
			</header>
			<div class="colorModeBtnContainer">
				<button
					class="colorModeBtn"
					class:active={colorMode === 'hs'}
					on:click={() => {
						colorMode = 'hs';
					}}>Color</button
				>
				<button
					class="colorModeBtn"
					class:active={colorMode === 'color_temp'}
					on:click={() => {
						colorMode = 'color_temp';
					}}>Temperature</button
				>
			</div>
			{#if colorMode === 'hs'}
				<ColorPicker color={light.attributes.rgb_color} />
			{:else if colorMode === 'color_temp'}
				<p>Temperature</p>
			{/if}
			<Brightness />
		</div>
	{/if}
</section>
