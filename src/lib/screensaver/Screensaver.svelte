<script lang="ts">
	import { onMount } from 'svelte';
	import { createScreensaverController, type Phase } from './controller';
	import { animations } from './registry';

	/** Runs as the screensaver comes up, so the UI is already reset when it wakes. */
	export let onActivate: () => void;

	let stage: HTMLDivElement;
	let phase: Phase = 'off';

	onMount(() => {
		const controller = createScreensaverController({
			animations,
			stage,
			onActivate: () => onActivate(),
			onPhaseChange: (next) => (phase = next)
		});

		// e.g. screensaver('name') from the console, without waiting out the idle timer.
		(window as any).screensaver = controller.activate;

		return () => {
			controller.destroy();
			delete (window as any).screensaver;
		};
	});
</script>

<style>
	.screensaver {
		position: absolute;
		inset: 0;
		/* Above the on-screen keyboard. */
		z-index: 20000;
		background: #000;
		opacity: 0;
		visibility: hidden;
		transition: opacity 250ms;
	}

	.screensaver--active,
	.screensaver--waking {
		visibility: visible;
		/* Keep the browser from turning the waking touch into a scroll. */
		touch-action: none;
		cursor: none;
	}

	.screensaver--active {
		opacity: 1;
		transition: opacity 1s;
	}

	.stage {
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 1s;
	}

	.stage :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>

<div
	class="screensaver"
	class:screensaver--active={phase === 'active'}
	class:screensaver--waking={phase === 'waking'}
>
	<div class="stage" bind:this={stage}></div>
</div>
