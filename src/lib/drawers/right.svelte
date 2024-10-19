<script lang="ts">
	import type { ComponentType } from 'svelte';
	import type { AppConnections } from '$lib/data/types';

	import { fly } from 'svelte/transition';
	import CloseIcon from 'svelte-material-icons/Close.svelte';
	import { lightStore, selectedLightIdStore, type LightStore } from '$lib/data/stores';
	import { getIcon } from '$lib/utils/getIcon';
	import stripRoomNames from '$lib/utils/stripRoomNames';
	import ColorPicker from '$lib/components/colorPicker.svelte';
	import Brightness from '$lib/components/brightness.svelte';
	import TemperaturePicker from '$lib/components/temperaturePicker.svelte';
	import { toggleLightState } from '$lib/data/ws';
	import EffectPicker from '$lib/components/effectPicker.svelte';

	export let lightId: string | null;
	export let data: AppConnections;

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
				let icon;
				if (light.attributes.icon) {
					icon = await getIcon(light.attributes.icon);
				} else {
					icon = await getIcon('mdi:lightbulb-variant');
				}
				lightIcon = icon;
			}
		};
		updateLightIcon();
	}

	let activeDisplayMode: 'color' | 'temp' | 'effect' = 'color';

	let colorMode: string | void = light?.attributes.color_mode;
	let effect = light?.attributes.effect;

	// Determine which display mode is active
	if (effect) {
		activeDisplayMode = 'effect';
	} else if (colorMode === 'color_temp') {
		activeDisplayMode = 'temp';
	} else if (light?.attributes?.color_temp_kelvin != null) {
		activeDisplayMode = 'temp';
	} else {
		activeDisplayMode = 'color';
	}

	$: supportsColor = light?.attributes.supported_color_modes.some(
		(mode) => mode === 'hs' || mode === 'xy' || mode === 'rgb'
	);
	$: supportsTemperature = light?.attributes.supported_color_modes.includes('color_temp');
	$: supportsEffects = Boolean(light?.attributes?.effect_list?.length);

	$: nonSolidEffectEnabled = light?.attributes?.effect && light?.attributes?.effect !== 'Solid';
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
		overflow: hidden;
	}
	.contents {
		height: 100%;
		width: 100%;
		overflow: hidden;
		position: relative;
	}
	.closeIconContainer {
		position: absolute;
		top: 1em;
		right: 1em;
	}
	header {
		width: 100%;
		margin-top: 1em;
		text-align: center;
	}
	header > h2 {
		font-size: 2em;
		text-align: center;
		font-weight: 600;
		margin-top: 0.25em;
		margin-bottom: 0.25em;
		color: white;
	}
	.colorModeBtnContainer {
		display: flex;
		justify-content: center;
		padding: 0 1em;
		margin-top: 1em;
	}
	.colorModeBtn {
		background-color: transparent;
		border: 2px solid white;
		border-radius: 3px;
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
	.brightnessSlider {
		position: absolute;
		width: 100%;
		bottom: 50px;
		padding-bottom: 10px;
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
	.activeEffect {
		height: 1em;
		text-align: center;
		color: white;
		font-size: 1.2em;
		font-weight: 600;
		margin: 0;
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
				<p class="activeEffect">
					{#if nonSolidEffectEnabled}
						Active effect: {light.attributes.effect}
					{/if}
				</p>
			</header>
			<div class="colorModeBtnContainer" class:disablePicker={light.state === 'off'}>
				{#if supportsColor}<button
						class="colorModeBtn"
						class:active={activeDisplayMode === 'color'}
						on:click={() => {
							colorMode = 'hs';
							activeDisplayMode = 'color';
						}}>Color</button
					>
				{/if}
				{#if supportsTemperature}
					<button
						class="colorModeBtn"
						class:active={activeDisplayMode === 'temp'}
						on:click={() => {
							colorMode = 'color_temp';
							activeDisplayMode = 'temp';
						}}>Temp</button
					>
				{/if}
				{#if supportsEffects}
					<button
						class="colorModeBtn"
						class:active={activeDisplayMode === 'effect'}
						on:click={() => {
							colorMode = undefined;
							activeDisplayMode = 'effect';
						}}>Effects</button
					>
				{/if}
			</div>
			<section class="pickerContainer" class:disablePicker={light.state === 'off'}>
				{#if activeDisplayMode === 'color'}
					<ColorPicker entityid={light.entity_id} initialColor={light.attributes.rgb_color} />
				{:else if activeDisplayMode === 'temp'}
					<TemperaturePicker
						entityid={light.entity_id}
						range={[
							+light.attributes.max_color_temp_kelvin,
							+light.attributes.min_color_temp_kelvin
						]}
						initialValue={light.attributes.color_temp_kelvin}
					/>
				{:else if activeDisplayMode === 'effect'}
					<EffectPicker
						effectList={light?.attributes.effect_list}
						activeEffect={light?.attributes.effect}
						entityid={light.entity_id}
					/>
				{/if}
			</section>
			<span class="brightnessSlider" class:disablePicker={light.state === 'off'}
				><Brightness entityid={light.entity_id} initialValue={light.attributes.brightness} /></span
			>
			<button
				class="powerBtn"
				class:powerOn={light.state === 'on'}
				class:powerOff={light.state === 'off'}
				on:click={() => {
					if (light == null) throw new Error('Light is null');
					const newState = light.state === 'on' ? 'off' : 'on';
					toggleLightState(data.wsConnection, light.entity_id, newState);
				}}
			>
				{light.state === 'on' ? 'Turn Off' : 'Turn On'}
			</button>
		</div>
	{/if}
</section>
