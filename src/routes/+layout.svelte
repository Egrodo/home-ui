<script lang="ts">
	import { connectionStore, deviceRegistryStore } from '$lib/data/stores';
	import { fetchDeviceRegistry, handleStateMessage, initWsConnection } from '$lib/data/ws';
	import { subscribeEntities } from 'home-assistant-js-websocket';
	import { onMount } from 'svelte';
	import type { DeviceInfoLookupTable } from '$lib/data/types';

	async function initAppConnections() {
		// Initialize connection to websocket. Return callback for unsubscribe on unmount
		const connection = await initWsConnection();
		connectionStore.set(connection);
		const unsubscribeStateMsg = subscribeEntities(connection, handleStateMessage);

		const deviceRegistry = await fetchDeviceRegistry();

		if (deviceRegistry) {
			const deviceLookupTable = deviceRegistry.reduce<DeviceInfoLookupTable>((acc, info) => {
				acc[info.id] = info;
				return acc;
			}, {});
			deviceRegistryStore.set(deviceLookupTable);
		} else {
			console.error('Device registry nullish?');
		}

		return unsubscribeStateMsg;
	}

	// TODO: Is it best to re-connect this on every page mount? Could a better system do this
	// once per app; do I need any changes in my Svelte configuration to make this a SPA?
	onMount(() => {
		void initAppConnections();
	});
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');

	:global(*) {
		font-family: 'Open Sans', sans-serif;
		box-sizing: border-box;
		user-select: none;
	}

	:global(body) {
		/* Page size globals */
		--page-background: #0c0d16;
		--page-height: 768px;
		--page-width: 1360px;
		--page-drawer-background: #1f212e;

		/* Block globals */
		--block-border-radius: 32px;
		--block-padding: 38px;
		--block-default-light-color: #fff7dc;
		--block-default-dark-color: #1f212e;

		height: var(--page-height);
		width: var(--page-width);
		margin: 0;
	}

	:global(body::-webkit-scrollbar) {
		display: none;
	}
</style>

<slot />
