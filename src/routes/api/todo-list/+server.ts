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

	const res = await fetch(`${PUBLIC_SERVER_URL}/api/config/config_entries/entry/${configEntryId}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${PUBLIC_WS_AUTH_KEY}` }
	});

	if (!res.ok) throw error(res.status, `Home Assistant responded ${res.status}`);
	return json(await res.json());
};

/**
 * Proxy for creating a to-do list, i.e. adding a `local_todo` config entry.
 *
 * Like removal, config-entry creation runs through HA's REST config-flow API,
 * which sends no CORS headers — so we forward it from our own server. The flow
 * is two steps: start it for the `local_todo` handler, then submit the list name
 * to its single form step, which finishes the flow and creates the entry.
 */
export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json().catch(() => ({}));
	if (typeof name !== 'string' || !name.trim()) throw error(400, 'Missing list name');

	const headers = {
		Authorization: `Bearer ${PUBLIC_WS_AUTH_KEY}`,
		'Content-Type': 'application/json'
	};

	// Step 1: open the config flow for the local to-do integration.
	const startRes = await fetch(`${PUBLIC_SERVER_URL}/api/config/config_entries/flow`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ handler: 'local_todo' })
	});
	if (!startRes.ok) throw error(startRes.status, `Home Assistant responded ${startRes.status}`);
	const flow = await startRes.json();
	if (!flow?.flow_id) throw error(502, 'Home Assistant did not return a flow_id');

	// Step 2: submit the list name to the flow's form step, creating the entry.
	const finishRes = await fetch(
		`${PUBLIC_SERVER_URL}/api/config/config_entries/flow/${flow.flow_id}`,
		{
			method: 'POST',
			headers,
			body: JSON.stringify({ todo_list_name: name.trim() })
		}
	);
	if (!finishRes.ok) throw error(finishRes.status, `Home Assistant responded ${finishRes.status}`);
	return json(await finishRes.json());
};
