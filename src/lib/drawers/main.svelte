<script lang="ts">
	import { selectedRoomStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';
	import Scenes from '$lib/groups/scenes.svelte';

	let selectedRoom: Rooms = Rooms.AllRooms;
	selectedRoomStore.subscribe((newSelectedRoom) => {
		selectedRoom = newSelectedRoom;
	});

	function handleRoomClick(e: MouseEvent) {
		const eventTarget = e.target as HTMLUListElement;
		if (Object.values(Rooms).includes(eventTarget.id as Rooms))
			selectedRoom = eventTarget.id as Rooms;
	}
</script>

<style>
	.mainDrawer {
		height: 100%;
		flex-grow: 1;
		flex-basis: 0;

		padding: 1.5em 2em 0 2em;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.blocksContainer {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
	}

	/* room select css */
	.roomSelect {
		display: flex;
		flex-direction: row;
		padding: 0;
		list-style: none;
		font-size: 2em;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.3);
		height: fit-content;

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
</style>

<section class="mainDrawer">
	<ul class="roomSelect" on:click={handleRoomClick}>
		{#each [...Object.values(Rooms)] as roomStr}
			<li id={roomStr} class:selected={selectedRoom === roomStr}>{roomStr}</li>
		{/each}
	</ul>
	<div class="blocksContainer">
		<Scenes />
	</div>
</section>
