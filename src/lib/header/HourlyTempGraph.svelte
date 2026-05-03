<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { hourlyForecastStore, sunStore, weatherStore } from '../data/backendStores';

	const PAD_X = 12;
	const PAD_TOP = 20; // room for floating temp labels above curve
	const PAD_BOTTOM = 16; // room for hour ticks

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
	$: unit = $weatherStore?.attributes.temperature_unit ?? '°F';
	$: currentTemp = $weatherStore?.attributes.temperature ?? null;

	// Rolling 12h window starting from now
	$: nowMin = toAbsMin(now);
	$: windowStart = nowMin;
	$: windowEnd = nowMin + 12 * 60;

	$: windowEntries = hourly.filter((e) => {
		const abs = toAbsMin(new Date(e.datetime));
		return abs >= windowStart && abs <= windowEnd;
	});

	// X mapping over the 12h window
	function toX(absMin: number): number {
		return PAD_X + ((absMin - windowStart) / (12 * 60)) * (containerWidth - PAD_X * 2);
	}

	// Y scale with padding so narrow ranges still show curvature
	$: temps = windowEntries.map((e) => e.temperature);
	$: rawMin = temps.length ? Math.min(...temps) : 0;
	$: rawMax = temps.length ? Math.max(...temps) : 10;
	$: tempPad = Math.max((rawMax - rawMin) * 0.35, 2);
	$: scaledMin = rawMin - tempPad;
	$: scaledMax = rawMax + tempPad;
	$: scaledRange = scaledMax - scaledMin;

	function toY(temp: number): number {
		return PAD_TOP + (1 - (temp - scaledMin) / scaledRange) * (containerHeight - PAD_TOP - PAD_BOTTOM);
	}

	$: points = windowEntries.map((e) => ({
		x: toX(toAbsMin(new Date(e.datetime))),
		y: toY(e.temperature),
		temp: e.temperature
	}));

	$: pathD = catmullRomPath(points);

	// Now indicator — always rendered at left edge of window
	$: nowX = toX(nowMin);
	$: nowY = currentTemp != null ? toY(currentTemp) : containerHeight / 2;

	function displayTemp(temp: number): string {
		const val = unit === '°C' ? Math.round((temp * 9) / 5 + 32) : Math.round(temp);
		return `${val}°`;
	}

	// Floating Y labels at the curve's high/low points
	$: highPoint = points.reduce((a, b) => (b.temp > a.temp ? b : a), points[0] ?? { x: 0, y: 0, temp: 0 });
	$: lowPoint = points.reduce((a, b) => (b.temp < a.temp ? b : a), points[0] ?? { x: 0, y: 0, temp: 0 });
	// Only show both if they're far enough apart vertically
	$: showBothYLabels = Math.abs(highPoint.y - lowPoint.y) > 14;

	// Sunset marker
	$: sunsetDate = sun?.attributes.next_setting ? new Date(sun.attributes.next_setting) : null;
	$: sunsetAbs = sunsetDate ? toAbsMin(sunsetDate) : null;
	$: sunsetInRange = sunsetAbs != null && sunsetAbs >= windowStart && sunsetAbs <= windowEnd;
	$: sunsetX = sunsetAbs != null ? toX(sunsetAbs) : 0;

	// Hour tick labels — whole hours within the window, every 3h
	$: tickHours = (() => {
		const ticks: { label: string; x: number }[] = [];
		// Find the next whole hour at or after windowStart
		const startDate = new Date(windowStart * 60_000);
		startDate.setMinutes(0, 0, 0);
		if (startDate.getTime() / 60_000 < windowStart) {
			startDate.setHours(startDate.getHours() + 1);
		}
		// Advance to next 3h boundary
		while (startDate.getHours() % 3 !== 0) startDate.setHours(startDate.getHours() + 1);
		while (toAbsMin(startDate) <= windowEnd) {
			ticks.push({ label: formatHour(startDate.getHours()), x: toX(toAbsMin(startDate)) });
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

<div class="graph" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
	{#if containerWidth > 0 && windowEntries.length > 0}
		<svg width={containerWidth} height={containerHeight}>
			<!-- Temperature curve -->
			<path
				d={pathD}
				fill="none"
				stroke="var(--color-accent)"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				opacity="0.7"
			/>

			<!-- Floating Y labels at high and low points -->
			{#if points.length}
				<text
					x={highPoint.x}
					y={highPoint.y - 5}
					text-anchor="middle"
					class="y-label"
				>{displayTemp(rawMax)}</text>
				{#if showBothYLabels}
					<text
						x={lowPoint.x}
						y={lowPoint.y + 11}
						text-anchor="middle"
						class="y-label"
					>{displayTemp(rawMin)}</text>
				{/if}
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
					opacity="0.18"
				/>
				<text x={sunsetX} y={containerHeight - PAD_BOTTOM + 12} text-anchor="middle" class="tick-label sunset-label">
					set
				</text>
			{/if}

			<!-- Now indicator — always visible -->
			<line
				x1={nowX}
				y1={PAD_TOP - 4}
				x2={nowX}
				y2={containerHeight - PAD_BOTTOM}
				stroke="currentColor"
				stroke-width="1"
				stroke-dasharray="2 3"
				opacity="0.3"
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
				<text x={nowX} y={PAD_TOP - 6} text-anchor="middle" class="now-label">
					{displayTemp(currentTemp)}
				</text>
			{/if}

			<!-- Hour tick labels -->
			{#each tickHours as tick}
				<text x={tick.x} y={containerHeight - 2} text-anchor="middle" class="tick-label">
					{tick.label}
				</text>
			{/each}
		</svg>
	{:else if windowEntries.length === 0}
		<div class="empty">Loading…</div>
	{/if}
</div>

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
		fill: currentColor;
		opacity: 0.9;
	}

	.y-label {
		font-size: 9px;
		fill: currentColor;
		opacity: 0.55;
	}

	.tick-label {
		font-size: 8px;
		fill: currentColor;
		opacity: 0.35;
	}

	.sunset-label {
		opacity: 0.4;
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
