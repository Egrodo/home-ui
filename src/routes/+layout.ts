import {
	fetchDeviceRegistry,
	fetchEntityRegistry,
	handleStateMessage,
	initWsConnection,
	setHiddenEntityIds
} from '$lib/data/ws';
import { subscribeEntities } from 'home-assistant-js-websocket';
import type { AppConnections, DeviceInfoLookupTable, EntityAreaMap } from '$lib/data/types';
import { browser } from '$app/environment';

async function initAppConnections(): Promise<AppConnections> {
	const wsConnection = await initWsConnection();

	const [deviceRegistry, entityRegistry] = await Promise.all([
		fetchDeviceRegistry(wsConnection),
		fetchEntityRegistry(wsConnection)
	]);

	let deviceLookupTable: DeviceInfoLookupTable = {};
	if (deviceRegistry) {
		deviceLookupTable = deviceRegistry.reduce<DeviceInfoLookupTable>((acc, info) => {
			acc[info.id] = info;
			return acc;
		}, {});
	} else {
		console.error('Device registry nullish?');
	}

	setHiddenEntityIds(entityRegistry);

	// Subscribe AFTER hidden set is populated so the first state message is filtered correctly
	const wsUnsubscribe = subscribeEntities(wsConnection, handleStateMessage);

	// Build entity_id → area_id map. Entity-level area_id takes precedence over device area_id.
	const entityAreaMap = entityRegistry.reduce<EntityAreaMap>((acc, entry) => {
		acc[entry.entity_id] =
			entry.area_id ??
			(entry.device_id ? (deviceLookupTable[entry.device_id]?.area_id ?? null) : null);
		return acc;
	}, {});

	return {
		wsConnection,
		wsUnsubscribe,
		deviceLookupTable,
		entityAreaMap
	};
}

export function load() {
	if (browser) {
		return initAppConnections();
	}
}
