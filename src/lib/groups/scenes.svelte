<script lang="ts">
	import type { AppConnections } from '$lib/data/types';
	import type { ComponentType } from 'svelte';

	import Block from '$lib/blocks/block.svelte';
	import { sceneStore, type SceneStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { activateScene } from '$lib/data/ws';
	import { getIcon } from '$lib/utils/getIcon';
	import hexToRGB from '$lib/utils/HEXtoRGB';
	import shouldDisplayBlackText from '$lib/utils/shouldDisplayBlackText';

	export let selectedRoom: Rooms;
	export let data: AppConnections;

	// For blocks whose data doesn't include a color, switch back and forth between
	// these two colors
	const defaultColors = ['#FFF7DC', '#1F212E'];
	const getDefaultColor = (i: number) => defaultColors[i % defaultColors.length];

	// Scene data directly from the WS server, not formatted
	let scenes: SceneStore = {};

	const sceneIcons: { [scene_id: string]: ComponentType } = {};
	sceneStore.subscribe(async (newScenes) => {
		// Since HA has a habit of sending the same data over and over, check if anything has
		// actually changed before triggering a re-render. Whether or not doing this is actually
		// a performance improvement over just letting re-renders happen is debatable, but ¯\_(ツ)_/¯
		const stringifiedNew = JSON.stringify(newScenes);
		if (JSON.stringify(scenes) === stringifiedNew) return;
		scenes = JSON.parse(stringifiedNew);
		// Load icons for each scene
		for (const scene of Object.values(scenes)) {
			// Load icons for each scene
			if (sceneIcons[scene.attributes.id] == null) {
				const icon = await getIcon(scene.attributes.icon);
				sceneIcons[scene.attributes.id] = icon;
			}
		}
	});

	type FormattedSceneType = {
		entity_id: string;
		id: string;
		name?: string;
		color?: string;
	};

	// Scenes filtered and formatted for rendering
	$: scenesToShow = Object.values(scenes).reduce<FormattedSceneType[]>((acc, scene) => {
		const formattedScene: FormattedSceneType = {
			entity_id: scene.entity_id,
			id: scene.attributes.id
		};
		// First check if the scene is in the selected room
		if (selectedRoom === Rooms.AllRooms || scene.attributes.friendly_name.includes(selectedRoom)) {
			// Remove room name from scene name, but only if we're not in All Room display
			formattedScene.name = scene.attributes.friendly_name.replace(`${selectedRoom} `, '');
			// Extract color from the scene name
			const colorMatch = formattedScene.name.match(/#([0-9A-F]{3}){1,2}\b/i);

			// If we found a color, remove it from the name and set the color attribute
			if (colorMatch) {
				formattedScene.color = colorMatch[0];
				formattedScene.name = formattedScene.name.replace(colorMatch[0], '');
			}

			acc.push(formattedScene);
		}
		return acc;
	}, []);
</script>

<style>
	.sceneName {
		font-size: 1.25em;
	}
</style>

{#each Object.values(scenesToShow) as scene, i}
	<Block
		backgroundColor={scene.color ?? getDefaultColor(i)}
		borderColor="white"
		fontColor={scene.color
			? shouldDisplayBlackText(hexToRGB(scene.color))
				? 'black'
				: 'white'
			: getDefaultColor(i + 1)}
		onClick={() => activateScene(data.wsConnection, scene.entity_id)}
		toggle
	>
		<svelte:component this={sceneIcons[scene.id]} height="5em" width="5em" />
		<h2 class="sceneName">{scene.name}</h2>
	</Block>
{/each}
