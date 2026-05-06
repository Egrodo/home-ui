<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: number = 4000; // Kelvin
	export let min: number = 2000;
	export let max: number = 6500;

	const dispatch = createEventDispatcher<{ change: number; 'change-end': number }>();

	let track: HTMLDivElement;
	let capturing = false;

	$: pct = ((value - min) / (max - min)) * 100;

	// Normalise pct between 2-98% to avoid thumb being cut off at edges
	$: leftVal = Math.max(2, Math.min(98, pct));

	function fromPointer(e: PointerEvent): number {
		const rect = track.getBoundingClientRect();
		return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
	}

	function onPointerDown(e: PointerEvent) {
		capturing = true;
		track.setPointerCapture(e.pointerId);
		commit(e);
	}

	function onPointerMove(e: PointerEvent) {
		if (!capturing) return;
		commit(e, false);
	}

	function onPointerUp(e: PointerEvent) {
		if (!capturing) return;
		capturing = false;
		commit(e);
		dispatch('change-end', value);
	}

	function commit(e: PointerEvent, dispatchChange = true) {
		const t = fromPointer(e);
		value = Math.round(min + t * (max - min));
		if (dispatchChange) {
			dispatch('change', value);
		}
	}
</script>

<style>
	.wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.label {
		font-size: var(--text-caption);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
		width: 100px;
	}

	.track {
		flex: 1;
		height: 34px;
		border-radius: var(--radius-pill);
		/* warm amber → neutral → cool blue-white */
		background: linear-gradient(
			to right,
			#ff9a3c 0%,
			#ffd27a 20%,
			#fff4e0 40%,
			#ffffff 55%,
			#e8f0ff 70%,
			#c9daff 100%
		);
		border: 1px solid var(--color-border);
		position: relative;
		cursor: pointer;
		touch-action: none;
		user-select: none;
	}

	.thumb {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
		pointer-events: none;
		transition: left 0.05s linear;
	}

	.kelvin {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: var(--text-caption);
		opacity: var(--opacity-text-secondary);
		pointer-events: none;
		font-variant-numeric: tabular-nums;
	}
</style>

<div class="wrap">
	<span class="label">White temp</span>
	<div
		class="track"
		bind:this={track}
		on:pointerdown={onPointerDown}
		on:pointermove={onPointerMove}
		on:pointerup={onPointerUp}
		on:pointercancel={onPointerUp}
		role="slider"
		aria-valuenow={value}
		aria-valuemin={min}
		aria-valuemax={max}
		tabindex="0"
	>
		<div class="thumb" style:left="{leftVal}%"></div>
		<span class="kelvin">{value}K</span>
	</div>
</div>
