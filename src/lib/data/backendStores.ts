import { writable } from 'svelte/store';
import type {
	AirQualityReadings,
	CalendarEvent,
	ForecastType,
	LightEntity,
	NoteList,
	SceneEntity,
	SunEntity,
	SwitchEntity,
	TemperatureSample,
	TodoItem,
	WeatherEntity
} from './types';

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

export interface NotesStore {
	[entityId: string]: NoteList;
}
function createNotesStore() {
	const { subscribe, update } = writable<NotesStore>({});

	return {
		subscribe,
		/**
		 * Register the full set of discovered lists (from entity state messages).
		 * Rebuilds the map so deleted lists drop out, while preserving items
		 * already loaded via each list's item subscription.
		 */
		setLists: (lists: { entityId: string; title: string }[]) =>
			update((store: NotesStore) => {
				const next: NotesStore = {};
				for (const { entityId, title } of lists) {
					next[entityId] = { entityId, title, items: store[entityId]?.items ?? [] };
				}
				return next;
			}),
		/** Update one list's items (from its `todo/item/subscribe` stream). */
		setItems: (entityId: string, items: TodoItem[]) =>
			update((store: NotesStore) => {
				const existing = store[entityId];
				if (!existing) return store;
				return { ...store, [entityId]: { ...existing, items } };
			})
	};
}

export const lightStore = createLightStore();
export const switchStore = createSwitchStore();
export const sceneStore = createSceneStore();
export const weatherStore = createWeatherStore();
export const notesStore = createNotesStore();
export const calendarStore = writable<CalendarEvent[]>([]);
export const hourlyForecastStore = writable<ForecastType[]>([]);
export const sunStore = writable<SunEntity | null>(null);
/** Current outdoor temperature reading from sensor.weather_temperature (always °F — sensor's native unit) */
export const outdoorTempStore = writable<number | null>(null);
/** Last ~48h of outdoor temperature samples from sensor.weather_temperature (always °F) */
export const temperatureHistoryStore = writable<TemperatureSample[]>([]);
/** Latest readings from the Airthings air quality monitor */
export const airQualityStore = writable<AirQualityReadings | null>(null);
