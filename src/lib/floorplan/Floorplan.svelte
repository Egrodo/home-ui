<script lang="ts">
	import { selectedRoomStore } from '$lib/data/stores';
	import { Rooms } from '$lib/data/types';

	let selectedRoom: Rooms = Rooms.AllRooms;
	selectedRoomStore.subscribe((r) => (selectedRoom = r));

	const REGION_ROOM: Record<string, Rooms> = {
		'master-bedroom': Rooms.Bedroom,
		'guest-bedroom': Rooms.Office,
		den: Rooms.Den,
		'living-room': Rooms.LivingRoom,
		hallway: Rooms.Hallway
		// hallway-bathroom, stairwell, kitchen, master-bathroom, guest-bathroom: no Rooms entry
	};

	let timer: ReturnType<typeof setTimeout>;
	function handleRegionClick(e: MouseEvent, pathId: string) {
		e.stopPropagation();
		const room = REGION_ROOM[pathId];
		if (!room) {
			selectedRoomStore.set(Rooms.AllRooms);
			return;
		}
		selectedRoomStore.set(selectedRoom === room ? Rooms.AllRooms : room);

		clearTimeout(timer);
		// If the user clicks a region, reset to all rooms after 5 minutes of inactivity
		timer = setTimeout(
			() => {
				selectedRoomStore.set(Rooms.AllRooms);
			},
			5 * 60 * 1000
		);
	}

	function pathStyle(pathId: string, room: Rooms): string {
		const clickable = !!REGION_ROOM[pathId];
		const dimmed =
			room !== Rooms.AllRooms && (!REGION_ROOM[pathId] || REGION_ROOM[pathId] !== room);
		return [
			`fill: ${dimmed ? 'rgba(255,255,255,0.7)' : 'transparent'}`,
			`cursor: ${clickable ? 'pointer' : 'default'}`,
			'stroke: none',
			'transition: fill 0.15s ease'
		].join('; ');
	}

	function handleContainerClick() {
		selectedRoomStore.set(Rooms.AllRooms);
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
		cursor: pointer;
	}

	.floorplanWrapper {
		position: relative;
		display: inline-block;
		height: 380px;
	}

	.floorplan {
		height: 380px;
		width: auto;
		opacity: 0.5;
		display: block;
		pointer-events: none;
	}

	.regionsOverlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="floorplanContainer" on:click={handleContainerClick}>
	<div class="floorplanWrapper">
		<img class="floorplan" src="/floorplan.png" alt="Floorplan" />
		<svg class="regionsOverlay" viewBox="0 0 1698 1110" xmlns="http://www.w3.org/2000/svg">
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="master-bedroom"
				d="M670.755,482.732L670.249,426.052L499.196,426.558L498.791,33.339L145.35,32.934L59.52,161.274L60.33,322.003L200.411,456.416L200.411,546.7L563.164,547.104L670.755,482.732Z"
				style={pathStyle('master-bedroom', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'master-bedroom')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="master-bathroom"
				d="M515.884,401.922L670.755,401.847L670.755,33.958L516.204,33.851"
				style={pathStyle('master-bathroom', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'master-bathroom')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="den"
				d="M904.677,478.013L690.608,477.507L689.596,32.934L980.082,32.934L979.576,237.628L901.134,238.641"
				style={pathStyle('den', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'den')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<g transform="matrix(1.002694,0,0,0.995165,-4.417389,2.547196)">
				<path
					id="living-room"
					d="M1000.562,32.934L1554.206,32.934L1639.732,135.607L1637.708,365.871L1553.7,478.013L1178.462,478.013L1178.462,526.296L1032.444,526.802L1033.457,510.101L999.55,509.089"
					style={pathStyle('living-room', selectedRoom)}
					on:click={(e) => handleRegionClick(e, 'living-room')}
				/>
			</g>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="hallway"
				d="M682.511,495.726C683.523,494.207 980.082,496.232 980.082,496.232L979.576,527.608L1176.944,529.126L1178.462,659.693L575.729,659.187L574.717,560.503"
				style={pathStyle('hallway', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'hallway')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="guest-bedroom"
				d="M202.304,566.171L201.332,898.803L556.636,901.07L555.664,565.848"
				style={pathStyle('guest-bedroom', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'guest-bedroom')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="hallway-bathroom"
				d="M767.786,677.008L575.527,677.785L574.491,1062.681L767.009,1062.681"
				style={pathStyle('hallway-bathroom', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'hallway-bathroom')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="stairwell"
				d="M1034.136,659.693L1033.124,1061.163L786.666,1062.681L785.654,659.693"
				style={pathStyle('stairwell', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'stairwell')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="kitchen"
				d="M1052.355,677.56L1197.091,678.572L1199.116,495.161L1545.776,495.161L1545.472,1062.681L1051.95,1062.681"
				style={pathStyle('kitchen', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'kitchen')}
			/>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
			<path
				id="guest-bathroom"
				d="M302.173,917.984L557.053,917.984L557.053,1064.08L301.675,1063.914"
				style={pathStyle('guest-bathroom', selectedRoom)}
				on:click={(e) => handleRegionClick(e, 'guest-bathroom')}
			/>
		</svg>
	</div>
</div>
