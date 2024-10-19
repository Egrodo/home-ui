<script lang="ts">
	import type { AppConnections } from '$lib/data/types';
	import type { ComponentType } from 'svelte';

	import Block from '$lib/blocks/block.svelte';
	import { switchStore, type SwitchStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { toggleSwitchState } from '$lib/data/ws';
	import { getIcon } from '$lib/utils/getIcon';

	export let selectedRoom: Rooms;
	export let data: AppConnections;

	type FormattedSwitchType = {
		id: string;
		state: 'on' | 'off';
		name: string;
	};

	function toggleSwitch(switch_: FormattedSwitchType) {
		toggleSwitchState(data.wsConnection, switch_.id, switch_.state === 'on' ? 'off' : 'on');
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

					// TODO: BUG: This might be causing room reduction not to work
					// switch_.attributes.friendly_name = switch_.attributes.friendly_name.replace(
					// 	`${roomId} `,
					// 	''
					// );
				}
			});
		}

		switches = newSwitches;
	});

	$: switchesToShow = Object.values(switches).reduce<FormattedSwitchType[]>((acc, switch_) => {
		const formattedSwitch: FormattedSwitchType = {
			id: switch_.entity_id,
			state: switch_.state as 'on' | 'off',
			name: switch_.attributes.friendly_name
		};

		if (
			selectedRoom === Rooms.AllRooms ||
			switch_.attributes.friendly_name.includes(selectedRoom)
		) {
			// Remove room name from switch name
			formattedSwitch.name = switch_.attributes.friendly_name.replace(`${selectedRoom} `, '');
			acc.push(formattedSwitch);
		}
		return acc;
	}, []);
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
		<svelte:component this={switchIcons[switch_.id]} height="5em" width="5em" />
		<h2 class="switchName">{switch_.name}</h2>
	</Block>
{/each}
