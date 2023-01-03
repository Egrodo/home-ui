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

	lightStore.subscribe(async (newLights) => {
		if (JSON.stringify(lights) === JSON.stringify(newLights)) return;
		lights = newLights;
		for (const light of Object.values(newLights)) {
			if (lightIcons[light.entity_id] == null) {
				const icon = await getIcon(light.attributes.icon);
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
			console.log('recalculating lightsToShow');
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
				formattedLight.name = light.attributes.friendly_name.replace(selectedRoom, '');
				// Determine background color of the block. If the light is on, we'll use
				// the current color of the light.
				if (light.state === 'on') {
					if (light.attributes.rgb_color == null)
						throw new Error('Light is on but rgb_color is nullish');
					formattedLight.color = light.attributes.rgb_color;
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

{#each Object.values(lightsToShow) as light, i}
	<Block
		backgroundColor={`rgb(${light.color.join(', ')})`}
		fontColor={shouldDisplayBlackText(light.color) ? 'black' : 'white'}
		onClick={() => {
			// TODO:
		}}
	>
		<svelte:component this={lightIcons[light.id]} height="5em" width="5em" />
		<h2 class="lightName">{light.name.replace(selectedRoom, '')}</h2>
	</Block>
{/each}
