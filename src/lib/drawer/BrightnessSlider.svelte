<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: number = 128; // 0–255

	const dispatch = createEventDispatcher<{ change: number }>();

	let track: HTMLDivElement;
	let capturing = false;

	$: pct = Math.round((value / 255) * 100);

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
		commit(e);
	}

	function onPointerUp(e: PointerEvent) {
		if (!capturing) return;
		capturing = false;
		commit(e);
	}

	function commit(e: PointerEvent) {
		value = Math.round(fromPointer(e) * 255);
		dispatch('change', value);
	}
</script>

<style>
	.wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.label {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
		width: 60px;
	}

	.track {
		flex: 1;
		height: 34px;
		border-radius: var(--radius-pill);
		background: linear-gradient(to right, #1c1c1c 0%, rgba(255, 255, 255, 0.85) 100%);
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

	.pct {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: var(--text-xs);
		opacity: var(--opacity-text-secondary);
		pointer-events: none;
		font-variant-numeric: tabular-nums;
	}
</style>

<div class="wrap">
	<span class="label">Brightness</span>
	<div
		class="track"
		bind:this={track}
		on:pointerdown={onPointerDown}
		on:pointermove={onPointerMove}
		on:pointerup={onPointerUp}
		on:pointercancel={onPointerUp}
		role="slider"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={255}
		tabindex="0"
	>
		<div class="thumb" style:left="{pct}%"></div>
		<span class="pct">{pct}%</span>
	</div>
</div>
