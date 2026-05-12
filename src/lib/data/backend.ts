import { writable } from 'svelte/store';
import {
	subscribeEntities,
	type Connection,
	type UnsubscribeFunc
} from 'home-assistant-js-websocket';
import { PUBLIC_WEATHER_ENTITY_ID, PUBLIC_CALENDAR_ENTITY_ID } from '$env/static/public';
import {
	initWsConnection,
	fetchDeviceRegistry,
	fetchEntityRegistry,
	fetchWeatherForecast,
	fetchHourlyForecast,
	fetchTemperatureHistory,
	fetchCalendarEvents,
	setHiddenEntityIds,
	handleStateMessage,
	toggleLightState,
	toggleSwitchState,
	activateScene as _activateScene,
	toggleAreaState,
	changeLightBrightness,
	changeLightColor,
	changeLightTemperature,
	changeLightEffect,
	TEMPERATURE_SENSOR_ENTITY_ID
} from './ws';
import type { DeviceInfoLookupTable, EntityAreaMap } from './types';
import { Rooms } from './types';
import {
	calendarStore,
	hourlyForecastStore,
	temperatureHistoryStore,
	weatherStore
} from './backendStores';

// Module-scoped connection state
let connection: Connection | null = null;
let unsubscribe: UnsubscribeFunc | null = null;
let calendarPollTimer: ReturnType<typeof setInterval> | null = null;
let tempHistoryPollTimer: ReturnType<typeof setInterval> | null = null;
const TEMP_HISTORY_REFRESH_MS = 15 * 60 * 1000;

/** Reactive store for entity → area mapping, used by components for room filtering */
export const entityAreaMapStore = writable<EntityAreaMap>({});

/** Reactive store for connection status */
export const isConnectedStore = writable<boolean>(false);

function getConnection(): Connection {
	if (!connection) throw new Error('Backend not initialized — call initBackend() first');
	return connection;
}

async function refreshCalendar(): Promise<void> {
	const conn = getConnection();
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).toISOString();
	const events = await fetchCalendarEvents(conn, PUBLIC_CALENDAR_ENTITY_ID, start, end);
	calendarStore.set(events);
}

async function refreshTemperatureHistory(): Promise<void> {
	const conn = getConnection();
	const samples = await fetchTemperatureHistory(conn, TEMPERATURE_SENSOR_ENTITY_ID);
	if (samples.length) temperatureHistoryStore.set(samples);
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

	// Forecast data was moved out of state attributes in HA 2024.3+ — fetch separately
	fetchWeatherForecast(connection, PUBLIC_WEATHER_ENTITY_ID).then((forecast) => {
		if (forecast.length) weatherStore.patchForecast(forecast);
	});
	fetchHourlyForecast(connection, PUBLIC_WEATHER_ENTITY_ID).then((forecast) => {
		if (forecast.length) hourlyForecastStore.set(forecast);
	});

	refreshCalendar();
	calendarPollTimer = setInterval(refreshCalendar, 60 * 60 * 1000);

	refreshTemperatureHistory();
	tempHistoryPollTimer = setInterval(refreshTemperatureHistory, TEMP_HISTORY_REFRESH_MS);

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
	if (calendarPollTimer) {
		clearInterval(calendarPollTimer);
		calendarPollTimer = null;
	}
	if (tempHistoryPollTimer) {
		clearInterval(tempHistoryPollTimer);
		tempHistoryPollTimer = null;
	}
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
