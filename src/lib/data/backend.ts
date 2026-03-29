import { writable } from 'svelte/store';
import { subscribeEntities, type Connection, type UnsubscribeFunc } from 'home-assistant-js-websocket';
import {
	initWsConnection,
	fetchDeviceRegistry,
	fetchEntityRegistry,
	setHiddenEntityIds,
	handleStateMessage,
	toggleLightState,
	toggleSwitchState,
	activateScene as _activateScene,
	toggleAreaState,
	changeLightBrightness,
	changeLightColor,
	changeLightTemperature,
	changeLightEffect
} from './ws';
import type { DeviceInfoLookupTable, EntityAreaMap } from './types';
import { Rooms } from './types';

// Module-scoped connection state
let connection: Connection | null = null;
let unsubscribe: UnsubscribeFunc | null = null;

/** Reactive store for entity → area mapping, used by components for room filtering */
export const entityAreaMapStore = writable<EntityAreaMap>({});

/** Reactive store for connection status */
export const isConnectedStore = writable<boolean>(false);

function getConnection(): Connection {
	if (!connection) throw new Error('Backend not initialized — call initBackend() first');
	return connection;
}

/**
 * Initialize the backend: WebSocket connection, registries, entity subscription.
 * Call once from +layout.ts on the client side.
 */
export async function initBackend(): Promise<void> {
	connection = await initWsConnection();
	isConnectedStore.set(true);

	const [deviceRegistry, entityRegistry] = await Promise.all([
		fetchDeviceRegistry(connection),
		fetchEntityRegistry(connection)
	]);

	let deviceLookupTable: DeviceInfoLookupTable = {};
	if (deviceRegistry) {
		deviceLookupTable = deviceRegistry.reduce<DeviceInfoLookupTable>((acc, info) => {
			acc[info.id] = info;
			return acc;
		}, {});
	} else {
		console.error('Device registry nullish?');
	}

	setHiddenEntityIds(entityRegistry);

	// Subscribe AFTER hidden set is populated so the first state message is filtered correctly
	unsubscribe = subscribeEntities(connection, handleStateMessage);

	// Build entity_id → area_id map. Entity-level area_id takes precedence over device area_id.
	const entityAreaMap = entityRegistry.reduce<EntityAreaMap>((acc, entry) => {
		acc[entry.entity_id] =
			entry.area_id ??
			(entry.device_id ? (deviceLookupTable[entry.device_id]?.area_id ?? null) : null);
		return acc;
	}, {});

	entityAreaMapStore.set(entityAreaMap);
}

/** Clean up the backend connection */
export function destroyBackend(): void {
	unsubscribe?.();
	unsubscribe = null;
	connection = null;
	isConnectedStore.set(false);
}

// --- Connection-free service call wrappers ---

export function toggleLight(entityId: string, state: 'on' | 'off') {
	return toggleLightState(getConnection(), entityId, state);
}

export function toggleSwitch(entityId: string, state: 'on' | 'off') {
	return toggleSwitchState(getConnection(), entityId, state);
}

export function activateScene(sceneId: string) {
	return _activateScene(getConnection(), sceneId);
}

export function toggleArea(room: Rooms, state: 'on' | 'off') {
	return toggleAreaState(getConnection(), room, state);
}

export function changeBrightness(entityId: string, brightness: number) {
	return changeLightBrightness(getConnection(), entityId, brightness);
}

export function changeColor(entityId: string, rgb: [number, number, number]) {
	return changeLightColor(getConnection(), entityId, rgb);
}

export function changeTemperature(entityId: string, temperature: number) {
	return changeLightTemperature(getConnection(), entityId, temperature);
}

export function changeEffect(entityId: string, effect: string) {
	return changeLightEffect(getConnection(), entityId, effect);
}
