/** What the host hands an animation each time it starts. */
export interface ScreensaverContext {
	/** Mounted, sized, and with no context claimed — the animation picks 2d, webgl, etc. */
	canvas: HTMLCanvasElement;
	width: number;
	height: number;
	/** Aborts on teardown. Pass to loop(), fetches, and listeners. */
	signal: AbortSignal;
}

export type Cleanup = () => void;

/**
 * The default export of every file in ./animations. An animation is named after its
 * file or folder (animations/foo.ts or animations/foo/index.ts); adding or deleting
 * one is all it takes to add or remove it from rotation.
 *
 * Cleanup runs as the fade out begins, so it must leave the last frame on the canvas.
 * The host releases the canvas and its context afterwards.
 */
export interface Screensaver {
	start(ctx: ScreensaverContext): void | Cleanup | Promise<void | Cleanup>;
}

export type ScreensaverLoader = () => Promise<Screensaver>;
