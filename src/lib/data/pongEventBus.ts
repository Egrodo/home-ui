/**
 * A wrapper around home assistant subscribeEvents that can specifically listen for ZHA
 * events coming from identified devices.
 * - Debounce them so only 1 event can come from any given device per 5s
 * - Translate device IDs to their user given names
 * - Filter out events from devices that don't include PONG_PREFIX in their given name
 * - Returns Svelte store that can be used to listen for events after they've passed above conditions
 */

import type { Connection, HassEvent } from 'home-assistant-js-websocket';
import type { DeviceInfoLookupTable, PongEvent } from './types';
import { writable, type Writable } from 'svelte/store';

const EVENT_NAME = 'zha_event';
const PONG_PREFIX = 'pongBtn';
const DEBOUNCE_TIMEOUT = 5 * 1000;

// This should only be called once, on page mount, and its unsub fn should be called onDestroy.
// Handles all the logic for filtering and processing pong events inline. A lot lives inside
// of this function's scope, it will hold memory until the page is unmounted.
export function subscribeToPongEvents(
	wsConnection: Connection,
	deviceRegistry: DeviceInfoLookupTable
): [Writable<PongEvent[]>, Promise<() => void>] {
	const pongEventStore = writable<PongEvent[]>([]);

	const debouncingLog = new Set<string>();

	function pongEventProcessor(event: HassEvent) {
		const deviceId = event.data['device_id'];
		const deviceInfo = deviceRegistry[deviceId];

		if (!deviceInfo) {
			console.log(`No device info for ${deviceId}`);
			return;
		}
		const deviceName = deviceInfo['name_by_user'];
		if (!deviceInfo || !deviceName?.startsWith(PONG_PREFIX)) {
			console.log(
				`Heard event, but it doesn't start with our prefix. Its name is ${deviceInfo['name_by_user']}`
			);
			return;
		}

		if (!debouncingLog.has(deviceName)) {
			debouncingLog.add(deviceName);
			window.setTimeout(() => {
				debouncingLog.delete(deviceName);
			}, DEBOUNCE_TIMEOUT);
		} else {
			console.log(
				`Heard event, but we are currently debouncing an event by the same device`,
				debouncingLog
			);
			return;
		}

		const newPongEvent: PongEvent = {
			deviceName,
			timestamp: event.time_fired
		};

		pongEventStore.update((events) => [...events, newPongEvent]);
	}

	// const unsub = subscribeToEvent(wsConnection, EVENT_NAME, pongEventProcessor);
	const unsub = wsConnection.subscribeEvents(pongEventProcessor, EVENT_NAME);
	return [pongEventStore, unsub];
}
