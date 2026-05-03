<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { hourlyForecastStore, sunStore, weatherStore } from '../data/backendStores';

	const PAD_LEFT = 26; // Y-label column
	const PAD_RIGHT = 8;
	const PAD_TOP = 16; // above-curve label room
	const PAD_BOTTOM = 13; // hour-tick room
	const LOOKBACK_MIN = 60; // 1h of empty space before "now"
	const WINDOW_MIN = 12 * 60; // total window width in minutes

	let containerWidth = 0;
	let containerHeight = 0;
	let now = new Date();
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		interval = setInterval(() => (now = new Date()), 30_000);
	});
	onDestroy(() => clearInterval(interval));

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

	$: hourly = $hourlyForecastStore;
	$: sun = $sunStore;
	$: currentTemp = $weatherStore?.attributes.temperature ?? null;

	// Rolling window: 1h before now → 11h after now
	$: nowMin = toAbsMin(now);
	$: windowStart = nowMin - LOOKBACK_MIN;
	$: windowEnd = windowStart + WINDOW_MIN;

	// Entries within the window (all future, HA provides no historical data)
	$: windowEntries = hourly.filter((e) => {
		const abs = toAbsMin(new Date(e.datetime));
		return abs >= windowStart && abs <= windowEnd;
	});

	// X: inlined so Svelte tracks windowStart and containerWidth as deps
	$: nowX =
		PAD_LEFT + ((nowMin - windowStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT);

	// Y scale over the window's forecast range
	$: temps = windowEntries.map((e) => e.temperature);
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

	// Forecast curve points — inlined so all deps are tracked
	$: forecastPoints = windowEntries.map((e) => ({
		x:
			PAD_LEFT +
			((toAbsMin(new Date(e.datetime)) - windowStart) / WINDOW_MIN) *
				(containerWidth - PAD_LEFT - PAD_RIGHT),
		y:
			PAD_TOP +
			(1 - (e.temperature - scaledMin) / scaledRange) * (containerHeight - PAD_TOP - PAD_BOTTOM)
	}));

	// Prepend synthetic "now" anchor so curve starts at current temp
	$: curvePoints = (() => {
		if (currentTemp == null) return forecastPoints;
		const synth = { x: nowX, y: nowY };
		if (!forecastPoints.length || synth.x <= forecastPoints[0].x) return [synth, ...forecastPoints];
		return forecastPoints;
	})();

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
	$: sunsetInRange = sunsetAbs != null && sunsetAbs >= windowStart && sunsetAbs <= windowEnd;
	$: sunsetX =
		sunsetAbs != null
			? PAD_LEFT +
				((sunsetAbs - windowStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT)
			: 0;

	$: sunriseAbs = sun?.attributes.next_rising
		? toAbsMin(new Date(sun.attributes.next_rising))
		: null;
	$: sunriseInRange = sunriseAbs != null && sunriseAbs >= windowStart && sunriseAbs <= windowEnd;
	$: sunriseX =
		sunriseAbs != null
			? PAD_LEFT +
				((sunriseAbs - windowStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT)
			: 0;

	// Hour ticks: every 3h, snapped to whole-hour boundaries within the window
	$: tickHours = (() => {
		if (!containerWidth) return [];
		const ticks: { label: string; x: number }[] = [];
		const startDate = new Date(windowStart * 60_000);
		startDate.setMinutes(0, 0, 0);
		// Advance to the next whole hour if we're mid-minute
		if (startDate.getTime() / 60_000 < windowStart) startDate.setHours(startDate.getHours() + 1);
		// Advance to next 3h boundary
		while (startDate.getHours() % 3 !== 0) startDate.setHours(startDate.getHours() + 1);
		while (toAbsMin(startDate) <= windowEnd) {
			const abs = toAbsMin(startDate);
			ticks.push({
				label: formatHour(startDate.getHours()),
				x: PAD_LEFT + ((abs - windowStart) / WINDOW_MIN) * (containerWidth - PAD_LEFT - PAD_RIGHT)
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
	}

	svg {
		display: block;
		overflow: visible;
	}

	.now-label {
		font-size: 9px;
		fill: var(--color-accent);
		opacity: 0.9;
	}

	.y-label {
		font-size: 8px;
		fill: currentColor;
		opacity: 0.4;
	}

	.tick-label {
		font-size: 8px;
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
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="graph" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
	{#if containerWidth > 0}
		<svg width={containerWidth} height={containerHeight}>
			<!-- High/low boundary lines + labels -->
			{#if temps.length}
				<line x1={PAD_LEFT} y1={highY} x2={containerWidth - PAD_RIGHT} y2={highY}
					stroke="currentColor" stroke-width="1" opacity="0.1" />
				<text x={PAD_LEFT - 4} y={highY + 3.5} text-anchor="end" class="y-label">
					{Math.round(rawMax)}°
				</text>
				{#if lowY - highY > 12}
					<line x1={PAD_LEFT} y1={lowY} x2={containerWidth - PAD_RIGHT} y2={lowY}
						stroke="currentColor" stroke-width="1" opacity="0.1" />
					<text x={PAD_LEFT - 4} y={lowY + 3.5} text-anchor="end" class="y-label">
						{Math.round(rawMin)}°
					</text>
				{/if}
			{/if}

			<!-- Temperature curve (now-anchor + forecast) -->
			{#if pathD}
				<path
					d={pathD}
					fill="none"
					stroke="var(--color-accent)"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					opacity="0.8"
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
					>set</text
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
				<text x={nowX} y={PAD_TOP - 5} text-anchor="middle" class="now-label">
					{Math.round(currentTemp)}°
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
