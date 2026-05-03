<script lang="ts">
	import { entityAreaMapStore } from '$lib/data/backend';
	import { lightStore, switchStore, sceneStore, selectedRoomStore } from '$lib/data/stores';
	import { Rooms, type LightEntity, type SwitchEntity, type SceneEntity } from '$lib/data/types';
	import { ROOM_AREA_IDS } from '$lib/data/ws';
	import { getIcon } from '$lib/utils/getIcon';
	import DeviceCard from './DeviceCard.svelte';

	let selectedRoom: Rooms = Rooms.AllRooms;
	selectedRoomStore.subscribe((r) => (selectedRoom = r));

	let entityAreaMap: Record<string, string | null> = {};
	entityAreaMapStore.subscribe((m) => (entityAreaMap = m));

	let lights: Record<string, LightEntity> = {};
	let switches: Record<string, SwitchEntity> = {};
	let scenes: Record<string, SceneEntity> = {};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let icons: Record<string, any> = {};

	function inRoom(entityId: string): boolean {
		if (selectedRoom === Rooms.AllRooms) return true;
		const entityArea = entityAreaMap[entityId];
		return entityArea != null && (ROOM_AREA_IDS[selectedRoom] ?? []).includes(entityArea);
	}

	lightStore.subscribe(async (newLights) => {
		lights = newLights;
		for (const light of Object.values(newLights)) {
			if (!icons[light.entity_id]) {
				icons[light.entity_id] = await getIcon(light.attributes.icon ?? 'mdi:lightbulb-variant');
			}
		}
		icons = { ...icons };
	});

	switchStore.subscribe(async (newSwitches) => {
		switches = newSwitches;
		for (const sw of Object.values(newSwitches)) {
			if (!icons[sw.entity_id]) {
				icons[sw.entity_id] = await getIcon(sw.attributes.icon ?? 'mdi:toggle-switch-outline');
			}
		}
		icons = { ...icons };
	});

	sceneStore.subscribe(async (newScenes) => {
		scenes = newScenes;
		for (const scene of Object.values(newScenes)) {
			if (!icons[scene.entity_id]) {
				icons[scene.entity_id] = await getIcon(scene.attributes.icon ?? 'mdi:palette');
			}
		}
		icons = { ...icons };
	});

	// Ordered: Scenes → Switches → Lights, filtered by room
	$: visibleScenes = Object.values(scenes).filter((e) => inRoom(e.entity_id));
	$: visibleSwitches = Object.values(switches).filter((e) => inRoom(e.entity_id));
	$: visibleLights = Object.values(lights).filter((e) => inRoom(e.entity_id));
</script>

<style>
	.devices {
		margin: 16px 24px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 16px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 8px;
	}

</style>

<section class="devices">
	<div class="grid">
		{#each visibleScenes as scene (scene.entity_id)}
			<DeviceCard entity={scene} icon={icons[scene.entity_id] ?? null} />
		{/each}
		{#each visibleSwitches as sw (sw.entity_id)}
			<DeviceCard entity={sw} icon={icons[sw.entity_id] ?? null} />
		{/each}
		{#each visibleLights as light (light.entity_id)}
			<DeviceCard entity={light} icon={icons[light.entity_id] ?? null} />
		{/each}
	</div>
</section>
