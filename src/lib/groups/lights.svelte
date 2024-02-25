<script lang="ts">
	import Block from '$lib/blocks/block.svelte';
	import { lightStore, selectedLightIdStore, type LightStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { toggleLightState } from '$lib/data/ws';
	import { getIcon } from '$lib/utils/getIcon';
	import shouldDisplayBlackText from '$lib/utils/shouldDisplayBlackText';
	import type { ComponentType } from 'svelte';

	export let selectedRoom: Rooms;

	let lights: LightStore = {};

	const OFF_STATE_BG_COLOR: [number, number, number] = [31, 33, 46];

	function openControlPanel(lightId: string) {
		selectedLightIdStore.set(lightId);
	}

	function toggleLight(lightId: string) {
		const newState = lights[lightId].state === 'on' ? 'off' : 'on';
		toggleLightState(lightId, newState);
	}

	const lightIcons: { [light_id: string]: ComponentType } = {};

	lightStore.subscribe(async (newLights) => {
		const stringifiedNew = JSON.stringify(newLights);
		if (JSON.stringify(lights) === stringifiedNew) return;
		lights = JSON.parse(stringifiedNew);
		console.log(lights);
		for (const light of Object.values(newLights)) {
			if (lightIcons[light.entity_id] == null) {
				let icon;
				if (light.attributes.icon) {
					icon = await getIcon(light.attributes.icon);
				} else {
					icon = await getIcon('mdi:lightbulb-variant');
				}

				lightIcons[light.entity_id] = icon;
			}
		}
	});

	type FormattedLightType = {
		id: string;
		state: 'on' | 'off';
		name: string;
		color: [number, number, number];
	};

	$: lightsToShow = Object.values(lights)
		.reduce<FormattedLightType[]>((acc, light) => {
			const formattedLight: FormattedLightType = {
				id: light.entity_id,
				state: light.state as 'on' | 'off',
				name: light.attributes.friendly_name,
				color: OFF_STATE_BG_COLOR
			};
			if (
				selectedRoom === Rooms.AllRooms ||
				light.attributes.friendly_name.includes(selectedRoom)
			) {
				// Remove room name from light name
				formattedLight.name = light.attributes.friendly_name.replace(`${selectedRoom} `, '');
				// Determine background color of the block. If the light is on, we'll use
				// the current color of the light.
				if (light.state === 'on') {
					if (light.attributes.rgb_color == null) {
						console.error('Light is on but rgb_color is nullish', light);
					} else {
						formattedLight.color = light.attributes.rgb_color;
					}
				} else {
					formattedLight.color = OFF_STATE_BG_COLOR;
				}

				acc.push(formattedLight);
			}
			return acc;
		}, [])
		.sort((a, b) => {
			// Sort the off lights after the on lights
			if (a.state === 'on' && b.state === 'off') return -1;
			return 0;
		});
</script>

<style>
	.lightName {
		font-size: 1.25em;
	}
</style>

{#each Object.values(lightsToShow) as light}
	<Block
		backgroundColor={`rgb(${light.color.join(', ')})`}
		fontColor={shouldDisplayBlackText(light.color) ? 'black' : 'white'}
		onClick={() => toggleLight(light.id)}
		onHold={() => openControlPanel(light.id)}
	>
		<svelte:component this={lightIcons[light.id]} height="5em" width="5em" />
		<h2 class="lightName">{light.name.replace(selectedRoom, '')}</h2>
	</Block>
{/each}
