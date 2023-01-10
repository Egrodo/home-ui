<script lang="ts">
	import { fly } from 'svelte/transition';
	import CloseIcon from 'svelte-material-icons/Close.svelte';
	import { lightStore, selectedLightIdStore, type LightStore } from '$lib/data/stores';
	import { getIcon } from '$lib/utils/getIcon';
	import type { ComponentType } from 'svelte';
	import stripRoomNames from '$lib/utils/stripRoomNames';
	import ColorPicker from '$lib/components/colorPicker.svelte';
	import Brightness from '$lib/components/brightness.svelte';
	import TemperaturePicker from '$lib/components/temperaturePicker.svelte';
	import { toggleLightState } from '$lib/data/ws';
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
	$: colorMode = light?.attributes.color_mode ?? 'hs';
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
		padding: 0 1em;
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

	.pickerContainer {
		height: 325px;
		position: relative;
	}

	.disablePicker {
		pointer-events: none;
		opacity: 0.5;
	}

	.powerBtn {
		position: absolute;
		width: 100%;
		bottom: 0;
		border: none;
		outline: none;
		width: 100%;
		height: 50px;
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		font-size: 1.25em;
		font-weight: 600;
	}
	.powerOn {
		background-color: #fc3838;
	}
	.powerOff {
		background-color: #37d400;
	}
</style>

<section class="rightDrawer" class:open={lightId}>
	{#if light != null}
		<div class="contents" transition:fly={{ y: 10 }}>
			<span class="closeIconContainer" role="button" on:click={closeDrawer}
				><CloseIcon height="3em" width="3em" color="#fff" /></span
			>
			<header>
				<svelte:component this={lightIcon} height="6.5em" width="6.5em" color="#fff" />
				<h2>{stripRoomNames(light.attributes.friendly_name)}</h2>
			</header>
			<div class="colorModeBtnContainer">
				<button
					class="colorModeBtn"
					class:active={colorMode === 'hs' || colorMode === 'xy' || colorMode === 'rgb'}
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
			<section class="pickerContainer" class:disablePicker={light.state === 'off'}>
				{#if colorMode === 'hs'}
					<ColorPicker color={light.attributes.rgb_color} />
				{:else if colorMode === 'color_temp'}
					<TemperaturePicker
						range={[
							+light.attributes.max_color_temp_kelvin,
							+light.attributes.min_color_temp_kelvin
						]}
						initialValue={light.attributes.color_temp_kelvin}
					/>
				{/if}
			</section>
			<span class:disablePicker={light.state === 'off'}
				><Brightness value={light.attributes.brightness} /></span
			>
			<button
				class="powerBtn"
				class:powerOn={light.state === 'on'}
				class:powerOff={light.state === 'off'}
				on:click={() => {
					if (light == null) throw new Error('Light is null');
					const newState = light.state === 'on' ? 'off' : 'on';
					toggleLightState(light.entity_id, newState);
				}}
			>
				{light.state === 'on' ? 'Turn Off' : 'Turn On'}
			</button>
		</div>
	{/if}
</section>
