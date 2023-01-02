import { writable } from 'svelte/store';
import type { LightEntity, SceneEntity, SwitchEntity, WeatherEntity } from './types';
import type { Connection } from 'home-assistant-js-websocket';

export interface LightStore {
	[key: string]: LightEntity;
}
function createLightStore() {
	const { subscribe, update } = writable<LightStore>({});

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

export interface SwitchStore {
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

export interface SceneStore {
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

// Store for the WS connection object so that it can be accessed from anywhere
function createConnectionStore() {
	const { subscribe, set } = writable<Connection>();

	return {
		subscribe,
		set
	};
}

export const connectionStore = createConnectionStore();

function createRoomIdStore() {
	const { subscribe, set } = writable<Set<string>>();

	return {
		subscribe,
		set
	};
}

export const roomIdStore = createRoomIdStore();
