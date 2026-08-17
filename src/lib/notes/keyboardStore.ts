import { writable } from 'svelte/store';

/**
 * Height of the docked on-screen keyboard, or 0 when it isn't shown.
 * Chrome anchored to the bottom of the screen (the pager dots) reads this to lift
 * itself clear. Set by OnScreenKeyboard's own mount/destroy so it can never drift
 * out of sync with whether the dock is actually on screen.
 */
export const keyboardDockHeight = writable<number>(0);
