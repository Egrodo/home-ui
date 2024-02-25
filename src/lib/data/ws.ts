import { browser } from '$app/environment';
import { PUBLIC_WS_AUTH_KEY, PUBLIC_SERVER_URL } from '$env/static/public';
import {
	createConnection,
	Connection,
	type MessageBase,
	createLongLivedTokenAuth,
	type HassEntities,
	type HassEntity
} from 'home-assistant-js-websocket';
import { lightStore, sceneStore, switchStore, weatherStore } from './stores';
import {
	Rooms,
	type LightEntity,
	type SceneEntity,
	type SwitchEntity,
	type WeatherEntity
} from './types';

/**
 * NOTE: If you don't want a device to show up in the UI, add the string "donotshow"
 * to its name in Home Assistant and it will be ignored here. Unfortunately there is no
 * other way to pass metadata about a device in HA that I know of.
 */
const DO_NOT_SHOW_STRING = 'donotshow';

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
export function handleStateMessage(states: HassEntities) {
	// console.info(states);
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
			if (
				entity.attributes?.friendly_name == null ||
				entity.attributes.friendly_name.includes(DO_NOT_SHOW_STRING)
			)
				return acc;

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
			} else if (entity_id === 'weather.home') {
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
		const response = await connection.sendMessagePromise(payload);
		return response;
	} catch (err) {
		console.error('Error sending message to websocket: ', err);

		// If errored, reconnect and try again. If it errors again, fuck it.
		await initWsConnection();
		return connection.sendMessagePromise(payload);
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
		const auth = createLongLivedTokenAuth(PUBLIC_SERVER_URL, PUBLIC_WS_AUTH_KEY);
		connection = await createConnection({ auth, setupRetry: -1 });
		return connection;
	} else {
		throw new Error('Cannot create websocket connection on server');
	}
}
