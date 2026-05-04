<script lang="ts">
	import type { LightEntity, SwitchEntity, SceneEntity } from '$lib/data/types';
	import MdiIcon from '$lib/utils/MdiIcon.svelte';
	import { lightDrawerStore } from '$lib/drawer/drawerStore';
	import { toggleLight, toggleSwitch, activateScene } from '$lib/data/backend';

	export let entity: LightEntity | SwitchEntity | SceneEntity;
	export let icon: string | null = null;

	$: isLight = entity.entity_id.startsWith('light.');
	$: isSwitch = entity.entity_id.startsWith('switch.');
	$: isScene = entity.entity_id.startsWith('scene.');
	$: isOn = entity.state === 'on';

	$: light = isLight ? (entity as LightEntity) : null;
	$: rgb = isOn && light?.attributes.rgb_color ? light.attributes.rgb_color : null;
	$: brightness = light?.attributes.brightness ?? 0;
	$: brightnessPercent = Math.round((brightness / 255) * 100);
	$: colorTempKelvin = light?.attributes.color_temp_kelvin ?? null;
	$: minColorTemp = light?.attributes.min_color_temp_kelvin ?? 2000;
	$: maxColorTemp = light?.attributes.max_color_temp_kelvin ?? 6500;
	$: colorMode = light?.attributes.color_mode;
	$: lightMode = colorMode === 'color_temp' ? 'temp' : 'rgb';

	$: normalizedTemp =
		colorTempKelvin != null
			? Math.max(0, Math.min(1, (colorTempKelvin - minColorTemp) / (maxColorTemp - minColorTemp)))
			: 0;

	function tempColor(t: number): string {
		const warm = [255, 176, 96];
		const neutral = [255, 229, 196];
		const cool = [200, 224, 255];
		const lerp = (a: number, b: number, k: number) => Math.round(a + (b - a) * k);
		const [a, b, k] = t < 0.5 ? [warm, neutral, t * 2] : [neutral, cool, (t - 0.5) * 2];
		return `rgb(${lerp(a[0], b[0], k)}, ${lerp(a[1], b[1], k)}, ${lerp(a[2], b[2], k)})`;
	}

	$: displayHaloColor = isLight
		? rgb
			? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
			: tempColor(normalizedTemp)
		: null;

	$: haloOpacity = isOn ? 0.35 + (brightnessPercent / 100) * (0.85 - 0.35) : 0;

	// Use entity's custom HA icon when defined; fall back to Material Symbols lightbulb
	$: hasCustomIcon = isLight && !!(entity as LightEntity).attributes.icon;

	// ── Tap = toggle, long-press (lights only) = open drawer ────────────────
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let pressStartX = 0;
	let pressStartY = 0;
	let hasMoved = false;

	function handleAction() {
		if (isLight) toggleLight(entity.entity_id, isOn ? 'off' : 'on');
		else if (isSwitch) toggleSwitch(entity.entity_id, isOn ? 'off' : 'on');
		else if (isScene) activateScene(entity.entity_id);
	}

	function onPointerDown(e: PointerEvent) {
		hasMoved = false;
		pressStartX = e.clientX;
		pressStartY = e.clientY;
		if (!isLight) return;
		pressTimer = setTimeout(() => {
			pressTimer = null;
			lightDrawerStore.set({
				entityId: entity.entity_id,
				entityName: entity.attributes.friendly_name,
				currentRgb: rgb as [number, number, number] | null,
				currentBrightness: brightness,
				currentColorTemp: colorTempKelvin,
				minColorTemp,
				maxColorTemp
			});
		}, 500);
	}

	function onPointerMove(e: PointerEvent) {
		const dx = e.clientX - pressStartX;
		const dy = e.clientY - pressStartY;
		if (dx * dx + dy * dy > 100) {
			hasMoved = true;
			if (pressTimer) {
				clearTimeout(pressTimer);
				pressTimer = null;
			}
		}
	}

	function onPointerUp() {
		if (hasMoved) return;
		if (isLight) {
			if (pressTimer) {
				// Short tap — long-press hasn't fired yet, so toggle
				clearTimeout(pressTimer);
				pressTimer = null;
				handleAction();
			}
			// pressTimer already null = long-press fired the drawer — do nothing
		} else {
			handleAction();
		}
	}

	function onPointerCancel() {
		hasMoved = true;
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}
</script>

<style>
	/* ── Base tile ───────────────────────────────────────── */
	.card {
		aspect-ratio: 1;
		padding: 16px;
		border: 1px solid var(--color-border);
		border-radius: var(--tile-radius, var(--radius-md));
		background: var(--color-surface);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background-color 0.3s ease;
	}

	/* ── On state border ──────────────────────────── */
	.card--on {
		border-color: var(--rule-strong);
	}

	/* ── Halo glow ───────────────────────────────────────── */
	.halo {
		position: absolute;
		top: -50px;
		left: -50px;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		pointer-events: none;
		transform-origin: 25% 25%; /* card's top-left corner in halo-local space */
		transition:
			opacity 0.3s ease,
			transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		.halo {
			transition: none;
		}
	}

	/* ── Top row: icon + mode label ──────────────────────── */
	.icon-row {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.bulb-icon {
		font-family: 'Material Symbols Rounded', sans-serif;
		font-size: 34px;
		font-variation-settings:
			'FILL' 0,
			'wght' 400,
			'GRAD' 0,
			'opsz' 24;
		color: var(--ink-3);
		line-height: 1;
		user-select: none;
		transition:
			font-variation-settings 0.2s ease,
			color 0.2s ease;
	}

	.card--on .bulb-icon {
		font-variation-settings:
			'FILL' 1,
			'wght' 400,
			'GRAD' 0,
			'opsz' 24;
		color: var(--ink-1);
	}

	.mode-label {
		font-size: 11px;
		letter-spacing: 0.08em;
		color: var(--ink-2);
	}

	/* ── Light: MDI entity icon (when light has a custom HA icon) */
	.light-icon-wrap {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ink-3);
		opacity: 0.5;
		transition:
			color 0.2s ease,
			opacity 0.2s ease;
	}

	.card--on .light-icon-wrap {
		color: var(--ink-1);
		opacity: 1;
	}

	/* ── Switch / scene: SVG icon ────────────────────────── */
	.icon-wrap {
		position: relative;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
	}

	/* ── Bottom meta ─────────────────────────────────────── */
	.meta {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.name {
		font-size: var(--text-xs);
		font-weight: var(--font-weight-medium);
		color: var(--ink-1);
		line-height: 1.2;
	}

	.sub {
		font-size: 11px;
		letter-spacing: 0.08em;
		color: var(--ink-3);
		text-transform: uppercase;
	}

	/* ── Scene tile ──────────────────────────────────────── */
	.card--scene {
		border-style: dashed;
	}

	/* ── Type badge (scene / switch) ─────────────────────── */
	.type-badge {
		position: absolute;
		top: 16px;
		right: 16px;
		font-size: 9px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-3);
	}
</style>

<div
	class="card"
	class:card--light={isLight}
	class:card--switch={isSwitch}
	class:card--scene={isScene}
	class:card--on={isOn}
	role="button"
	tabindex="0"
	on:keydown={(e) => {
		if (e.key === 'Enter') handleAction();
	}}
	on:pointerdown={onPointerDown}
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:pointercancel={onPointerCancel}
	aria-label="{entity.attributes.friendly_name}{isLight
		? `, ${isOn ? 'on' : 'off'}${isOn ? `, ${brightnessPercent}%` : ''}${isOn && lightMode === 'temp' && colorTempKelvin ? `, ${colorTempKelvin}K` : ''}`
		: ''}"
>
	{#if isLight}
		<!-- Halo glow — decorative, only when on -->
		{#if isLight && displayHaloColor}
			<div
				class="halo"
				aria-hidden="true"
				style:background="radial-gradient(circle, {displayHaloColor} 0%, transparent 70%)"
				style:opacity={haloOpacity}
				style:transform={isOn ? 'scale(1)' : 'scale(0)'}
			></div>
		{/if}

		<!-- Top: icon + mode label -->
		<div class="icon-row">
			{#if hasCustomIcon && icon}
				<div class="light-icon-wrap" aria-hidden="true">
					<MdiIcon name={icon} width="26px" height="26px" />
				</div>
			{:else}
				<span class="bulb-icon" aria-hidden="true">lightbulb</span>
			{/if}
			{#if isOn}
				<span class="mode-label">
					{lightMode === 'rgb' ? 'RGB' : `${colorTempKelvin}K`}
				</span>
			{/if}
		</div>

		<!-- Bottom: name + brightness -->
		<div class="meta">
			<div class="name">{entity.attributes.friendly_name}</div>
			<div class="sub">{isOn ? `${brightnessPercent}%` : 'off'}</div>
		</div>
	{:else}
		<!-- Switch / scene tile -->
		{#if isScene || isSwitch}
			<span class="type-badge">{isScene ? 'Scene' : 'Switch'}</span>
		{/if}

		<div class="icon-wrap">
			{#if icon}
				<MdiIcon name={icon} width="24px" height="24px" />
			{:else}
				<div
					style="width:24px;height:24px;border-radius:50%;border:1.5px dashed currentColor;opacity:0.4"
				></div>
			{/if}
		</div>

		<div class="meta">
			<div class="name">{entity.attributes.friendly_name}</div>
			{#if isSwitch}
				<div class="sub">{isOn ? 'on' : 'off'}</div>
			{/if}
		</div>
	{/if}
</div>
