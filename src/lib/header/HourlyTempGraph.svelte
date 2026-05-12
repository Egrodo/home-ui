<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		hourlyForecastStore,
		outdoorTempStore,
		sunStore,
		temperatureHistoryStore,
		weatherStore
	} from '../data/backendStores';
	import { showFahrenheitStore } from '../data/stores';
	import { displayTemp } from '../utils/temperature';

	/** Convert a temperature in °F (sensor's native unit) to the unit the rest of the graph uses. */
	function fahrenheitTo(tempF: number, targetUnit: string): number {
		return targetUnit === '°C' ? ((tempF - 32) * 5) / 9 : tempF;
	}

	const PAD_LEFT = 30; // Y-label column
	const PAD_RIGHT = 8;
	// TODO (human): I don't like this approach of adding padding to the top and using that to render the now-line label.
	// I'd rather have the curve use the full height and intelligently position the now-line label to avoid collisions with the curve (place it below if the curve is on top ie).
	const PAD_TOP = 24; // above-curve label room
	const PAD_BOTTOM = 13; // hour-tick room
	const LOOKBACK_MIN = 60; // 1h of empty space before "now"
	const WINDOW_MIN = 12 * 60; // total window width in minutes
	const HISTORY_MIN = 48 * 60; // 2d of history is the farthest you can scroll back
	const SNAP_DELAY_MS = 4_000; // idle time after release before snapping home
	const SNAP_DURATION_MS = 400;
	const ANCHORED_THRESHOLD_MIN = 2; // within 2min of home counts as "at now"
	const MOMENTUM_DECAY_PER_FRAME = 0.93; // ~60fps reference; normalized per-ms below
	const MOMENTUM_STOP_THRESHOLD = 0.001; // viewport-min per ms

	let containerWidth = 0;
	let containerHeight = 0;
	let now = new Date();
	let interval: ReturnType<typeof setInterval>;

	// Viewport state — mutable so gesture handlers can drag it. Initialized in onMount.
	let vStart = toAbsMin(new Date()) - LOOKBACK_MIN;
	let dragState: 'idle' | 'dragging' | 'momentum' | 'snapping' = 'idle';

	// Gesture internals
	let dragStartViewport = 0;
	let dragStartX = 0;
	let velocityMinPerMs = 0;
	let moveHistory: { t: number; x: number }[] = [];
	let snapTimer: ReturnType<typeof setTimeout> | null = null;
	let momentumRaf: number | null = null;
	let snapRaf: number | null = null;

	function isAnchoredToNow(): boolean {
		return Math.abs(vStart - (toAbsMin(now) - LOOKBACK_MIN)) < ANCHORED_THRESHOLD_MIN;
	}

	function clampViewport(v: number): number {
		const nMin = toAbsMin(now);
		const minStart = nMin - HISTORY_MIN; // can't scroll further into the past than data goes
		const maxStart = nMin - LOOKBACK_MIN; // home position; can't scroll into the future
		return Math.max(minStart, Math.min(maxStart, v));
	}

	function cancelPendingMotion() {
		if (snapTimer) {
			clearTimeout(snapTimer);
			snapTimer = null;
		}
		if (momentumRaf != null) {
			cancelAnimationFrame(momentumRaf);
			momentumRaf = null;
		}
		if (snapRaf != null) {
			cancelAnimationFrame(snapRaf);
			snapRaf = null;
		}
	}

	function onPointerDown(e: PointerEvent) {
		cancelPendingMotion();
		dragState = 'dragging';
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		dragStartX = e.clientX;
		dragStartViewport = vStart;
		moveHistory = [{ t: e.timeStamp, x: e.clientX }];
	}

	function onPointerMove(e: PointerEvent) {
		if (dragState !== 'dragging') return;
		const usableWidth = Math.max(1, containerWidth - PAD_LEFT - PAD_RIGHT);
		const minPerPx = WINDOW_MIN / usableWidth;
		vStart = clampViewport(dragStartViewport - (e.clientX - dragStartX) * minPerPx);
		moveHistory.push({ t: e.timeStamp, x: e.clientX });
		// Keep ~100ms tail for velocity estimate at release
		while (moveHistory.length > 1 && moveHistory[0].t < e.timeStamp - 100) moveHistory.shift();
	}

	function onPointerUp(e: PointerEvent) {
		if (dragState !== 'dragging') return;
		try {
			(e.currentTarget as Element).releasePointerCapture(e.pointerId);
		} catch {
			// Some browsers throw if the pointer was never captured; safe to ignore.
		}
		// Velocity from the recent move history
		const first = moveHistory[0];
		const last = moveHistory[moveHistory.length - 1];
		const dt = last.t - first.t;
		const pxPerMs = dt > 0 ? (last.x - first.x) / dt : 0;
		const usableWidth = Math.max(1, containerWidth - PAD_LEFT - PAD_RIGHT);
		const minPerPx = WINDOW_MIN / usableWidth;
		// Pointer right → viewport leftward (older). Negate.
		velocityMinPerMs = -pxPerMs * minPerPx;
		moveHistory = [];
		if (Math.abs(velocityMinPerMs) > 0.005) {
			dragState = 'momentum';
			startMomentum();
		} else {
			dragState = 'idle';
			scheduleSnapBack();
		}
	}

	function startMomentum() {
		let lastT = performance.now();
		// Decay 0.93 per 16.67ms (60fps reference), normalized per-ms via exp(ln(0.93)/16.67 * dt)
		const decayPerMs = Math.log(MOMENTUM_DECAY_PER_FRAME) / 16.67;
		function frame(t: number) {
			const dt = t - lastT;
			lastT = t;
			vStart = clampViewport(vStart + velocityMinPerMs * dt);
			velocityMinPerMs *= Math.exp(decayPerMs * dt);
			if (Math.abs(velocityMinPerMs) < MOMENTUM_STOP_THRESHOLD) {
				momentumRaf = null;
				dragState = 'idle';
				scheduleSnapBack();
				return;
			}
			momentumRaf = requestAnimationFrame(frame);
		}
		momentumRaf = requestAnimationFrame(frame);
	}

	function scheduleSnapBack() {
		cancelPendingMotion();
		if (isAnchoredToNow()) return;
		snapTimer = setTimeout(snapBack, SNAP_DELAY_MS);
	}

	function snapBack() {
		snapTimer = null;
		const startVal = vStart;
		const target = toAbsMin(now) - LOOKBACK_MIN;
		const t0 = performance.now();
		dragState = 'snapping';
		function frame(t: number) {
			const k = Math.min(1, (t - t0) / SNAP_DURATION_MS);
			const eased = 1 - Math.pow(1 - k, 3); // ease-out cubic
			vStart = startVal + (target - startVal) * eased;
			if (k < 1) {
				snapRaf = requestAnimationFrame(frame);
			} else {
				snapRaf = null;
				dragState = 'idle';
			}
		}
		snapRaf = requestAnimationFrame(frame);
	}

	onMount(() => {
		interval = setInterval(() => {
			const wasAnchored = isAnchoredToNow();
			now = new Date();
			// Advance the viewport with time only when the user is parked at home and not interacting
			if (wasAnchored && dragState === 'idle') {
				vStart = toAbsMin(now) - LOOKBACK_MIN;
			}
		}, 30_000);
	});
	onDestroy(() => {
		clearInterval(interval);
		cancelPendingMotion();
	});

	function toAbsMin(d: Date): number {
		return Math.floor(d.getTime() / 60_000);
	}

	function catmullRomPath(pts: { x: number; y: number }[]): string {
		if (pts.length < 2) return '';
		let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
		for (let i = 0; i < pts.length - 1; i++) {
			const p0 = pts[Math.max(0, i - 1)];
			const p1 = pts[i];
			const p2 = pts[i + 1];
			const p3 = pts[Math.min(pts.length - 1, i + 2)];
			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;
			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;
			d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
		}
		return d;
	}

	$: showFahrenheit = $showFahrenheitStore;
	$: unit = $weatherStore?.attributes.temperature_unit ?? '°F';

	$: hourly = $hourlyForecastStore;
	$: history = $temperatureHistoryStore;
	$: sun = $sunStore;
	// Prefer the sensor (denser + same source as history). Fall back to weather entity if sensor unavailable.
	$: outdoorTempF = $outdoorTempStore;
	$: currentTemp =
		outdoorTempF != null
			? fahrenheitTo(outdoorTempF, unit)
			: ($weatherStore?.attributes.temperature ?? null);

	// Rolling viewport: vStart is mutable (gesture handlers above), vEnd derives reactively
	$: nowMin = toAbsMin(now);
	$: vEnd = vStart + WINDOW_MIN;

	// Merged data — past samples (°F → unit) + now anchor + forecast (already in unit), sorted by time
	$: pastPoints = history.map((s) => ({
		abs: toAbsMin(new Date(s.datetime)),
		temp: fahrenheitTo(s.temperature, unit)
	}));
	$: futurePoints = hourly.map((e) => ({
		abs: toAbsMin(new Date(e.datetime)),
		temp: e.temperature
	}));
	$: allPoints = [
		...pastPoints,
		...(currentTemp != null ? [{ abs: nowMin, temp: currentTemp }] : []),
		...futurePoints
	].sort((a, b) => a.abs - b.abs);

	// Points visible in the current viewport — drives Y-axis scale
	$: visiblePoints = allPoints.filter((p) => p.abs >= vStart && p.abs <= vEnd);

	// X: inlined so Svelte tracks vStart and containerWidth as deps
	$: nowX = PAD_LEFT + ((nowMin - vStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT);

	// Y scale over the visible window's temperature range
	$: temps = visiblePoints.map((p) => p.temp);
	$: rawMin = temps.length ? Math.min(...temps) : 0;
	$: rawMax = temps.length ? Math.max(...temps) : 10;
	// 1° breathing room so curve doesn't clip the edges; labels sit at rawMin/rawMax
	$: scaledMin = rawMin - 1;
	$: scaledMax = rawMax + 1;
	$: scaledRange = scaledMax - scaledMin || 1;

	// Now y-position — explicit deps
	$: nowY =
		currentTemp != null
			? PAD_TOP +
				(1 - (currentTemp - scaledMin) / scaledRange) * (containerHeight - PAD_TOP - PAD_BOTTOM)
			: containerHeight / 2;

	// Curve: include a 60min buffer outside the viewport so Catmull-Rom edges stay smooth.
	// Off-screen points are clipped by <clipPath> in the markup.
	$: curveSourcePoints = allPoints.filter((p) => p.abs >= vStart - 60 && p.abs <= vEnd + 60);
	$: curvePoints = curveSourcePoints.map((p) => ({
		x: PAD_LEFT + ((p.abs - vStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT),
		y: PAD_TOP + (1 - (p.temp - scaledMin) / scaledRange) * (containerHeight - PAD_TOP - PAD_BOTTOM)
	}));

	$: pathD = catmullRomPath(curvePoints);

	// High/low Y positions for axis labels
	$: highY =
		PAD_TOP + (1 - (rawMax - scaledMin) / scaledRange) * (containerHeight - PAD_TOP - PAD_BOTTOM);
	$: lowY =
		PAD_TOP + (1 - (rawMin - scaledMin) / scaledRange) * (containerHeight - PAD_TOP - PAD_BOTTOM);

	// Sun events — check if they fall within the rolling window
	$: sunsetAbs = sun?.attributes.next_setting
		? toAbsMin(new Date(sun.attributes.next_setting))
		: null;
	$: sunsetInRange = sunsetAbs != null && sunsetAbs >= vStart && sunsetAbs <= vEnd;
	$: sunsetX =
		sunsetAbs != null
			? PAD_LEFT + ((sunsetAbs - vStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT)
			: 0;

	$: sunriseAbs = sun?.attributes.next_rising
		? toAbsMin(new Date(sun.attributes.next_rising))
		: null;
	$: sunriseInRange = sunriseAbs != null && sunriseAbs >= vStart && sunriseAbs <= vEnd;
	$: sunriseX =
		sunriseAbs != null
			? PAD_LEFT + ((sunriseAbs - vStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT)
			: 0;

	// Hour ticks: every 3h, snapped to whole-hour boundaries within the window
	$: tickHours = (() => {
		if (!containerWidth) return [];
		const ticks: { label: string; x: number }[] = [];
		const startDate = new Date(vStart * 60_000);
		startDate.setMinutes(0, 0, 0);
		// Advance to the next whole hour if we're mid-minute
		if (startDate.getTime() / 60_000 < vStart) startDate.setHours(startDate.getHours() + 1);
		// Advance to next 3h boundary
		while (startDate.getHours() % 3 !== 0) startDate.setHours(startDate.getHours() + 1);
		while (toAbsMin(startDate) <= vEnd) {
			const abs = toAbsMin(startDate);
			ticks.push({
				label: formatHour(startDate.getHours()),
				x: PAD_LEFT + ((abs - vStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT)
			});
			startDate.setHours(startDate.getHours() + 3);
		}
		return ticks;
	})();

	function formatHour(h: number): string {
		if (h === 0) return '12a';
		if (h === 12) return '12p';
		return h < 12 ? `${h}a` : `${h - 12}p`;
	}
</script>

<style>
	.graph {
		width: 100%;
		height: 100%;
		/* Let the browser keep vertical page scroll; we own horizontal gestures. */
		touch-action: pan-y;
	}

	svg {
		display: block;
		overflow: visible;
		/* Avoid native text selection / image-drag during scrub. */
		user-select: none;
		-webkit-user-select: none;
		cursor: grab;
	}

	svg:active {
		cursor: grabbing;
	}

	.now-label {
		font-size: var(--text-caption);
		fill: var(--color-accent);
		opacity: 0.9;
	}

	.y-label {
		font-size: var(--text-caption);
		fill: currentColor;
		opacity: 0.4;
	}

	.tick-label {
		font-size: var(--text-caption);
		fill: currentColor;
		opacity: 0.35;
	}

	.sun-label {
		opacity: 0.45;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		font-size: var(--text-caption);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="graph" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
	{#if containerWidth > 0}
		<svg
			width={containerWidth}
			height={containerHeight}
			on:pointerdown={onPointerDown}
			on:pointermove={onPointerMove}
			on:pointerup={onPointerUp}
			on:pointercancel={onPointerUp}
		>
			<defs>
				<clipPath id="hourly-temp-curve-clip">
					<rect
						x={PAD_LEFT}
						y="0"
						width={Math.max(0, containerWidth - PAD_LEFT - PAD_RIGHT)}
						height={containerHeight}
					/>
				</clipPath>
			</defs>
			<!-- High/low boundary lines + labels -->
			{#if temps.length}
				<line
					x1={PAD_LEFT}
					y1={highY}
					x2={containerWidth - PAD_RIGHT}
					y2={highY}
					stroke="currentColor"
					stroke-width="1"
					opacity="0.1"
				/>
				<text x={PAD_LEFT - 4} y={highY + 3.5} text-anchor="end" class="y-label">
					{displayTemp(rawMax, unit, showFahrenheit)}
				</text>
				{#if lowY - highY > 12}
					<line
						x1={PAD_LEFT}
						y1={lowY}
						x2={containerWidth - PAD_RIGHT}
						y2={lowY}
						stroke="currentColor"
						stroke-width="1"
						opacity="0.1"
					/>
					<text x={PAD_LEFT - 4} y={lowY + 3.5} text-anchor="end" class="y-label">
						{displayTemp(rawMin, unit, showFahrenheit)}
					</text>
				{/if}
			{/if}

			<!-- Temperature curve (past + now-anchor + forecast) -->
			{#if pathD}
				<path
					d={pathD}
					fill="none"
					stroke="var(--color-accent)"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					opacity="0.8"
					clip-path="url(#hourly-temp-curve-clip)"
				/>
			{/if}

			<!-- Sunrise marker -->
			{#if sunriseInRange}
				<line
					x1={sunriseX}
					y1={PAD_TOP}
					x2={sunriseX}
					y2={containerHeight - PAD_BOTTOM}
					stroke="currentColor"
					stroke-width="1"
					opacity="0.15"
				/>
				<text x={sunriseX} y={containerHeight - 2} text-anchor="middle" class="tick-label sun-label"
					>sunrise</text
				>
			{/if}

			<!-- Sunset marker -->
			{#if sunsetInRange}
				<line
					x1={sunsetX}
					y1={PAD_TOP}
					x2={sunsetX}
					y2={containerHeight - PAD_BOTTOM}
					stroke="currentColor"
					stroke-width="1"
					opacity="0.15"
				/>
				<text x={sunsetX} y={containerHeight - 2} text-anchor="middle" class="tick-label sun-label"
					>sunset</text
				>
			{/if}

			<!-- Now indicator: dashed line + dot + current temp -->
			<line
				x1={nowX}
				y1={PAD_TOP - 4}
				x2={nowX}
				y2={containerHeight - PAD_BOTTOM}
				stroke="var(--color-accent)"
				stroke-width="1"
				stroke-dasharray="2 3"
				opacity="0.55"
			/>
			{#if currentTemp != null}
				<circle
					cx={nowX}
					cy={nowY}
					r="2.5"
					fill="var(--color-bg)"
					stroke="var(--color-accent)"
					stroke-width="1.5"
				/>
				<text x={nowX} y={PAD_TOP - 10} text-anchor="middle" class="now-label">
					{displayTemp(currentTemp, unit, showFahrenheit)}
				</text>
			{/if}

			<!-- Hour tick labels -->
			{#each tickHours as tick}
				<text x={tick.x} y={containerHeight - 2} text-anchor="middle" class="tick-label">
					{tick.label}
				</text>
			{/each}
		</svg>
	{:else}
		<div class="empty">loading</div>
	{/if}
</div>
