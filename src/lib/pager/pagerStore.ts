import { writable } from 'svelte/store';

export const PAGE_COUNT = 2;

/** Index of the page the pager is on (or actively snapping toward). */
export const currentPageStore = writable<number>(0);
