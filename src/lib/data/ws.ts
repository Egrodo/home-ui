import { PUBLIC_WS_AUTH_KEY, PUBLIC_SERVER_URL } from '$env/static/public';
import { createConnection, subscribeEntities, Auth } from 'home-assistant-js-websocket';
import { lightStore, sceneStore, switchStore, weatherStore } from './stores';
import type { Entity, LightEntity, SceneEntity, SwitchEntity, WeatherEntity } from './types';

interface WsStateMessage {
	[entityId: string]: Entity;
}

// The idea here is that if I keep track of when the last time a specific entity updated, I
// can avoid updating the state (and thus causing a re-render) if the state hasn't changed.
// I know this is probably an overoptimization & that Svelte might be smart enough to not
// re-render unecessarily anyways,
const entityToLastChangedDate = new Map<string, Date>();

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
function handleStateMessage(states: WsStateMessage) {
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
				const lastChangedDate = entityToLastChangedDate.get(entity_id);
				if (lastChangedDate && lastChangedDate < new Date(lightEntity.last_changed)) {
					entityToLastChangedDate.set(entity_id, new Date(lightEntity.last_changed));
					lights.push(lightEntity);
				} else if (!lastChangedDate) {
					entityToLastChangedDate.set(entity_id, new Date(lightEntity.last_changed));
					lights.push(lightEntity);
				}
			} else if (entity_id.startsWith('switch.')) {
				const switchEntity = entity as SwitchEntity;
				const lastChangedDate = entityToLastChangedDate.get(entity_id);
				if (lastChangedDate && lastChangedDate < new Date(switchEntity.last_changed)) {
					entityToLastChangedDate.set(entity_id, new Date(switchEntity.last_changed));
					switches.push(switchEntity);
				} else if (!lastChangedDate) {
					entityToLastChangedDate.set(entity_id, new Date(switchEntity.last_changed));
					switches.push(switchEntity);
				}
			} else if (entity_id.startsWith('scene.')) {
				const sceneEntity = entity as SceneEntity;
				const lastChangedDate = entityToLastChangedDate.get(entity_id);
				if (lastChangedDate && lastChangedDate < new Date(entity.last_changed)) {
					entityToLastChangedDate.set(entity_id, new Date(sceneEntity.last_changed));
					scenes.push(sceneEntity);
				} else if (!lastChangedDate) {
					entityToLastChangedDate.set(entity_id, new Date(sceneEntity.last_changed));
					scenes.push(sceneEntity);
				}
			} else if (entity_id === 'weather.home') {
				// Unlike the other entity types, we only care about one specific weather entity
				const weatherEntity = entity as WeatherEntity;
				const lastChangedDate = entityToLastChangedDate.get(entity_id);
				if (lastChangedDate && lastChangedDate < new Date(weatherEntity.last_changed)) {
					entityToLastChangedDate.set(entity_id, new Date(weatherEntity.last_changed));
					newWeather = weatherEntity;
				} else if (!lastChangedDate) {
					entityToLastChangedDate.set(entity_id, new Date(weatherEntity.last_changed));
					newWeather = weatherEntity;
				}
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

export async function connect() {
	let auth;
	try {
		auth = new Auth({
			hassUrl: PUBLIC_SERVER_URL,
			clientId: location.host,
			expires: Date.now() + 1e11,
			expires_in: 1e11,
			refresh_token: '',
			access_token: PUBLIC_WS_AUTH_KEY
		});
		const connection = await createConnection({ auth, setupRetry: -1 });
		const unsubscribe = subscribeEntities<WsStateMessage>(connection, handleStateMessage);
		return unsubscribe;
	} catch (err) {
		console.error(err);
	}
}
