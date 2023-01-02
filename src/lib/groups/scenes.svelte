<script lang="ts">
	import Block from '$lib/blocks/block.svelte';
	import { selectedRoomStore, sceneStore, type SceneStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { getIcon } from '$lib/utils';
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

			// Parse area out of name
			Object.values(Rooms).forEach((roomId) => {
				if (scene.attributes.friendly_name.includes(roomId)) {
					sceneRoomMap.set(roomId, scene.attributes.id);
					scene.attributes.friendly_name = scene.attributes.friendly_name.replace(roomId, '');
				}
			});
		}

		// Update again to trigger re-render in case any scene names were updated
		scenes = scenes;
	});

	function triggerScene(sceneId: string) {
		// TODO:
	}
</script>

<style>
	.sceneName {
		font-size: 1.25em;
	}
</style>

{#each Object.values(scenes) as scene, i}
	<Block
		backgroundColor={getColor(i)}
		fontColor={getColor(i + 1)}
		onClick={() => triggerScene(scene.attributes.id)}
	>
		<svelte:component this={sceneIcons[scene.attributes.id]} height="5em" width="5em" />
		<h2 class="sceneName">{scene.attributes.friendly_name}</h2>
	</Block>
{/each}
