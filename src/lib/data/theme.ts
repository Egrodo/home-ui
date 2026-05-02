import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'light';

function getInitialTheme(): Theme {
	if (!browser) return DEFAULT_THEME;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return DEFAULT_THEME;
}

function createThemeStore() {
	const { subscribe, set } = writable<Theme>(getInitialTheme());

	return {
		subscribe,
		set(theme: Theme) {
			if (browser) {
				document.documentElement.dataset.theme = theme;
				localStorage.setItem(STORAGE_KEY, theme);
			}
			set(theme);
		},
		toggle() {
			let current: Theme = DEFAULT_THEME;
			subscribe((v) => (current = v))();
			this.set(current === 'dark' ? 'light' : 'dark');
		}
	};
}

export const themeStore = createThemeStore();
