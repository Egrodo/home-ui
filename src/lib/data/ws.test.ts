import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HassEntities } from 'home-assistant-js-websocket';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$env/static/public', () => ({
	PUBLIC_WS_AUTH_KEY: 'test-key',
	PUBLIC_SERVER_URL: 'http://localhost:8123',
	PUBLIC_WEATHER_ENTITY_ID: 'weather.home'
}));

// Mock stores — use vi.hoisted() so fns are available in the hoisted vi.mock factory
const { mockLightAddOrUpdate, mockSwitchAddOrUpdate, mockSceneAddOrUpdate, mockWeatherSet } =
	vi.hoisted(() => ({
		mockLightAddOrUpdate: vi.fn(),
		mockSwitchAddOrUpdate: vi.fn(),
		mockSceneAddOrUpdate: vi.fn(),
		mockWeatherSet: vi.fn()
	}));

vi.mock('./backendStores', () => ({
	lightStore: { addOrUpdate: mockLightAddOrUpdate, subscribe: vi.fn(() => vi.fn()) },
	switchStore: { addOrUpdate: mockSwitchAddOrUpdate, subscribe: vi.fn(() => vi.fn()) },
	sceneStore: { addOrUpdate: mockSceneAddOrUpdate, subscribe: vi.fn(() => vi.fn()) },
	weatherStore: { set: mockWeatherSet, subscribe: vi.fn(() => vi.fn()) },
	sunStore: { set: vi.fn(), subscribe: vi.fn(() => vi.fn()) },
	hourlyForecastStore: { set: vi.fn(), subscribe: vi.fn(() => vi.fn()) }
}));

import { setHiddenEntityIds, handleStateMessage, ROOM_AREA_IDS } from './ws';
import type { EntityRegistryEntry } from './types';
import { Rooms } from './types';

function makeEntity(
	entity_id: string,
	state: string = 'on',
	friendly_name: string = 'Test Entity'
) {
	return {
		entity_id,
		state,
		attributes: { friendly_name },
		last_changed: '2024-01-01T00:00:00Z',
		last_updated: '2024-01-01T00:00:00Z',
		context: { id: '1', user_id: null, parent_id: null }
	};
}

function makeRegistryEntry(
	overrides: Partial<EntityRegistryEntry> & { entity_id: string }
): EntityRegistryEntry {
	return {
		device_id: null,
		area_id: null,
		hidden_by: null,
		disabled_by: null,
		entity_category: null,
		...overrides
	};
}

describe('setHiddenEntityIds', () => {
	beforeEach(() => {
		// Reset hidden set before each test
		setHiddenEntityIds([]);
	});

	it('filters entities with hidden_by set', () => {
		setHiddenEntityIds([
			makeRegistryEntry({ entity_id: 'light.visible', hidden_by: null }),
			makeRegistryEntry({ entity_id: 'light.hidden', hidden_by: 'user' })
		]);

		const states: HassEntities = {
			'light.visible': makeEntity('light.visible'),
			'light.hidden': makeEntity('light.hidden')
		};

		handleStateMessage(states);

		expect(mockLightAddOrUpdate).toHaveBeenCalledWith(
			expect.arrayContaining([expect.objectContaining({ entity_id: 'light.visible' })])
		);
		expect(mockLightAddOrUpdate).toHaveBeenCalledWith(
			expect.not.arrayContaining([expect.objectContaining({ entity_id: 'light.hidden' })])
		);
	});

	it('filters entities with disabled_by set', () => {
		setHiddenEntityIds([
			makeRegistryEntry({ entity_id: 'switch.disabled', disabled_by: 'integration' })
		]);

		const states: HassEntities = {
			'switch.disabled': makeEntity('switch.disabled')
		};

		mockSwitchAddOrUpdate.mockClear();
		handleStateMessage(states);

		expect(mockSwitchAddOrUpdate).not.toHaveBeenCalled();
	});

	it('filters entities with entity_category set', () => {
		setHiddenEntityIds([
			makeRegistryEntry({ entity_id: 'switch.config', entity_category: 'config' })
		]);

		const states: HassEntities = {
			'switch.config': makeEntity('switch.config')
		};

		mockSwitchAddOrUpdate.mockClear();
		handleStateMessage(states);

		expect(mockSwitchAddOrUpdate).not.toHaveBeenCalled();
	});
});

describe('handleStateMessage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setHiddenEntityIds([]);
	});

	it('routes light entities to lightStore', () => {
		const states: HassEntities = {
			'light.desk': makeEntity('light.desk')
		};

		handleStateMessage(states);

		expect(mockLightAddOrUpdate).toHaveBeenCalledWith([
			expect.objectContaining({ entity_id: 'light.desk' })
		]);
	});

	it('routes switch entities to switchStore', () => {
		const states: HassEntities = {
			'switch.fan': makeEntity('switch.fan')
		};

		handleStateMessage(states);

		expect(mockSwitchAddOrUpdate).toHaveBeenCalledWith([
			expect.objectContaining({ entity_id: 'switch.fan' })
		]);
	});

	it('routes scene entities to sceneStore', () => {
		const states: HassEntities = {
			'scene.cozy': makeEntity('scene.cozy')
		};

		handleStateMessage(states);

		expect(mockSceneAddOrUpdate).toHaveBeenCalledWith([
			expect.objectContaining({ entity_id: 'scene.cozy' })
		]);
	});

	it('routes weather entity to weatherStore', () => {
		const states: HassEntities = {
			'weather.home': makeEntity('weather.home', 'sunny', 'Forecast Home')
		};

		handleStateMessage(states);

		expect(mockWeatherSet).toHaveBeenCalledWith(
			expect.objectContaining({ entity_id: 'weather.home' })
		);
	});

	it('skips unavailable entities', () => {
		const states: HassEntities = {
			'light.offline': makeEntity('light.offline', 'unavailable')
		};

		handleStateMessage(states);

		expect(mockLightAddOrUpdate).not.toHaveBeenCalled();
	});

	it('skips entities with null friendly_name', () => {
		const states: HassEntities = {
			'light.noname': {
				entity_id: 'light.noname',
				state: 'on',
				attributes: {},
				last_changed: '',
				last_updated: '',
				context: { id: '1', parent_id: null, user_id: null }
			}
		};

		handleStateMessage(states);

		expect(mockLightAddOrUpdate).not.toHaveBeenCalled();
	});

	it('ignores unrecognized entity types', () => {
		const states: HassEntities = {
			'automation.test': makeEntity('automation.test')
		};

		handleStateMessage(states);

		expect(mockLightAddOrUpdate).not.toHaveBeenCalled();
		expect(mockSwitchAddOrUpdate).not.toHaveBeenCalled();
		expect(mockSceneAddOrUpdate).not.toHaveBeenCalled();
		expect(mockWeatherSet).not.toHaveBeenCalled();
	});

	it('handles mixed entity types in a single message', () => {
		const states: HassEntities = {
			'light.lamp': makeEntity('light.lamp'),
			'switch.plug': makeEntity('switch.plug'),
			'scene.relax': makeEntity('scene.relax'),
			'weather.home': makeEntity('weather.home', 'cloudy', 'Forecast Home')
		};

		handleStateMessage(states);

		expect(mockLightAddOrUpdate).toHaveBeenCalled();
		expect(mockSwitchAddOrUpdate).toHaveBeenCalled();
		expect(mockSceneAddOrUpdate).toHaveBeenCalled();
		expect(mockWeatherSet).toHaveBeenCalled();
	});
});
