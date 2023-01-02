<script lang="ts">
	import Block from '$lib/blocks/block.svelte';
	import { selectedRoomStore, sceneStore, type SceneStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { getIcon } from '$lib/utils/getIcon';
	import hexToRGB from '$lib/utils/HEXtoRGB';
	import shouldDisplayBlackText from '$lib/utils/shouldDisplayBlackText';
	import type { ComponentType } from 'svelte';

	// For blocks whose data doesn't include a color, switch back and forth between
	// these two colors
	const colors = ['#FFF7DC', '#1F212E'];
	const getColor = (i: number) => colors[i % colors.length];

	// Subscribe to rooms
	let selectedRoom: Rooms = Rooms.AllRooms;
	selectedRoomStore.subscribe((newSelectedRoom) => {
		selectedRoom = newSelectedRoom;
	});
	// Subscribe to scenes
	let scenes: SceneStore = {};
	const sceneIcons: { [scene_id: string]: ComponentType } = {};
	const sceneRoomMap = new Map();
	sceneStore.subscribe(async (newScenes) => {
		scenes = newScenes;
		// Load icons for each scene
		for (const scene of Object.values(scenes)) {
			// Load icons for each scene
			if (sceneIcons[scene.attributes.id] == null) {
				const icon = await getIcon(scene.attributes.icon);
				sceneIcons[scene.attributes.id] = icon;
			}

			// Add to room map & parse metadata from name
			Object.values(Rooms).forEach((roomId) => {
				if (scene.attributes.friendly_name.includes(roomId)) {
					sceneRoomMap.set(roomId, scene.attributes.id);

					// Remove room name from scene name, but only if we're not in All Room display
					if (selectedRoom !== Rooms.AllRooms)
						scene.attributes.friendly_name = scene.attributes.friendly_name.replace(roomId, '');
					console.log(roomId, scene.attributes.friendly_name);
					// Extract color from the scene name
					const colorMatch = scene.attributes.friendly_name.match(/#([0-9A-F]{3}){1,2}\b/i);

					// If we found a color, remove it from the name and set the color attribute
					if (colorMatch) {
						scene.attributes.color = colorMatch[0];
						scene.attributes.friendly_name = scene.attributes.friendly_name.replace(
							colorMatch[0],
							''
						);
					}
				}
			});
		}

		// Update again to trigger re-render in case any scene names were updated
		scenes = scenes;
	});

	function triggerScene(sceneId: string) {
		// TODO:
	}

	$: scenesToShow = Object.values(scenes).filter((scene) => {
		if (selectedRoom === Rooms.AllRooms) return true;
		return sceneRoomMap.get(selectedRoom) === scene.attributes.id;
	});
</script>

<style>
	.sceneName {
		font-size: 1.25em;
	}
</style>

{#each Object.values(scenesToShow) as scene, i}
	<Block
		backgroundColor={scene.attributes.color ?? getColor(i)}
		fontColor={scene.attributes.color
			? shouldDisplayBlackText(hexToRGB(scene.attributes.color))
				? 'black'
				: 'white'
			: getColor(i + 1)}
		onClick={() => triggerScene(scene.attributes.id)}
	>
		<svelte:component this={sceneIcons[scene.attributes.id]} height="5em" width="5em" />
		<h2 class="sceneName">{scene.attributes.friendly_name}</h2>
	</Block>
{/each}
