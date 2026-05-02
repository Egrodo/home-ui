<script lang="ts">
	import type { Component } from 'svelte';
	import type { LightEntity, SwitchEntity, SceneEntity } from '$lib/data/types';
	import { lightDrawerStore } from '$lib/v2/drawer/drawerStore';

	export let entity: LightEntity | SwitchEntity | SceneEntity;
	export let icon: Component | null = null;

	$: isLight = entity.entity_id.startsWith('light.');
	$: isSwitch = entity.entity_id.startsWith('switch.');
	$: isScene = entity.entity_id.startsWith('scene.');
	$: isOn = entity.state === 'on';

	$: light = isLight ? (entity as LightEntity) : null;
	$: rgb = light?.state === 'on' && light.attributes.rgb_color ? light.attributes.rgb_color : null;
	$: brightness = light?.attributes.brightness ?? 0;
	$: brightnessPercent = Math.round((brightness / 255) * 100);
	$: colorTemp = light?.attributes.color_temp_kelvin ?? null;
	$: minColorTemp = Number(light?.attributes.min_color_temp_kelvin ?? 2000);
	$: maxColorTemp = Number(light?.attributes.max_color_temp_kelvin ?? 6500);

	$: colorStyle = rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : 'currentColor';
	$: cardTint =
		isLight && rgb && isOn
			? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.08)`
			: isSwitch && isOn
				? 'rgba(90, 180, 90, 0.08)'
				: 'transparent';

	// ── Long-press to open light drawer ──────────────────────────────────────
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let pressStartX = 0;
	let pressStartY = 0;

	function onPointerDown(e: PointerEvent) {
		if (!isLight) return;
		pressStartX = e.clientX;
		pressStartY = e.clientY;
		pressTimer = setTimeout(() => {
			pressTimer = null;
			lightDrawerStore.set({
				entityId: entity.entity_id,
				entityName: entity.attributes.friendly_name,
				currentRgb: rgb as [number, number, number] | null,
				currentBrightness: brightness,
				currentColorTemp: colorTemp,
				minColorTemp,
				maxColorTemp
			});
		}, 500);
	}

	function onPointerMove(e: PointerEvent) {
		if (!pressTimer) return;
		const dx = e.clientX - pressStartX;
		const dy = e.clientY - pressStartY;
		if (dx * dx + dy * dy > 100) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	function onPointerUp() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}
</script>

<style>
	.card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 14px 14px 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		cursor: pointer;
		position: relative;
		transition: background-color 0.3s ease;
		gap: 6px;
		min-height: 110px;
	}

	.icon-wrap {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
	}

	.name {
		font-size: var(--text-xs);
		font-weight: var(--font-weight-medium);
		opacity: var(--opacity-text-secondary);
		line-height: 1.2;
		flex: 1;
		align-self: stretch;
	}

	/* Brightness + color bar, pinned to card bottom */
	.bar-track {
		align-self: stretch;
		height: 4px;
		background: color-mix(in srgb, currentColor 12%, transparent);
		border-radius: 0;
		margin: 0 -14px;
		margin-top: auto;
		position: relative;
	}

	.bar-fill {
		height: 100%;
		border-radius: 0;
		transition:
			width 0.4s ease,
			background-color 0.4s ease;
	}

	.type-label {
		position: absolute;
		top: 10px;
		right: 10px;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}

	/* Scene: dashed border style instead of bar */
	.card.scene {
		border-style: dashed;
	}
</style>

<div
	class="card"
	class:scene={isScene}
	style:background-color={cardTint}
	data-entity-type={isLight ? 'light' : isSwitch ? 'switch' : 'scene'}
	on:click
	role="button"
	tabindex="0"
	on:keydown={(e) => e.key === 'Enter' && (e.target as HTMLElement).click()}
	on:pointerdown={onPointerDown}
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:pointercancel={onPointerUp}
>
	{#if isScene || isSwitch}
		<span class="type-label">{isScene ? 'Scene' : 'Switch'}</span>
	{/if}

	<div class="icon-wrap">
		{#if icon}
			<svelte:component this={icon} width="24px" height="24px" />
		{:else}
			<!-- Placeholder circle when icon hasn't loaded -->
			<div
				style="width:24px;height:24px;border-radius:50%;border:1.5px dashed currentColor;opacity:0.4"
			></div>
		{/if}
	</div>

	<span class="name">{entity.attributes.friendly_name}</span>

	{#if isLight}
		<div class="bar-track">
			<div
				class="bar-fill"
				style:width="{isOn ? brightnessPercent : 0}%"
				style:background-color={colorStyle}
			></div>
		</div>
	{/if}
</div>
