<script lang="ts">
	const roomIds = new Set(['All Rooms', 'Bedroom', 'Living Room', 'Office']);

	let selected: string = 'All Rooms';
	function handleRoomClick(e: MouseEvent) {
		const eventTarget = e.target as HTMLUListElement;
		if (roomIds.has(eventTarget.id)) selected = eventTarget.id;
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
</style>

<section class="mainDrawer">
	<ul class="roomSelect" on:click={handleRoomClick}>
		{#each [...roomIds] as roomStr}
			<li id={roomStr} class:selected={selected === roomStr}>{roomStr}</li>
		{/each}
	</ul>
	<div class="blocksContainer" />
</section>
