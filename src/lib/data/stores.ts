import { writable } from 'svelte/store';
import type { LightEntity, SceneEntity, SwitchEntity, WeatherEntity } from './types';

interface LightStore {
	[key: string]: LightEntity;
}
function createLightStore() {
	const { subscribe, update } = writable<LightStore>({});

	// All network operations having to do with lights will happen here
	// async function toggleLight(lightEntityId: string, newState: 'on' | 'off'): Promise<void> {
	// 	const formBody = { entity_id: lightEntityId };
	// 	const url = `${SERVER_URL}/api/services/homeassistant/turn_${newState}`;
	// 	try {
	// 		await fetch(url, {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json;charset=utf-8',
	// 				Authorization: AUTH_KEY,
	// 				Accept: '*/*',
	// 				'Accept-Encoding': 'gzip, deflate, br',
	// 				Connection: 'keep-alive'
	// 			},
	// 			body: JSON.stringify(formBody)
	// 		});

	// 		// If successful, update local store
	// 		update((lights) => {
	// 			const newLight = lights.find((light) => light.entity_id === lightEntityId);
	// 			if (newLight == null)
	// 				throw new Error('Light that we successfully updated was not found in store?');
	// 			newLight.state = newState;
	// 			return lights;
	// 		});
	// 	} catch (err) {
	// 		// TODO: custom error displaying modal
	// 		console.error(err);
	// 	}
	// }

	return {
		subscribe,
		// Updater function that merges the new state object into the store object, overwriting old with new when relevant keyed by entity_id
		addOrUpdate: (lightEntities: LightEntity[]) =>
			update((lightStore: LightStore) => {
				lightEntities.forEach((light) => {
					lightStore[light.entity_id] = light;
				});
				return lightStore;
			})
		// toggleLight
	};
}

interface SwitchStore {
	[key: string]: SwitchEntity;
}
function createSwitchStore() {
	const { subscribe, update } = writable<SwitchStore>({});

	return {
		subscribe,
		addOrUpdate: (switchEntities: SwitchEntity[]) =>
			update((switchStore: SwitchStore) => {
				switchEntities.forEach((switchEntity) => {
					switchStore[switchEntity.entity_id] = switchEntity;
				});
				return switchStore;
			})
	};
}

interface SceneStore {
	[key: string]: SceneEntity;
}
function createSceneStore() {
	const { subscribe, update } = writable<SceneStore>({});

	return {
		subscribe,
		addOrUpdate: (sceneEntities: SceneEntity[]) =>
			update((sceneStore: SceneStore) => {
				sceneEntities.forEach((sceneEntity) => {
					sceneStore[sceneEntity.entity_id] = sceneEntity;
				});
				return sceneStore;
			})
	};
}

// Weather actually will be handled a little differently, there can only be one weather at a time,
// though maybe in the future I will want to expand support for forecasts
function createWeatherStore() {
	const { subscribe, set } = writable<WeatherEntity>();

	return {
		subscribe,
		set
	};
}

export const lightStore = createLightStore();
export const switchStore = createSwitchStore();
export const sceneStore = createSceneStore();
export const weatherStore = createWeatherStore();
