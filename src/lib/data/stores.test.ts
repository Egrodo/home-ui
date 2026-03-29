import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { lightStore, switchStore, sceneStore, weatherStore, selectedRoomStore, selectedLightIdStore } from './stores';
import { Rooms } from './types';
import type { LightEntity, SwitchEntity, SceneEntity, WeatherEntity } from './types';

function makeLightEntity(id: string, state: 'on' | 'off' = 'on'): LightEntity {
	return {
		entity_id: `light.${id}` as LightEntity['entity_id'],
		state,
		attributes: {
			friendly_name: `Test Light ${id}`,
			min_color_temp_kelvin: '2000',
			max_color_temp_kelvin: '6500',
			supported_color_modes: ['rgb'],
			effect_list: [],
			effect: '',
			brightness: 255,
			rgb_color: [255, 255, 255]
		}
	};
}

function makeSwitchEntity(id: string, state: 'on' | 'off' = 'on'): SwitchEntity {
	return {
		entity_id: `switch.${id}` as SwitchEntity['entity_id'],
		state,
		attributes: { friendly_name: `Test Switch ${id}` }
	};
}

function makeSceneEntity(id: string): SceneEntity {
	return {
		entity_id: `scene.${id}` as SceneEntity['entity_id'],
		state: 'on',
		attributes: {
			entity_id: [],
			friendly_name: `Test Scene ${id}`,
			icon: 'mdi:lightbulb',
			id
		}
	};
}

describe('lightStore', () => {
	it('addOrUpdate inserts new entities', () => {
		lightStore.addOrUpdate([makeLightEntity('a')]);
		const store = get(lightStore);
		expect(store['light.a']).toBeDefined();
		expect(store['light.a'].attributes.friendly_name).toBe('Test Light a');
	});

	it('addOrUpdate overwrites existing entities', () => {
		lightStore.addOrUpdate([makeLightEntity('b', 'on')]);
		lightStore.addOrUpdate([makeLightEntity('b', 'off')]);
		const store = get(lightStore);
		expect(store['light.b'].state).toBe('off');
	});

	it('addOrUpdate preserves other entities', () => {
		lightStore.addOrUpdate([makeLightEntity('c'), makeLightEntity('d')]);
		lightStore.addOrUpdate([makeLightEntity('c', 'off')]);
		const store = get(lightStore);
		expect(store['light.c'].state).toBe('off');
		expect(store['light.d'].state).toBe('on');
	});
});

describe('switchStore', () => {
	it('addOrUpdate merges switch entities', () => {
		switchStore.addOrUpdate([makeSwitchEntity('x'), makeSwitchEntity('y')]);
		const store = get(switchStore);
		expect(Object.keys(store)).toContain('switch.x');
		expect(Object.keys(store)).toContain('switch.y');
	});
});

describe('sceneStore', () => {
	it('addOrUpdate merges scene entities', () => {
		sceneStore.addOrUpdate([makeSceneEntity('relax')]);
		const store = get(sceneStore);
		expect(store['scene.relax']).toBeDefined();
	});
});

describe('weatherStore', () => {
	it('set replaces the weather entity', () => {
		const weather: WeatherEntity = {
			entity_id: 'weather.home' as WeatherEntity['entity_id'],
			state: 'sunny',
			attributes: {
				temperature: 72,
				temperature_unit: '°F',
				humidity: 75,
				forecast: [],
				friendly_name: 'Forecast Home'
			}
		};
		weatherStore.set(weather);
		const store = get(weatherStore);
		expect(store.state).toBe('sunny');
		expect(store.attributes.temperature).toBe(72);
	});
});

describe('UI stores', () => {
	it('selectedRoomStore defaults to AllRooms', () => {
		expect(get(selectedRoomStore)).toBe(Rooms.AllRooms);
	});

	it('selectedRoomStore can be set', () => {
		selectedRoomStore.set(Rooms.Bedroom);
		expect(get(selectedRoomStore)).toBe(Rooms.Bedroom);
		selectedRoomStore.set(Rooms.AllRooms); // reset
	});

	it('selectedLightIdStore defaults to null', () => {
		expect(get(selectedLightIdStore)).toBeNull();
	});

	it('selectedLightIdStore can be set', () => {
		selectedLightIdStore.set('light.test');
		expect(get(selectedLightIdStore)).toBe('light.test');
		selectedLightIdStore.set(null); // reset
	});
});
