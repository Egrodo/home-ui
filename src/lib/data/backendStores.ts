import { writable } from 'svelte/store';
import type { CalendarEvent, ForecastType, LightEntity, SceneEntity, SunEntity, SwitchEntity, TemperatureSample, WeatherEntity } from './types';

export interface LightStore {
	[lightId: string]: LightEntity;
}
function createLightStore() {
	const { subscribe, update } = writable<LightStore>({});

	return {
		subscribe,
		addOrUpdate: (lightEntities: LightEntity[]) =>
			update((lightStore: LightStore) => {
				lightEntities.forEach((light) => {
					lightStore[light.entity_id] = light;
				});
				return lightStore;
			})
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

function createWeatherStore() {
	const { subscribe, set, update } = writable<WeatherEntity>();

	return {
		subscribe,
		set,
		patchForecast: (forecast: ForecastType[]) =>
			update((w) => (w ? { ...w, attributes: { ...w.attributes, forecast } } : w))
	};
}

export const lightStore = createLightStore();
export const switchStore = createSwitchStore();
export const sceneStore = createSceneStore();
export const weatherStore = createWeatherStore();
export const calendarStore = writable<CalendarEvent[]>([]);
export const hourlyForecastStore = writable<ForecastType[]>([]);
export const sunStore = writable<SunEntity | null>(null);
/** Current outdoor temperature reading from sensor.weather_temperature (always °F — sensor's native unit) */
export const outdoorTempStore = writable<number | null>(null);
/** Last ~48h of outdoor temperature samples from sensor.weather_temperature (always °F) */
export const temperatureHistoryStore = writable<TemperatureSample[]>([]);
