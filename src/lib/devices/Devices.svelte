<script lang="ts">
	import { entityAreaMapStore } from '$lib/data/backend';
	import { lightStore, switchStore, sceneStore } from '$lib/data/backendStores';
	import { selectedRoomStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { ROOM_AREA_IDS } from '$lib/data/ws';
	import { getIconKey } from '$lib/utils/getIcon';
	import DeviceCard from './DeviceCard.svelte';

	function inRoom(entityId: string, room: Rooms, areaMap: typeof $entityAreaMapStore): boolean {
		if (room === Rooms.AllRooms) return true;
		const entityArea = areaMap[entityId];
		return entityArea != null && (ROOM_AREA_IDS[room] ?? []).includes(entityArea);
	}

	// Ordered: Scenes → Switches → Lights, filtered by room
	// $selectedRoomStore and $entityAreaMapStore passed explicitly so Svelte tracks them as dependencies
	$: visibleScenes = Object.values($sceneStore).filter((e) => inRoom(e.entity_id, $selectedRoomStore, $entityAreaMapStore));
	$: visibleSwitches = Object.values($switchStore).filter((e) => inRoom(e.entity_id, $selectedRoomStore, $entityAreaMapStore));
	$: visibleLights = Object.values($lightStore).filter((e) => inRoom(e.entity_id, $selectedRoomStore, $entityAreaMapStore));
</script>

<style>
	.devices {
		margin: 16px 24px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 16px;
	}

	.roomLabel {
		font-size: var(--text-xs);
		margin-top: 0;
		margin-bottom: 8px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 8px;
	}
</style>

<section class="devices">
	<p class="roomLabel">{$selectedRoomStore}</p>
	<div class="grid">
		{#each visibleScenes as scene (scene.entity_id)}
			<DeviceCard entity={scene} icon={getIconKey(scene.attributes.icon ?? 'mdi:palette')} />
		{/each}
		{#each visibleSwitches as sw (sw.entity_id)}
			<DeviceCard
				entity={sw}
				icon={getIconKey(sw.attributes.icon ?? 'mdi:toggle-switch-outline')}
			/>
		{/each}
		{#each visibleLights as light (light.entity_id)}
			<DeviceCard
				entity={light}
				icon={getIconKey(light.attributes.icon ?? 'mdi:lightbulb-variant')}
			/>
		{/each}
	</div>
</section>
