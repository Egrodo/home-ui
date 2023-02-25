<script lang="ts">
	import Block from '$lib/blocks/block.svelte';
	import { switchStore, type SwitchStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { toggleSwitchState } from '$lib/data/ws';
	import { getIcon } from '$lib/utils/getIcon';
	import type { ComponentType } from 'svelte';
	import type { SwitchEntity } from '$lib/data/types';
	export let selectedRoom: Rooms;

	function toggleSwitch(switch_: SwitchEntity) {
		toggleSwitchState(switch_.entity_id, switch_.state === 'on' ? 'off' : 'on');
	}

	const switchIcons: { [switch_id: string]: ComponentType } = {};
	let switches: SwitchStore = {};
	const switchRoomMap = {
		[Rooms.AllRooms]: new Set(),
		[Rooms.Bedroom]: new Set(),
		[Rooms.LivingRoom]: new Set(),
		[Rooms.Office]: new Set()
	};

	switchStore.subscribe(async (newSwitches) => {
		for (const switch_ of Object.values(newSwitches)) {
			if (switchIcons[switch_.entity_id] == null) {
				let icon;
				if (switch_.attributes.icon) {
					icon = await getIcon(switch_.attributes.icon);
				} else {
					icon = await getIcon('mdi:lightbulb-variant');
				}
				switchIcons[switch_.entity_id] = icon;
			}

			Object.values(Rooms).forEach((roomId) => {
				if (switch_.attributes.friendly_name.includes(roomId)) {
					switchRoomMap[roomId].add(switch_.entity_id);

					switch_.attributes.friendly_name = switch_.attributes.friendly_name.replace(roomId, '');
				}
			});
		}

		switches = newSwitches;
	});

	$: switchesToShow = Object.values(switches).filter((switch_) => {
		if (selectedRoom === Rooms.AllRooms) return true;
		return switchRoomMap[selectedRoom].has(switch_.entity_id);
	});
</script>

<style>
	.switchName {
		font-size: 1.25em;
	}
</style>

{#each Object.values(switchesToShow) as switch_}
	<Block
		backgroundColor={switch_.state === 'on'
			? 'var(--block-default-light-color)'
			: 'var(--block-default-dark-color)'}
		fontColor={switch_.state === 'on' ? '#000' : '#fff'}
		onClick={() => toggleSwitch(switch_)}
		toggle
	>
		<svelte:component this={switchIcons[switch_.entity_id]} height="5em" width="5em" />
		<h2 class="switchName">{switch_.attributes.friendly_name}</h2>
	</Block>
{/each}
