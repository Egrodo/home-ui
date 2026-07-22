import { error, json } from '@sveltejs/kit';
import { PUBLIC_SERVER_URL, PUBLIC_WS_AUTH_KEY } from '$env/static/public';
import type { RequestHandler } from './$types';

/**
 * Proxy for removing a Home Assistant config entry (i.e. deleting a to-do list).
 *
 * HA exposes config-entry removal only over REST, and its REST API doesn't send
 * CORS headers — so the browser can't call it directly. We forward the DELETE
 * from our own server (same-origin to the browser, no CORS server-to-HA).
 */
export const DELETE: RequestHandler = async ({ url }) => {
	const configEntryId = url.searchParams.get('config_entry_id');
	if (!configEntryId) throw error(400, 'Missing config_entry_id');

	const res = await fetch(
		`${PUBLIC_SERVER_URL}/api/config/config_entries/entry/${configEntryId}`,
		{
			method: 'DELETE',
			headers: { Authorization: `Bearer ${PUBLIC_WS_AUTH_KEY}` }
		}
	);

	if (!res.ok) throw error(res.status, `Home Assistant responded ${res.status}`);
	return json(await res.json());
};
