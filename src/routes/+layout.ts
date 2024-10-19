import { fetchDeviceRegistry, handleStateMessage, initWsConnection } from '$lib/data/ws';
import { subscribeEntities } from 'home-assistant-js-websocket';
import type { AppConnections, DeviceInfoLookupTable } from '$lib/data/types';
import { browser } from '$app/environment';

async function initAppConnections(): Promise<AppConnections> {
	// Initialize connection to websocket. Return callback for unsubscribe on unmount
	const wsConnection = await initWsConnection();
	const wsUnsubscribe = subscribeEntities(wsConnection, handleStateMessage);

	// TODO: This doesn't ever update other than on first load
	const deviceRegistry = await fetchDeviceRegistry(wsConnection);
	let deviceLookupTable: DeviceInfoLookupTable = {};
	if (deviceRegistry) {
		deviceLookupTable = deviceRegistry.reduce<DeviceInfoLookupTable>((acc, info) => {
			acc[info.id] = info;
			return acc;
		}, {});
	} else {
		console.error('Device registry nullish?');
	}

	return {
		wsConnection,
		wsUnsubscribe,
		deviceLookupTable
	};
}

export function load() {
	if (browser) {
		return initAppConnections();
	}
}
