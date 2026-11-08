<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import rainbowContours from '$lib/screensaver/animations/rainbow-contours';
	import {
		createCandidateSource,
		type Candidate
	} from '$lib/screensaver/animations/rainbow-contours/palette-candidates';
	import { releaseCanvas } from '$lib/screensaver/controller';

	const nextCandidate = createCandidateSource();

	let stage: HTMLElement;
	let candidate: Candidate | null = null;
	let reviewed = 0;
	let kept = 0;
	let stopCurrent: (() => void) | null = null;

	function showNext() {
		stopCurrent?.();
		candidate = nextCandidate();
		reviewed++;

		const canvas = document.createElement('canvas');
		canvas.width = stage.clientWidth;
		canvas.height = stage.clientHeight;
		stage.append(canvas);

		const abort = new AbortController();
		rainbowContours.start(
			{ canvas, width: canvas.width, height: canvas.height, signal: abort.signal },
			candidate.palette
		);
		stopCurrent = () => {
			abort.abort();
			releaseCanvas(canvas);
		};
	}

	/** Prints the palette ready to paste into PALETTES in the animation's config. */
	function keep() {
		if (!candidate) return;
		const { family, palette } = candidate;
		const bands = palette.bands.map((color) => `'${color}'`).join(', ');
		console.log(`{ bands: [${bands}], line: '${palette.line}' }, // ${family}`);
		kept++;
		showNext();
	}

	onMount(showNext);
	onDestroy(() => stopCurrent?.());
</script>

<style>
	.stage {
		position: fixed;
		inset: 0;
		background: #000;
	}

	.stage :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.controls {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.status {
		padding: 8px 16px;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: 24px;
	}

	.buttons {
		display: flex;
		gap: 32px;
	}

	button {
		width: 240px;
		height: 120px;
		border: none;
		border-radius: 24px;
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		font-size: 40px;
		font-weight: 600;
		cursor: pointer;
	}
</style>

<div class="stage" bind:this={stage}></div>

<div class="controls">
	{#if candidate}
		<div class="status">{candidate.family} · {reviewed} seen · {kept} kept</div>
	{/if}
	<div class="buttons">
		<button on:click={showNext}>No</button>
		<button on:click={keep}>Yes</button>
	</div>
</div>
