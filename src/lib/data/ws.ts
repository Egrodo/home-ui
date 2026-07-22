import { browser } from '$app/environment';
import {
	PUBLIC_WS_AUTH_KEY,
	PUBLIC_SERVER_URL,
	PUBLIC_WEATHER_ENTITY_ID,
	PUBLIC_AIR_QUALITY_DEVICE
} from '$env/static/public';
import {
	createConnection,
	Connection,
	type MessageBase,
	type UnsubscribeFunc,
	createLongLivedTokenAuth,
	type HassEntities,
	type HassEntity
} from 'home-assistant-js-websocket';
import { get } from 'svelte/store';
import {
	airQualityStore,
	lightStore,
	notesStore,
	outdoorTempStore,
	sceneStore,
	sunStore,
	switchStore,
	weatherStore
} from './backendStores';
import {
	Rooms,
	type AirQualityReadings,
	type CalendarEvent,
	type ForecastType,
	type LightEntity,
	type SceneEntity,
	type SunEntity,
	type SwitchEntity,
	type TemperatureSample,
	type TodoItem,
	type WeatherEntity
} from './types';

/** Outdoor temperature sensor — denser and same unit (°F) as we want for the graph. */
export const TEMPERATURE_SENSOR_ENTITY_ID = 'sensor.weather_temperature';

/**
 * Airthings air quality monitor sensors, derived from the device's entity slug
 * (PUBLIC_AIR_QUALITY_DEVICE, e.g. "air_qualington"). The suffixes are the
 * standard names the Airthings HA integration assigns to each sensor.
 */
export const AIR_QUALITY_ENTITY_IDS = {
	radon: `sensor.${PUBLIC_AIR_QUALITY_DEVICE}_radon`,
	co2: `sensor.${PUBLIC_AIR_QUALITY_DEVICE}_carbon_dioxide`,
	voc: `sensor.${PUBLIC_AIR_QUALITY_DEVICE}_volatile_organic_compounds_parts`,
	pm25: `sensor.${PUBLIC_AIR_QUALITY_DEVICE}_pm2_5`,
	humidity: `sensor.${PUBLIC_AIR_QUALITY_DEVICE}_humidity`,
	temperature: `sensor.${PUBLIC_AIR_QUALITY_DEVICE}_temperature`
} as const;

/** Pull the latest Airthings readings straight from the full entity collection. */
function extractAirQuality(states: HassEntities): AirQualityReadings {
	const read = (entityId: string): number | null => {
		const value = parseFloat(states[entityId]?.state ?? '');
		return isNaN(value) ? null : value;
	};
	return {
		radon: read(AIR_QUALITY_ENTITY_IDS.radon),
		co2: read(AIR_QUALITY_ENTITY_IDS.co2),
		voc: read(AIR_QUALITY_ENTITY_IDS.voc),
		pm25: read(AIR_QUALITY_ENTITY_IDS.pm25),
		humidity: read(AIR_QUALITY_ENTITY_IDS.humidity),
		temperature: read(AIR_QUALITY_ENTITY_IDS.temperature)
	};
}

import type { DeviceInfo, EntityRegistryEntry } from './types';

/** Set of entity IDs that are hidden/disabled in HA and should not appear in the UI */
let hiddenEntityIds: Set<string> = new Set();

export function setHiddenEntityIds(entityRegistry: EntityRegistryEntry[]) {
	hiddenEntityIds = new Set(
		entityRegistry
			.filter(
				(entry) =>
					entry.hidden_by != null || entry.disabled_by != null || entry.entity_category != null
			)
			.map((entry) => entry.entity_id)
	);
}

/**
 * This function handles filtering out data for the:
 *  - lights
 *  - switches
 *  - weather
 *  - scenes
 *
 * Then it checks whether those state updates are fresh, and if so,
 *
 * and processing it into the appropriate stores.
 */
export function handleStateMessage(states: HassEntities) {
	// Here I am creating arrays for the updates of each state entity type
	const [lightEntities, switchEntities, sceneEntities, weatherEntity]: [
		LightEntity[],
		SwitchEntity[],
		SceneEntity[],
		WeatherEntity | null
	] = Object.entries<HassEntity>(states).reduce<
		[LightEntity[], SwitchEntity[], SceneEntity[], WeatherEntity | null]
	>(
		(acc, [entity_id, entity]: [string, HassEntity]) => {
			if (entity.state === 'unavailable') return acc;
			if (entity.attributes?.friendly_name == null) return acc;
			if (hiddenEntityIds.has(entity_id)) return acc;

			const [lights, switches, scenes, weather] = acc;
			let newWeather = weather;
			if (entity_id.startsWith('light.')) {
				// @ts-expect-error Refining type
				const lightEntity = entity as LightEntity;
				lights.push(lightEntity);
			} else if (entity_id.startsWith('switch.')) {
				const switchEntity = entity as SwitchEntity;
				switches.push(switchEntity);
			} else if (entity_id.startsWith('scene.')) {
				// @ts-expect-error Refining type
				const sceneEntity = entity as SceneEntity;
				scenes.push(sceneEntity);
			} else if (entity_id === PUBLIC_WEATHER_ENTITY_ID) {
				// Unlike the other entity types, we only care about one specific weather entity
				// @ts-expect-error Refining type
				const weatherEntity = entity as WeatherEntity;
				newWeather = weatherEntity;
			} else if (entity_id === 'sun.sun') {
				// @ts-expect-error Refining type
				sunStore.set(entity as SunEntity);
			} else if (entity_id === TEMPERATURE_SENSOR_ENTITY_ID) {
				const t = parseFloat(entity.state);
				if (!isNaN(t)) outdoorTempStore.set(t);
			}

			return [lights, switches, scenes, newWeather];
		},
		[[], [], [], null]
	);

	if (lightEntities.length) {
		lightStore.addOrUpdate(lightEntities);
	}
	if (switchEntities.length) {
		switchStore.addOrUpdate(switchEntities);
	}
	if (sceneEntities.length) {
		sceneStore.addOrUpdate(sceneEntities);
	}
	if (weatherEntity) {
		const existing = get(weatherStore);
		const forecast = weatherEntity.attributes.forecast?.length
			? weatherEntity.attributes.forecast
			: existing?.attributes.forecast;
		weatherStore.set({ ...weatherEntity, attributes: { ...weatherEntity.attributes, forecast } });
	}

	airQualityStore.set(extractAirQuality(states));

	// Discover every `todo.*` list and register its title. subscribeEntities always
	// hands us the full state collection, so rebuilding this set each message also
	// drops lists that were deleted. Items arrive separately via per-list subscriptions.
	const todoLists = Object.entries(states)
		.filter(
			([entityId, entity]) =>
				entityId.startsWith('todo.') &&
				entity.state !== 'unavailable' &&
				entity.attributes?.friendly_name != null &&
				!hiddenEntityIds.has(entityId)
		)
		.map(([entityId, entity]) => ({
			entityId,
			title: entity.attributes.friendly_name as string
		}));
	notesStore.setLists(todoLists);
}

export const ROOM_AREA_IDS: Partial<Record<Rooms, string[]>> = {
	[Rooms.LivingRoom]: ['living_room'],
	[Rooms.Bedroom]: ['bedroom'],
	[Rooms.Office]: ['office'],
	[Rooms.Den]: ['den'],
	[Rooms.Hallway]: ['hallway']
};

const getAreaIds = (room: Rooms): string[] => {
	if (room === Rooms.AllRooms) return Object.values(ROOM_AREA_IDS).flat();
	return ROOM_AREA_IDS[room] ?? [];
};

async function sendWsMessage(connection: Connection, payload: MessageBase) {
	if (!connection || connection.connected === false) {
		console.error(`Websocket connection not established, cannot send message`, payload);
		return;
	}
	console.log(`Sending message to websocket:`, payload);
	try {
		const response = await connection.sendMessagePromise(payload);
		return response;
	} catch (err) {
		console.error('Error sending message to websocket: ', err);

		// If errored, reconnect and try again. If it errors again, fuck it.
		await initWsConnection();
		return connection.sendMessagePromise(payload);
	}
}

export async function toggleAreaState(connection: Connection, room: Rooms, state: 'on' | 'off') {
	const areaIds = getAreaIds(room);

	const promises = areaIds.map((areaId) =>
		sendWsMessage(connection, {
			type: 'call_service',
			domain: 'homeassistant',
			service: `turn_${state}`,
			target: {
				area_id: areaId
			}
		})
	);
	return Promise.all(promises);
}

export async function toggleLightState(
	connection: Connection,
	entityId: string,
	state: 'on' | 'off'
) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'light',
		service: `turn_${state}`,
		target: {
			entity_id: entityId
		}
	});
}

export async function changeLightBrightness(
	connection: Connection,
	entityId: string,
	brightness: number
) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'light',
		service: 'turn_on',
		target: {
			entity_id: entityId
		},
		service_data: {
			brightness
		}
	});
}

export async function changeLightTemperature(
	connection: Connection,
	entityId: string,
	temperature: number
) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'light',
		service: 'turn_on',
		target: {
			entity_id: entityId
		},
		service_data: {
			color_temp_kelvin: temperature
		}
	});
}

export async function changeLightColor(
	connection: Connection,
	entityId: string,
	rgb: [number, number, number]
) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'light',
		service: 'turn_on',
		target: {
			entity_id: entityId
		},
		service_data: {
			rgb_color: rgb,
			effect: 'solid'
		}
	});
}

export async function changeLightEffect(connection: Connection, entityId: string, effect: string) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'light',
		service: 'turn_on',
		target: {
			entity_id: entityId
		},
		service_data: {
			effect
		}
	});
}

export async function toggleSwitchState(
	connection: Connection,
	entityId: string,
	state: 'on' | 'off'
) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'switch',
		service: `turn_${state}`,
		target: {
			entity_id: entityId
		}
	});
}

export async function activateScene(connection: Connection, sceneId: string) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'scene',
		service: 'turn_on',
		target: {
			entity_id: sceneId
		}
	});
}

/**
 * Subscribe to live item updates for a single `todo.*` list. The callback fires
 * immediately with the current items and again on every change (including edits
 * made from the HA app or voice). Returns the unsubscribe handle.
 */
export function subscribeTodoItems(
	connection: Connection,
	entityId: string,
	onItems: (items: TodoItem[]) => void
): Promise<UnsubscribeFunc> {
	return connection.subscribeMessage<{ items: TodoItem[] }>((msg) => onItems(msg?.items ?? []), {
		type: 'todo/item/subscribe',
		entity_id: entityId
	});
}

/** Set a todo item's status (used to mark items done / not-done). */
export async function setTodoItemStatus(
	connection: Connection,
	entityId: string,
	uid: string,
	status: TodoItem['status']
) {
	return sendWsMessage(connection, {
		type: 'call_service',
		domain: 'todo',
		service: 'update_item',
		target: { entity_id: entityId },
		service_data: { item: uid, status }
	});
}

/**
 * Delete an entire todo list. Local To-do lists are backed by a config entry, so
 * we resolve the list entity's config_entry_id and remove that entry. This is
 * irreversible and removes the list from Home Assistant, not just from this UI.
 */
export async function deleteTodoList(connection: Connection, entityId: string) {
	const entry = await connection.sendMessagePromise<{ config_entry_id: string | null }>({
		type: 'config/entity_registry/get',
		entity_id: entityId
	});
	if (!entry?.config_entry_id) {
		throw new Error(`Cannot delete ${entityId}: no config_entry_id found`);
	}
	// Removing a config entry is a REST-only HA endpoint with no CORS headers, so
	// the browser can't call it directly — go through our same-origin proxy, which
	// forwards the DELETE to HA server-side.
	const response = await fetch(
		`/api/todo-list?config_entry_id=${encodeURIComponent(entry.config_entry_id)}`,
		{ method: 'DELETE' }
	);
	if (!response.ok) {
		throw new Error(`Failed to delete config entry ${entry.config_entry_id}: ${response.status}`);
	}
	return response.json();
}

export async function initWsConnection() {
	if (browser) {
		const auth = createLongLivedTokenAuth(PUBLIC_SERVER_URL, PUBLIC_WS_AUTH_KEY);
		const connection = await createConnection({ auth, setupRetry: -1 });
		return connection;
	} else {
		throw new Error('Cannot create websocket connection on server');
	}
}

export async function fetchDeviceRegistry(connection: Connection): Promise<DeviceInfo[] | null> {
	if (connection == null || connection.connected === false)
		throw new Error('Cannot fetch device registry without connection setup');

	try {
		const deviceRegistry = await connection.sendMessagePromise<DeviceInfo[]>({
			type: 'config/device_registry/list'
		});
		if (deviceRegistry == null || deviceRegistry.length === 0)
			throw new Error('Device registry empty');
		return deviceRegistry;
	} catch (err: any) {
		throw new Error('Failed to fetch device registry', err);
	}
}

export async function fetchWeatherForecast(
	connection: Connection,
	entityId: string
): Promise<ForecastType[]> {
	try {
		const result = await connection.sendMessagePromise<{
			response: Record<string, { forecast: ForecastType[] }>;
		}>({
			type: 'call_service',
			domain: 'weather',
			service: 'get_forecasts',
			service_data: { type: 'daily' },
			target: { entity_id: entityId },
			return_response: true
		});
		return result?.response?.[entityId]?.forecast ?? [];
	} catch (err) {
		console.error('Failed to fetch weather forecast:', err);
		return [];
	}
}

export async function fetchHourlyForecast(
	connection: Connection,
	entityId: string
): Promise<ForecastType[]> {
	try {
		const result = await connection.sendMessagePromise<{
			response: Record<string, { forecast: ForecastType[] }>;
		}>({
			type: 'call_service',
			domain: 'weather',
			service: 'get_forecasts',
			service_data: { type: 'hourly' },
			target: { entity_id: entityId },
			return_response: true
		});
		return result?.response?.[entityId]?.forecast ?? [];
	} catch (err) {
		console.error('Failed to fetch hourly weather forecast:', err);
		return [];
	}
}

/**
 * Fetch outdoor temperature history for the given entity over the last `hoursBack` hours.
 * Uses HA's `history/history_during_period` WS command with `minimal_response` for a compact payload
 * (the response uses short field names: `s` = state, `lu` = last_updated epoch seconds).
 */
export async function fetchTemperatureHistory(
	connection: Connection,
	entityId: string,
	hoursBack: number = 48
): Promise<TemperatureSample[]> {
	const end = new Date();
	const start = new Date(end.getTime() - hoursBack * 3600_000);
	try {
		const result = await connection.sendMessagePromise<
			Record<string, Array<{ s?: string; state?: string; lu?: number; last_updated?: string }>>
		>({
			type: 'history/history_during_period',
			start_time: start.toISOString(),
			end_time: end.toISOString(),
			entity_ids: [entityId],
			minimal_response: true,
			no_attributes: true
		});
		const rows = result?.[entityId] ?? [];
		return rows
			.map((r) => {
				const stateStr = r.s ?? r.state ?? '';
				const temperature = parseFloat(stateStr);
				const datetime =
					typeof r.lu === 'number' ? new Date(r.lu * 1000).toISOString() : (r.last_updated ?? '');
				return { datetime, temperature };
			})
			.filter((s) => !isNaN(s.temperature) && s.datetime !== '');
	} catch (err) {
		console.error('Failed to fetch temperature history:', err);
		return [];
	}
}

export async function fetchCalendarEvents(
	connection: Connection,
	entityId: string,
	start: string,
	end: string
): Promise<CalendarEvent[]> {
	try {
		const result = await connection.sendMessagePromise<{
			response: Record<string, { events: CalendarEvent[] }>;
		}>({
			type: 'call_service',
			domain: 'calendar',
			service: 'get_events',
			service_data: { start_date_time: start, end_date_time: end },
			target: { entity_id: entityId },
			return_response: true
		});
		return result?.response?.[entityId]?.events ?? [];
	} catch (err) {
		console.error('Failed to fetch calendar events:', err);
		return [];
	}
}

export async function fetchEntityRegistry(connection: Connection): Promise<EntityRegistryEntry[]> {
	if (connection == null || connection.connected === false)
		throw new Error('Cannot fetch entity registry without connection setup');

	try {
		const entries = await connection.sendMessagePromise<EntityRegistryEntry[]>({
			type: 'config/entity_registry/list'
		});
		return entries ?? [];
	} catch (err: any) {
		throw new Error('Failed to fetch entity registry', err);
	}
}
