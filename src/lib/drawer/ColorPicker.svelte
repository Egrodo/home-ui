<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let initialRgb: [number, number, number] = [255, 160, 60];

	const dispatch = createEventDispatcher<{ change: { rgb: [number, number, number] } }>();

	let svCanvas: HTMLCanvasElement;
	let hueCanvas: HTMLCanvasElement;
	let svCtx: CanvasRenderingContext2D;
	let hueCtx: CanvasRenderingContext2D;

	// HSV state
	let hue = 0;
	let sat = 1;
	let val = 1;

	// Cursor positions as percentages (0–100)
	let svX = 100;
	let svY = 0;
	let hueX = 0;

	let capturingSV = false;
	let capturingHue = false;

	// ── Colour math ──────────────────────────────────────────────────────────

	function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
		const c = v * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = v - c;
		let r = 0,
			g = 0,
			b = 0;
		if (h < 60) {
			r = c;
			g = x;
		} else if (h < 120) {
			r = x;
			g = c;
		} else if (h < 180) {
			g = c;
			b = x;
		} else if (h < 240) {
			g = x;
			b = c;
		} else if (h < 300) {
			r = x;
			b = c;
		} else {
			r = c;
			b = x;
		}
		return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
	}

	function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b),
			min = Math.min(r, g, b),
			d = max - min;
		let h = 0;
		const s = max === 0 ? 0 : d / max;
		const v = max;
		if (d !== 0) {
			if (max === r) h = (((g - b) / d + (g < b ? 6 : 0)) / 6) * 360;
			else if (max === g) h = (((b - r) / d + 2) / 6) * 360;
			else h = (((r - g) / d + 4) / 6) * 360;
		}
		return [h, s, v];
	}

	// ── Canvas drawing ────────────────────────────────────────────────────────

	function drawSV() {
		if (!svCtx) return;
		const w = svCanvas.width,
			h = svCanvas.height;
		svCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
		svCtx.fillRect(0, 0, w, h);

		const wg = svCtx.createLinearGradient(0, 0, w, 0);
		wg.addColorStop(0, 'rgba(255,255,255,1)');
		wg.addColorStop(1, 'rgba(255,255,255,0)');
		svCtx.fillStyle = wg;
		svCtx.fillRect(0, 0, w, h);

		const bg = svCtx.createLinearGradient(0, 0, 0, h);
		bg.addColorStop(0, 'rgba(0,0,0,0)');
		bg.addColorStop(1, 'rgba(0,0,0,1)');
		svCtx.fillStyle = bg;
		svCtx.fillRect(0, 0, w, h);
	}

	function drawHue() {
		if (!hueCtx) return;
		const w = hueCanvas.width,
			h = hueCanvas.height;
		const g = hueCtx.createLinearGradient(0, 0, w, 0);
		for (let i = 0; i <= 12; i++) g.addColorStop(i / 12, `hsl(${(i / 12) * 360}, 100%, 50%)`);
		hueCtx.fillStyle = g;
		hueCtx.fillRect(0, 0, w, h);
	}

	// ── Pointer handling ──────────────────────────────────────────────────────

	function svFromPointer(e: PointerEvent) {
		const rect = svCanvas.getBoundingClientRect();
		const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
		sat = nx;
		val = 1 - ny;
		svX = nx * 100;
		svY = ny * 100;
		emit();
	}

	function hueFromPointer(e: PointerEvent) {
		const rect = hueCanvas.getBoundingClientRect();
		const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		hue = nx * 360;
		hueX = nx * 100;
		drawSV();
		emit();
	}

	function emit() {
		dispatch('change', { rgb: hsvToRgb(hue, sat, val) });
	}

	function onSVDown(e: PointerEvent) {
		capturingSV = true;
		svCanvas.setPointerCapture(e.pointerId);
		svFromPointer(e);
	}
	function onSVMove(e: PointerEvent) {
		if (capturingSV) svFromPointer(e);
	}
	function onSVUp() {
		capturingSV = false;
	}

	function onHueDown(e: PointerEvent) {
		capturingHue = true;
		hueCanvas.setPointerCapture(e.pointerId);
		hueFromPointer(e);
	}
	function onHueMove(e: PointerEvent) {
		if (capturingHue) hueFromPointer(e);
	}
	function onHueUp() {
		capturingHue = false;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(() => {
		svCtx = svCanvas.getContext('2d')!;
		hueCtx = hueCanvas.getContext('2d')!;
		[hue, sat, val] = rgbToHsv(...initialRgb);
		svX = sat * 100;
		svY = (1 - val) * 100;
		hueX = (hue / 360) * 100;
		drawSV();
		drawHue();
	});
</script>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
	}

	.sv-wrap {
		position: relative;
		width: 100%;
		border-radius: 10px;
		overflow: hidden;
		cursor: crosshair;
		touch-action: none;
	}

	canvas {
		display: block;
		width: 100%;
	}

	.sv-cursor {
		position: absolute;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2.5px solid white;
		box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.4);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.hue-wrap {
		position: relative;
		width: 100%;
		border-radius: 6px;
		overflow: hidden;
		cursor: ew-resize;
		touch-action: none;
	}

	.hue-cursor {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 4px;
		border-radius: 2px;
		background: white;
		box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.4);
		transform: translateX(-50%);
		pointer-events: none;
	}
</style>

<div class="picker">
	<div class="sv-wrap">
		<!-- 600×220 internal buffer; CSS scales to full width -->
		<canvas
			bind:this={svCanvas}
			width={600}
			height={220}
			style="height: 220px;"
			on:pointerdown={onSVDown}
			on:pointermove={onSVMove}
			on:pointerup={onSVUp}
			on:pointercancel={onSVUp}
		></canvas>
		<div class="sv-cursor" style:left="{svX}%" style:top="{svY}%"></div>
	</div>

	<div class="hue-wrap">
		<canvas
			bind:this={hueCanvas}
			width={600}
			height={28}
			style="height: 28px;"
			on:pointerdown={onHueDown}
			on:pointermove={onHueMove}
			on:pointerup={onHueUp}
			on:pointercancel={onHueUp}
		></canvas>
		<div class="hue-cursor" style:left="{hueX}%"></div>
	</div>
</div>
