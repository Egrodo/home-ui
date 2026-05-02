<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { lightDrawerStore, type DrawerTarget } from './drawerStore';
	import { getColorHistory, addColorToHistory } from './colorHistory';
	import { DRAWER_MAX_HEIGHT } from '$lib/v2/constants';
	import { changeBrightness, changeColor, changeTemperature } from '$lib/data/backend';
	import ColorPicker from './ColorPicker.svelte';
	import BrightnessSlider from './BrightnessSlider.svelte';
	import ColorTempSlider from './ColorTempSlider.svelte';

	// `target` tracks the store value; `displayTarget` holds the last non-null
	// value so content stays mounted during the close animation.
	let target: DrawerTarget | null = null;
	let displayTarget: DrawerTarget | null = null;
	let open = false;

	lightDrawerStore.subscribe((v) => {
		target = v;
		if (v) {
			displayTarget = v;
			loadHistory(v.entityId);
			// Double rAF: first frame mounts content at translateY(100%),
			// second frame triggers the transition to translateY(0).
			requestAnimationFrame(() => requestAnimationFrame(() => (open = true)));
		} else {
			open = false;
			// displayTarget stays non-null until transitionend keeps content during slide-out
		}
	});

	// ── Click-outside to dismiss ──────────────────────────────────────────────

	let drawerEl: HTMLDivElement | undefined;

	function handleDocPointerDown(e: PointerEvent) {
		if (!target || !drawerEl) return;
		const path = e.composedPath() as Element[];
		const inDrawer = path.some((el) => el === drawerEl);
		const inLightCard = path.some(
			(el) => el instanceof HTMLElement && el.dataset.entityType === 'light'
		);
		if (!inDrawer && !inLightCard) close();
	}

	onMount(() => {
		document.addEventListener('pointerdown', handleDocPointerDown, { capture: true });
	});

	onDestroy(() => {
		document.removeEventListener('pointerdown', handleDocPointerDown, { capture: true });
	});

	let colorHistory: [number, number, number][] = [];

	function loadHistory(entityId: string) {
		colorHistory = getColorHistory(entityId);
	}

	function close() {
		lightDrawerStore.set(null);
	}

	function onBrightnessChange(e: CustomEvent<number>) {
		if (!target) return;
		changeBrightness(target.entityId, e.detail);
	}

	function onColorChange(e: CustomEvent<{ rgb: [number, number, number] }>) {
		if (!target) return;
		changeColor(target.entityId, e.detail.rgb);
	}

	function onColorTempChange(e: CustomEvent<number>) {
		if (!target) return;
		changeTemperature(target.entityId, e.detail);
	}

	function onColorChangeEnd(e: CustomEvent<{ rgb: [number, number, number] }>) {
		if (!target) return;
		colorHistory = addColorToHistory(target.entityId, e.detail.rgb);
	}

	function pickHistoryColor(rgb: [number, number, number]) {
		if (!target) return;
		changeColor(target.entityId, rgb);
		colorHistory = addColorToHistory(target.entityId, rgb);
	}

	// ── Drag-to-dismiss ───────────────────────────────────────────────────────

	let handleEl: HTMLDivElement;
	let dragStartY = 0;
	let dragOffset = 0;
	let isDragging = false;

	function onHandlePointerDown(e: PointerEvent) {
		e.preventDefault();
		isDragging = true;
		dragStartY = e.clientY;
		dragOffset = 0;
		// Capture on the handle element so move/up route here even as finger leaves
		handleEl.setPointerCapture(e.pointerId);
	}

	function onHandlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		dragOffset = Math.max(0, e.clientY - dragStartY);
	}

	function onHandlePointerUp() {
		if (!isDragging) return;
		isDragging = false;
		if (dragOffset > 100) {
			close();
		}
		dragOffset = 0;
	}

	$: translateY = isDragging ? `${dragOffset}px` : open ? '0' : '100%';
	$: transition = isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)';

	function onTransitionEnd() {
		if (!open) displayTarget = null;
	}
</script>

<style>
	.drawer {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-surface-2, var(--page-background, #111));
		border-top: 1px solid var(--color-border);
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		padding: 0 32px 28px;
		z-index: 10;
		/* Height governed by content; max-height set to cover stock section only */
overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* ── Drag handle ── */
	.handle-area {
		display: flex;
		justify-content: center;
		padding: 14px 0 4px;
		cursor: grab;
		touch-action: none;
		flex-shrink: 0;
	}

	.handle-bar {
		width: 48px;
		height: 4px;
		border-radius: 2px;
		background: color-mix(in srgb, currentColor 25%, transparent);
	}

	/* ── Header row ── */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.entity-name {
		font-size: var(--text-base);
		font-weight: var(--font-weight-semibold);
		opacity: var(--opacity-text-primary);
	}

	/* ── Recent colors ── */
	.recent-row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.recent-label {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
		width: 60px;
	}

	.color-swatches {
		display: flex;
		gap: 8px;
	}

	.swatch {
		width: 28px;
		height: 28px;
		border-radius: var(--radius-pill);
		cursor: pointer;
		border: 2px solid var(--color-border);
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.swatch:hover {
		transform: scale(1.15);
	}

	.swatch-empty {
		width: 28px;
		height: 28px;
		border-radius: var(--radius-pill);
		border: 1.5px dashed var(--color-border);
		flex-shrink: 0;
	}
</style>

<div
	bind:this={drawerEl}
	class="drawer"
	style:transform="translateY({translateY})"
	style:transition
	style:max-height="{DRAWER_MAX_HEIGHT}px"
	on:transitionend={onTransitionEnd}
>
	<!-- Drag handle -->
	<div
		bind:this={handleEl}
		class="handle-area"
		on:pointerdown={onHandlePointerDown}
		on:pointermove={onHandlePointerMove}
		on:pointerup={onHandlePointerUp}
		on:pointercancel={onHandlePointerUp}
		role="presentation"
	>
		<div class="handle-bar"></div>
	</div>

	{#if displayTarget}
		<!-- Header -->
		<div class="header">
			<span class="entity-name">{displayTarget.entityName}</span>
		</div>

		<!-- Recent colors -->
		<div class="recent-row">
			<span class="recent-label">Recent</span>
			<div class="color-swatches">
				{#each colorHistory as rgb (rgb.join(','))}
					<button
						class="swatch"
						style:background-color="rgb({rgb[0]}, {rgb[1]}, {rgb[2]})"
						on:click={() => pickHistoryColor(rgb)}
						aria-label="Pick colour rgb({rgb[0]}, {rgb[1]}, {rgb[2]})"
					></button>
				{/each}
				{#each Array(Math.max(0, 8 - colorHistory.length)) as _}
					<div class="swatch-empty"></div>
				{/each}
			</div>
		</div>

		<!-- Brightness -->
		<BrightnessSlider value={displayTarget.currentBrightness} on:change={onBrightnessChange} />

		<!-- White temperature -->
		<ColorTempSlider
			value={displayTarget.currentColorTemp ?? 4000}
			min={displayTarget.minColorTemp}
			max={displayTarget.maxColorTemp}
			on:change={onColorTempChange}
		/>

		<!-- Color picker — remount when entity changes so HSV state resets -->
		{#key displayTarget.entityId}
			<ColorPicker
				initialRgb={displayTarget.currentRgb ?? [255, 160, 60]}
				on:change={onColorChange}
				on:change={onColorChangeEnd}
			/>
		{/key}
	{/if}
</div>
