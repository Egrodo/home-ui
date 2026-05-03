import { initBackend } from '$lib/data/backend';
import { browser } from '$app/environment';

export function load() {
	if (browser) {
		return initBackend();
	}
}
