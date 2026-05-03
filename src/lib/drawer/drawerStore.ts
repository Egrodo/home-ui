import { writable } from 'svelte/store';

export interface DrawerTarget {
	entityId: string;
	entityName: string;
	currentRgb: [number, number, number] | null;
	currentBrightness: number;
	currentColorTemp: number | null;
	minColorTemp: number;
	maxColorTemp: number;
}

export const lightDrawerStore = writable<DrawerTarget | null>(null);
