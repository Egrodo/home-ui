import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$env/static/public', () => ({
	PUBLIC_WS_AUTH_KEY: 'test-key',
	PUBLIC_SERVER_URL: 'http://localhost:8123',
	PUBLIC_WEATHER_ENTITY_ID: 'weather.home',
	PUBLIC_CALENDAR_ENTITY_ID: 'calendar.test'
}));

// Hoist mock functions for ws.ts
const {
	mockInitWsConnection,
	mockFetchDeviceRegistry,
	mockFetchEntityRegistry,
	mockSetHiddenEntityIds,
	mockToggleLightState,
	mockToggleSwitchState,
	mockActivateScene,
	mockToggleAreaState,
	mockChangeLightBrightness,
	mockChangeLightColor,
	mockChangeLightTemperature,
	mockChangeLightEffect
} = vi.hoisted(() => ({
	mockInitWsConnection: vi.fn(),
	mockFetchDeviceRegistry: vi.fn(),
	mockFetchEntityRegistry: vi.fn(),
	mockSetHiddenEntityIds: vi.fn(),
	mockToggleLightState: vi.fn(),
	mockToggleSwitchState: vi.fn(),
	mockActivateScene: vi.fn(),
	mockToggleAreaState: vi.fn(),
	mockChangeLightBrightness: vi.fn(),
	mockChangeLightColor: vi.fn(),
	mockChangeLightTemperature: vi.fn(),
	mockChangeLightEffect: vi.fn()
}));

const { mockSubscribeEntities } = vi.hoisted(() => ({
	mockSubscribeEntities: vi.fn(() => vi.fn())
}));

vi.mock('./ws', () => ({
	initWsConnection: mockInitWsConnection,
	fetchDeviceRegistry: mockFetchDeviceRegistry,
	fetchEntityRegistry: mockFetchEntityRegistry,
	setHiddenEntityIds: mockSetHiddenEntityIds,
	handleStateMessage: vi.fn(),
	fetchWeatherForecast: vi.fn().mockResolvedValue([]),
	fetchHourlyForecast: vi.fn().mockResolvedValue([]),
	fetchCalendarEvents: vi.fn().mockResolvedValue([]),
	toggleLightState: mockToggleLightState,
	toggleSwitchState: mockToggleSwitchState,
	activateScene: mockActivateScene,
	toggleAreaState: mockToggleAreaState,
	changeLightBrightness: mockChangeLightBrightness,
	changeLightColor: mockChangeLightColor,
	changeLightTemperature: mockChangeLightTemperature,
	changeLightEffect: mockChangeLightEffect
}));

vi.mock('home-assistant-js-websocket', () => ({
	subscribeEntities: mockSubscribeEntities
}));

import {
	initBackend,
	destroyBackend,
	toggleLight,
	toggleSwitch,
	activateScene,
	toggleArea,
	changeBrightness,
	changeColor,
	changeTemperature,
	changeEffect,
	entityAreaMapStore,
	isConnectedStore
} from './backend';
import { Rooms } from './types';

const mockConnection = { connected: true, sendMessagePromise: vi.fn() };

beforeEach(() => {
	vi.clearAllMocks();
	destroyBackend();

	mockInitWsConnection.mockResolvedValue(mockConnection);
	mockFetchDeviceRegistry.mockResolvedValue([
		{ id: 'device1', area_id: 'living_room', name: 'Device 1', name_by_user: '', model: null, manufacturer: null }
	]);
	mockFetchEntityRegistry.mockResolvedValue([
		{ entity_id: 'light.lamp', device_id: 'device1', area_id: null, hidden_by: null, disabled_by: null, entity_category: null },
		{ entity_id: 'light.custom_area', device_id: null, area_id: 'bedroom', hidden_by: null, disabled_by: null, entity_category: null }
	]);
});

describe('initBackend', () => {
	it('initializes connection and fetches registries', async () => {
		await initBackend();

		expect(mockInitWsConnection).toHaveBeenCalled();
		expect(mockFetchDeviceRegistry).toHaveBeenCalledWith(mockConnection);
		expect(mockFetchEntityRegistry).toHaveBeenCalledWith(mockConnection);
	});

	it('calls setHiddenEntityIds before subscribing to entities', async () => {
		const callOrder: string[] = [];
		mockSetHiddenEntityIds.mockImplementation(() => callOrder.push('setHidden'));
		mockSubscribeEntities.mockImplementation(() => {
			callOrder.push('subscribe');
			return vi.fn();
		});

		await initBackend();

		expect(callOrder).toEqual(['setHidden', 'subscribe']);
	});

	it('builds entityAreaMap with entity area taking precedence over device area', async () => {
		await initBackend();

		const map = get(entityAreaMapStore);
		// light.lamp has no entity area_id, falls back to device1's area_id
		expect(map['light.lamp']).toBe('living_room');
		// light.custom_area has its own area_id
		expect(map['light.custom_area']).toBe('bedroom');
	});

	it('sets isConnectedStore to true', async () => {
		await initBackend();
		expect(get(isConnectedStore)).toBe(true);
	});
});

describe('destroyBackend', () => {
	it('sets isConnectedStore to false', async () => {
		await initBackend();
		destroyBackend();
		expect(get(isConnectedStore)).toBe(false);
	});

	it('calls unsubscribe', async () => {
		const mockUnsub = vi.fn();
		mockSubscribeEntities.mockReturnValue(mockUnsub);

		await initBackend();
		destroyBackend();

		expect(mockUnsub).toHaveBeenCalled();
	});
});

describe('service call wrappers', () => {
	it('throws if backend not initialized', () => {
		expect(() => toggleLight('light.test', 'on')).toThrow('Backend not initialized');
	});

	it('toggleLight delegates to toggleLightState', async () => {
		await initBackend();
		toggleLight('light.lamp', 'off');
		expect(mockToggleLightState).toHaveBeenCalledWith(mockConnection, 'light.lamp', 'off');
	});

	it('toggleSwitch delegates to toggleSwitchState', async () => {
		await initBackend();
		toggleSwitch('switch.fan', 'on');
		expect(mockToggleSwitchState).toHaveBeenCalledWith(mockConnection, 'switch.fan', 'on');
	});

	it('activateScene delegates to activateScene', async () => {
		await initBackend();
		activateScene('scene.relax');
		expect(mockActivateScene).toHaveBeenCalledWith(mockConnection, 'scene.relax');
	});

	it('toggleArea delegates to toggleAreaState', async () => {
		await initBackend();
		toggleArea(Rooms.LivingRoom, 'off');
		expect(mockToggleAreaState).toHaveBeenCalledWith(mockConnection, Rooms.LivingRoom, 'off');
	});

	it('changeBrightness delegates to changeLightBrightness', async () => {
		await initBackend();
		changeBrightness('light.lamp', 128);
		expect(mockChangeLightBrightness).toHaveBeenCalledWith(mockConnection, 'light.lamp', 128);
	});

	it('changeColor delegates to changeLightColor', async () => {
		await initBackend();
		changeColor('light.lamp', [255, 0, 0]);
		expect(mockChangeLightColor).toHaveBeenCalledWith(mockConnection, 'light.lamp', [255, 0, 0]);
	});

	it('changeTemperature delegates to changeLightTemperature', async () => {
		await initBackend();
		changeTemperature('light.lamp', 4000);
		expect(mockChangeLightTemperature).toHaveBeenCalledWith(mockConnection, 'light.lamp', 4000);
	});

	it('changeEffect delegates to changeLightEffect', async () => {
		await initBackend();
		changeEffect('light.lamp', 'rainbow');
		expect(mockChangeLightEffect).toHaveBeenCalledWith(mockConnection, 'light.lamp', 'rainbow');
	});
});
