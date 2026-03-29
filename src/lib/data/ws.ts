import { browser } from '$app/environment';
import {
	PUBLIC_WS_AUTH_KEY,
	PUBLIC_SERVER_URL,
	PUBLIC_WEATHER_ENTITY_ID
} from '$env/static/public';
import {
	createConnection,
	Connection,
	type MessageBase,
	createLongLivedTokenAuth,
	type HassEntities,
	type HassEntity
} from 'home-assistant-js-websocket';
import { lightStore, sceneStore, switchStore, weatherStore } from './backendStores';
import {
	Rooms,
	type LightEntity,
	type SceneEntity,
	type SwitchEntity,
	type WeatherEntity
} from './types';

import type { DeviceInfo, EntityRegistryEntry } from './types';

/** Set of entity IDs that are hidden/disabled in HA and should not appear in the UI */
let hiddenEntityIds: Set<string> = new Set();

export function setHiddenEntityIds(entityRegistry: EntityRegistryEntry[]) {
	hiddenEntityIds = new Set(
		entityRegistry
			.filter(
				(entry) =>
					entry.hidden_by != null ||
					entry.disabled_by != null ||
					entry.entity_category != null
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
		weatherStore.set(weatherEntity);
	}
}

export const ROOM_AREA_IDS: Partial<Record<Rooms, string[]>> = {
	[Rooms.LivingRoom]: ['living_room'],
	[Rooms.Bedroom]: ['bedroom'],
	[Rooms.Office]: ['den'],
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
