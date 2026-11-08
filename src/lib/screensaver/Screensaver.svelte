<script lang="ts">
	import { onMount } from 'svelte';
	import { createScreensaverController, SHOW_FPS, type Phase } from './controller';
	import { startFpsMeter } from './fps';
	import { animations } from './registry';

	/** Runs as the screensaver comes up, so the UI is already reset when it wakes. */
	export let onActivate: () => void;

	let stage: HTMLDivElement;
	let phase: Phase = 'off';
	let fps: number | null = null;
	let stopFpsMeter: (() => void) | undefined;

	function updateFpsMeter(current: Phase) {
		stopFpsMeter?.();
		stopFpsMeter = undefined;
		fps = null;
		if (SHOW_FPS && current === 'active') {
			stopFpsMeter = startFpsMeter((value) => (fps = value));
		}
	}

	$: updateFpsMeter(phase);

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
			stopFpsMeter?.();
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

	.fps {
		position: absolute;
		top: 16px;
		left: 16px;
		padding: 4px 10px;
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		font-size: 28px;
		font-variant-numeric: tabular-nums;
	}
</style>

<div
	class="screensaver"
	class:screensaver--active={phase === 'active'}
	class:screensaver--waking={phase === 'waking'}
>
	<div class="stage" bind:this={stage}></div>
	{#if fps !== null}
		<div class="fps">{fps.toFixed(1)} fps</div>
	{/if}
</div>
