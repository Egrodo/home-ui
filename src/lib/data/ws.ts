import { browser } from '$app/environment';
import { PUBLIC_WS_AUTH_KEY, PUBLIC_CLIENT_ID, PUBLIC_SERVER_URL } from '$env/static/public';
import { createConnection, Auth, Connection, type MessageBase } from 'home-assistant-js-websocket';
import { lightStore, sceneStore, switchStore, weatherStore } from './stores';
import {
	Rooms,
	type Entity,
	type LightEntity,
	type SceneEntity,
	type SwitchEntity,
	type WeatherEntity
} from './types';

export interface WsStateMessage {
	[entityId: string]: Entity;
}

/**
 * Storing the connection obj in the scope of this file bc honestly it's no different than
 * anywhere else probz.
 */
let connection: Connection;

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
export function handleStateMessage(states: WsStateMessage) {
	// Here I am creating arrays for the updates of each state entity type, but only
	// if they happened between now and the last time that entity state was updated.
	// This is to avoid unnecessary re-renders.
	const [lightEntities, switchEntities, sceneEntities, weatherEntity]: [
		LightEntity[],
		SwitchEntity[],
		SceneEntity[],
		WeatherEntity | null
	] = Object.entries<Entity>(states).reduce<
		[LightEntity[], SwitchEntity[], SceneEntity[], WeatherEntity | null]
	>(
		(acc, [entity_id, entity]: [string, Entity]) => {
			const [lights, switches, scenes, weather] = acc;
			let newWeather = weather;
			if (entity_id.startsWith('light.')) {
				const lightEntity = entity as LightEntity;
				lights.push(lightEntity);
			} else if (entity_id.startsWith('switch.')) {
				const switchEntity = entity as SwitchEntity;
				switches.push(switchEntity);
			} else if (entity_id.startsWith('scene.')) {
				const sceneEntity = entity as SceneEntity;
				scenes.push(sceneEntity);
			} else if (entity_id === 'weather.home') {
				// Unlike the other entity types, we only care about one specific weather entity
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

const getAreaIds = (room: Rooms): string[] => {
	switch (room) {
		case Rooms.LivingRoom: {
			return ['living_room'];
		}
		case Rooms.Bedroom: {
			return ['bedroom'];
		}
		case Rooms.Office: {
			return ['office'];
		}
		case Rooms.AllRooms: {
			return ['living_room', 'bedroom', 'office'];
		}
	}
};

async function sendWsMessage(payload: MessageBase) {
	if (!connection || connection.connected === false) {
		console.error(`Websocket connection not established, cannot send message`, payload);
		return;
	}
	console.log(`Sending message to websocket:`, payload);
	try {
		return connection.sendMessagePromise(payload);
	} catch (err) {
		console.error(`Error sending message to websocket:`, payload);
		// TODO: Build error displayer
	}
}

export async function toggleAreaState(room: Rooms, state: 'on' | 'off') {
	const areaIds = getAreaIds(room);

	const promises = areaIds.map((areaId) =>
		sendWsMessage({
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

export async function toggleLightState(entityId: string, state: 'on' | 'off') {
	return sendWsMessage({
		type: 'call_service',
		domain: 'light',
		service: `turn_${state}`,
		target: {
			entity_id: entityId
		}
	});
}

export async function changeLightBrightness(entityId: string, brightness: number) {
	return sendWsMessage({
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

export async function changeLightTemperature(entityId: string, temperature: number) {
	return sendWsMessage({
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

export async function changeLightColor(entityId: string, rgb: [number, number, number]) {
	return sendWsMessage({
		type: 'call_service',
		domain: 'light',
		service: 'turn_on',
		target: {
			entity_id: entityId
		},
		service_data: {
			rgb_color: rgb
		}
	});
}

export async function toggleSwitchState(entityId: string, state: 'on' | 'off') {
	return sendWsMessage({
		type: 'call_service',
		domain: 'switch',
		service: `turn_${state}`,
		target: {
			entity_id: entityId
		}
	});
}

export async function activateScene(sceneId: string) {
	return sendWsMessage({
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
		const auth = new Auth({
			hassUrl: PUBLIC_SERVER_URL,
			clientId: PUBLIC_CLIENT_ID,
			expires: Date.now() + 1e11,
			expires_in: 1e11,
			refresh_token: '',
			access_token: PUBLIC_WS_AUTH_KEY
		});
		connection = await createConnection({ auth, setupRetry: -1 });
		return connection;
	} else {
		throw new Error('Cannot create websocket connection on server');
	}
}
