import { browser } from '$app/environment';
import { PUBLIC_WS_AUTH_KEY, PUBLIC_CLIENT_ID, PUBLIC_SERVER_URL } from '$env/static/public';
import { createConnection, Auth } from 'home-assistant-js-websocket';
import { lightStore, sceneStore, switchStore, weatherStore } from './stores';
import type { Entity, LightEntity, SceneEntity, SwitchEntity, WeatherEntity } from './types';

export interface WsStateMessage {
	[entityId: string]: Entity;
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
	console.log(lightEntities);

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
		return createConnection({ auth, setupRetry: -1 });
	} else {
		throw new Error('Cannot create websocket connection on server');
	}
}
