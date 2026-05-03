<script lang="ts">
	import { selectedRoomStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';

	let selectedRoom: Rooms = Rooms.AllRooms;
	selectedRoomStore.subscribe((r) => (selectedRoom = r));

	// Maps each SVG path ID to a Rooms value.
	// Living Room spans three named zones; Den/Office are the same physical room.
	const REGION_ROOM: Record<string, Rooms> = {
		Bedroom: Rooms.Bedroom,
		Office: Rooms.Office,
		Den: Rooms.Office,
		Hallway: Rooms.Hallway,
		'Living-Room-Overhead': Rooms.LivingRoom,
		'Living-Room-Above-Couch': Rooms.LivingRoom,
		'Living-Room-Dining-Area': Rooms.LivingRoom
		// Hall-Bathroom, Entryway, Kitchen intentionally omitted (no Rooms entry)
	};

	function handleRegionClick(pathId: string) {
		const room = REGION_ROOM[pathId];
		if (!room) return;
		selectedRoomStore.set(selectedRoom === room ? Rooms.AllRooms : room);
	}

	function isSelected(pathId: string): boolean {
		const room = REGION_ROOM[pathId];
		return !!room && selectedRoom === room;
	}

	function handleKeydown(e: KeyboardEvent, pathId: string) {
		if (e.key === 'Enter' || e.key === ' ') handleRegionClick(pathId);
	}
</script>

<style>
	.floorplanContainer {
		display: flex;
		justify-content: center;
		padding: 16px 24px;
		margin: 0 24px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.floorplan {
		height: 500px;
		opacity: 0.75;
		pointer-events: none;
	}

	svg {
		height: 380px;
		width: auto;
	}

	path {
		fill: transparent;
		stroke: currentColor;
		stroke-width: 6;
		stroke-linejoin: round;
		cursor: pointer;
		transition:
			fill 0.2s ease,
			stroke 0.2s ease;
	}

	path.selected {
		fill: color-mix(in srgb, var(--color-accent) 18%, transparent);
		stroke: color-mix(in srgb, var(--color-accent) 60%, transparent);
	}

	path:hover {
		fill: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	path.selected:hover {
		fill: color-mix(in srgb, var(--color-accent) 26%, transparent);
	}
</style>

<div class="floorplanContainer">
	<img class="floorplan" src="/floorplan.png" alt="Floorplan" />
	<!-- <svg viewBox="0 0 1413 964" xmlns="http://www.w3.org/2000/svg">
		<path
			id="Bedroom"
			role="button"
			tabindex="0"
			class:selected={isSelected('Bedroom')}
			d="M108.338,37.645L408.668,37.429L399.495,358.603L549.445,359.477L547.696,412.375L452.83,471.394L131.508,471.831L136.754,391.391L20.466,277.289L28.772,140.454"
			on:click={() => handleRegionClick('Bedroom')}
			on:keydown={(e) => handleKeydown(e, 'Bedroom')}
		/>
		<path
			id="Office"
			role="button"
			tabindex="0"
			class:selected={isSelected('Office')}
			d="M130.957,486.544L445.835,485.82L438.503,783.993L116.365,784.351"
			on:click={() => handleRegionClick('Office')}
			on:keydown={(e) => handleKeydown(e, 'Office')}
		/>
		<path
			id="Den"
			role="button"
			tabindex="0"
			class:selected={isSelected('Den')}
			d="M562.525,409.816L749.765,409.941L749.309,208.877L819.368,208.653L820.04,37.645L569.208,37.429L562.525,409.816Z"
			on:click={() => handleRegionClick('Den')}
			on:keydown={(e) => handleKeydown(e, 'Den')}
		/>
		<path
			id="Hallway"
			role="button"
			tabindex="0"
			class:selected={isSelected('Hallway')}
			d="M556.726,424.359L460.887,483.484L458.829,568.424L994.502,568.846L993.039,450.582L820.04,452.595L820.04,425.068"
			on:click={() => handleRegionClick('Hallway')}
			on:keydown={(e) => handleKeydown(e, 'Hallway')}
		/>
		<path
			id="Living-Room-Overhead"
			role="button"
			tabindex="0"
			class:selected={isSelected('Living-Room-Overhead')}
			d="M992.462,409.941L992.892,450.885L864.14,451.319L864.374,438.073L834.364,437.863L834.364,219.635L1192.408,216.575L1191.971,409.805"
			on:click={() => handleRegionClick('Living-Room-Overhead')}
			on:keydown={(e) => handleKeydown(e, 'Living-Room-Overhead')}
		/>
		<path
			id="Living-Room-Above-Couch"
			role="button"
			tabindex="0"
			class:selected={isSelected('Living-Room-Above-Couch')}
			d="M1192.408,216.575L1192.408,37.771L834.364,36.897L834.364,219.635"
			on:click={() => handleRegionClick('Living-Room-Above-Couch')}
			on:keydown={(e) => handleKeydown(e, 'Living-Room-Above-Couch')}
		/>
		<path
			id="Living-Room-Dining-Area"
			role="button"
			tabindex="0"
			class:selected={isSelected('Living-Room-Dining-Area')}
			d="M1192.408,37.771L1306.073,36.897L1384.276,119.701L1391.53,316.034L1319.625,409.805L1191.95,410.544"
			on:click={() => handleRegionClick('Living-Room-Dining-Area')}
			on:keydown={(e) => handleKeydown(e, 'Living-Room-Dining-Area')}
		/>
	</svg> -->
</div>
