<script lang="ts">
	import Block from '$lib/blocks/block.svelte';
	import { lightStore, selectedRoomStore, type LightStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import { toggleAreaState } from '$lib/data/ws';
	import Lights from '$lib/groups/lights.svelte';
	import Scenes from '$lib/groups/scenes.svelte';
	import Switches from '$lib/groups/switches.svelte';
	import ToggleSwitchOutline from 'svelte-material-icons/ToggleSwitchOutline.svelte';

	let selectedRoom: Rooms = Rooms.AllRooms;
	selectedRoomStore.subscribe((newSelectedRoom) => {
		selectedRoom = newSelectedRoom;
	});

	function handleRoomClick(e: MouseEvent) {
		const eventTarget = e.target as HTMLUListElement;
		if (Object.values(Rooms).includes(eventTarget.id as Rooms)) {
			selectedRoom = eventTarget.id as Rooms;
			selectedRoomStore.set(selectedRoom);
		}
	}

	let lights: LightStore = {};

	lightStore.subscribe(async (newLights) => {
		const stringifiedNew = JSON.stringify(newLights);
		if (JSON.stringify(lights) === stringifiedNew) return;
		lights = JSON.parse(stringifiedNew);
	});

	/* Function to turn all devices in a room on/off */
	function toggleAllDevices(state: 'on' | 'off') {
		toggleAreaState(selectedRoom, state);
	}
</script>

<style>
	.mainDrawer {
		height: 100%;
		flex-grow: 1;
		flex-basis: 0;

		padding: 1.5em 2em;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	.blocksContainer {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
	}
	.roomSelect {
		display: flex;
		flex-direction: row;
		padding: 0;
		list-style: none;
		font-size: 2em;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.3);
		height: fit-content;
		flex-shrink: 0;
		overflow-x: scroll;
	}
	.roomSelect::-webkit-scrollbar {
		display: none;
	}
	.roomSelect > li {
		padding: 0 0.75em;
		flex-grow: 1;
		min-width: fit-content;

		transition: color 0.2s ease;
	}
	.roomSelect > .selected {
		color: rgb(220, 220, 220);
	}
	.blocksContainer {
		display: grid;
		grid-template-columns: repeat(auto-fit, 180px);
		column-gap: 10px;
	}
	.flipIconDown {
		transform: rotate(-90deg);
	}
	.flipIconUp {
		transform: rotate(90deg);
	}
	.blockTitle {
		font-size: 1.25em;
	}
</style>

<section class="mainDrawer">
	<ul class="roomSelect" on:click={handleRoomClick}>
		{#each [...Object.values(Rooms)] as roomStr}
			<li id={roomStr} class:selected={selectedRoom === roomStr}>{roomStr}</li>
		{/each}
	</ul>
	<div class="blocksContainer">
		<Block
			backgroundColor="var(--block-default-light-color)"
			fontColor="#000"
			toggle
			onClick={() => toggleAllDevices('on')}
		>
			<span class="flipIconDown"><ToggleSwitchOutline height="5em" width="5em" /></span>
			<h2 class="blockTitle">All Devices On</h2>
		</Block>
		<Block
			backgroundColor="var(--block-default-dark-color)"
			fontColor="#fff"
			toggle
			onClick={() => toggleAllDevices('off')}
		>
			<span class="flipIconUp"><ToggleSwitchOutline height="5em" width="5em" /></span>
			<h2 class="blockTitle">All Devices Off</h2>
		</Block>
		<Scenes />
		<Switches />
		<Lights />
	</div>
</section>
