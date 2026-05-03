import { writable } from 'svelte/store';
import { Rooms } from './types';

// Re-export entity data stores from backendStores for backward compatibility
export {
	lightStore,
	switchStore,
	sceneStore,
	weatherStore,
	type LightStore,
	type SwitchStore,
	type SceneStore
} from './backendStores';

// --- UI-only stores ---

function createSelectedRoomStore() {
	const { subscribe, set } = writable<Rooms>(Rooms.AllRooms);

	return {
		subscribe,
		set
	};
}

export const selectedRoomStore = createSelectedRoomStore();

function createSelectedLightIdStore() {
	const { subscribe, set } = writable<string | null>(null);

	return {
		subscribe,
		set
	};
}

export const selectedLightIdStore = createSelectedLightIdStore();
