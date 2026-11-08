import type { Screensaver, ScreensaverLoader } from './types';

// Lazy, so an animation's code (and any heavy library) only loads when it's picked.
const modules = import.meta.glob<{ default: Screensaver }>([
	'./animations/*.ts',
	'./animations/*/index.ts',
	'!./animations/*.test.ts'
]);

const nameFromPath = (path: string) => path.split('/')[2].replace(/\.ts$/, '');

export const animations: Record<string, ScreensaverLoader> = Object.fromEntries(
	Object.entries(modules).map(([path, load]) => [
		nameFromPath(path),
		async () => (await load()).default
	])
);
