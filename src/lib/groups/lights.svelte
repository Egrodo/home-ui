<script lang="ts">
	import Block from '$lib/blocks/block.svelte';
	import { lightStore, selectedRoomStore, type LightStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { getIcon } from '$lib/utils/getIcon';
	import shouldDisplayBlackText from '$lib/utils/shouldDisplayBlackText';
	import type { ComponentType } from 'svelte';

	const OFF_STATE_BG_COLOR: [number, number, number] = [31, 33, 46];

	let selectedRoom: Rooms = Rooms.AllRooms;
	selectedRoomStore.subscribe((newSelectedRoom) => {
		selectedRoom = newSelectedRoom;
	});

	let lights: LightStore = {};

	const lightIcons: { [light_id: string]: ComponentType } = {};
	const lightBgColors: { [light_id: string]: [number, number, number] } = {};
	const lightRoomMap = {
		[Rooms.AllRooms]: new Set(),
		[Rooms.Bedroom]: new Set(),
		[Rooms.LivingRoom]: new Set(),
		[Rooms.Office]: new Set()
	};

	lightStore.subscribe(async (newLights) => {
		// Load icons for each light
		for (const light of Object.values(newLights)) {
			if (lightIcons[light.entity_id] == null) {
				const icon = await getIcon(light.attributes.icon);
				lightIcons[light.entity_id] = icon;
			}

			console.log(light);

			// Add to room map
			Object.values(Rooms).forEach((roomId) => {
				if (light.attributes.friendly_name.includes(roomId)) {
					lightRoomMap[roomId].add(light.entity_id);

					// Remove room name from light name, but only if we're not in All Room display
					if (selectedRoom !== Rooms.AllRooms)
						light.attributes.friendly_name = light.attributes.friendly_name.replace(roomId, '');
				}
			});

			// Determine background color of the block. If the light is on, we'll use
			// the current color of the light.
			if (light.state === 'on') {
				if (light.attributes.rgb_color == null)
					throw new Error('Light is on but rgb_color is nullish');
				lightBgColors[light.entity_id] = light.attributes.rgb_color;
			} else {
				lightBgColors[light.entity_id] = OFF_STATE_BG_COLOR;
			}
		}

		lights = newLights;
	});

	$: lightsToShow = Object.values(lights).filter((light) => {
		if (selectedRoom === Rooms.AllRooms) return true;

		return lightRoomMap[selectedRoom].has(light.entity_id);
	});

	$: console.log(lightBgColors);
</script>

<style>
	.lightName {
		font-size: 1.25em;
	}
</style>

{#each Object.values(lightsToShow) as light, i}
	<Block
		backgroundColor={`rgb(${lightBgColors[light.entity_id].join(', ')})`}
		fontColor={shouldDisplayBlackText(lightBgColors[light.entity_id]) ? 'black' : 'white'}
		onClick={() => {
			// TODO:
		}}
	>
		<svelte:component this={lightIcons[light.entity_id]} height="5em" width="5em" />
		<h2 class="lightName">{light.attributes.friendly_name}</h2>
	</Block>
{/each}
