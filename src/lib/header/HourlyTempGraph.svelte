<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { hourlyForecastStore, sunStore, weatherStore } from '../data/backendStores';

	const PAD_LEFT = 28; // Y-axis label gutter
	const PAD_RIGHT = 8;
	const PAD_TOP = 18; // room for now-temp label
	const PAD_BOTTOM = 16; // room for hour ticks

	let containerWidth = 0;
	let containerHeight = 0;
	let now = new Date();
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		interval = setInterval(() => (now = new Date()), 30_000);
	});
	onDestroy(() => clearInterval(interval));

	function toAbsMinutes(iso: string): number {
		return Math.floor(new Date(iso).getTime() / 60_000);
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

	// Fixed X range: today midnight → tomorrow midnight
	$: dayStartAbs = (() => {
		const d = new Date(now);
		d.setHours(0, 0, 0, 0);
		return Math.floor(d.getTime() / 60_000);
	})();
	$: dayEndAbs = dayStartAbs + 24 * 60;
	$: timeRange = 24 * 60;

	// Today's hourly entries only
	$: windowEntries = hourly.filter((e) => {
		const abs = toAbsMinutes(e.datetime);
		return abs >= dayStartAbs && abs < dayEndAbs;
	});

	// Y scale — pad so even a narrow range shows curvature
	$: temps = windowEntries.map((e) => e.temperature);
	$: rawMin = temps.length ? Math.min(...temps) : 0;
	$: rawMax = temps.length ? Math.max(...temps) : 10;
	$: tempPad = Math.max((rawMax - rawMin) * 0.35, 2);
	$: minTemp = rawMin - tempPad;
	$: maxTemp = rawMax + tempPad;
	$: tempRange = maxTemp - minTemp;

	function toX(absMinutes: number): number {
		return PAD_LEFT + ((absMinutes - dayStartAbs) / timeRange) * (containerWidth - PAD_LEFT - PAD_RIGHT);
	}

	function toY(temp: number): number {
		const normalized = (temp - minTemp) / tempRange;
		return PAD_TOP + (1 - normalized) * (containerHeight - PAD_TOP - PAD_BOTTOM);
	}

	$: points = windowEntries.map((e) => ({
		x: toX(toAbsMinutes(e.datetime)),
		y: toY(e.temperature),
		temp: e.temperature
	}));

	$: pathD = catmullRomPath(points);

	// Now indicator — always within the fixed 24h range
	$: nowAbs = Math.floor(now.getTime() / 60_000);
	$: nowX = toX(nowAbs);
	$: nowY = currentTemp != null ? toY(currentTemp) : containerHeight / 2;

	function displayTemp(temp: number): string {
		const val = unit === '°C' ? Math.round((temp * 9) / 5 + 32) : Math.round(temp);
		return `${val}°`;
	}

	// Y axis labels: actual data high/low
	$: yLabelHigh = rawMax;
	$: yLabelLow = rawMin;

	// Sunset marker
	$: sunsetIso = sun?.attributes.next_setting ?? null;
	$: sunsetAbs = sunsetIso ? toAbsMinutes(sunsetIso) : null;
	$: sunsetInRange =
		sunsetAbs != null && sunsetAbs >= dayStartAbs && sunsetAbs < dayEndAbs;
	$: sunsetX = sunsetAbs != null ? toX(sunsetAbs) : 0;

	// Hour ticks every 3h on a fixed 24h grid
	$: tickHours = (() => {
		const ticks: { label: string; x: number }[] = [];
		for (let h = 0; h <= 24; h += 3) {
			ticks.push({
				label: formatHour(h),
				x: toX(dayStartAbs + h * 60)
			});
		}
		return ticks;
	})();

	function formatHour(h: number): string {
		if (h === 0 || h === 24) return '12a';
		if (h === 12) return '12p';
		return h < 12 ? `${h}a` : `${h - 12}p`;
	}
</script>

<div class="graph" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
	{#if containerWidth > 0 && windowEntries.length > 0}
		<svg width={containerWidth} height={containerHeight}>
			<!-- Y axis labels: high / low -->
			<text
				x={PAD_LEFT - 4}
				y={toY(yLabelHigh) + 3}
				text-anchor="end"
				class="y-label"
			>{displayTemp(yLabelHigh)}</text>
			<text
				x={PAD_LEFT - 4}
				y={toY(yLabelLow) + 3}
				text-anchor="end"
				class="y-label"
			>{displayTemp(yLabelLow)}</text>

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
				<text
					x={sunsetX}
					y={containerHeight - PAD_BOTTOM + 12}
					text-anchor="middle"
					class="tick-label sunset-label"
				>☀</text>
			{/if}

			<!-- Now indicator -->
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
				<text x={nowX} y={PAD_TOP - 5} text-anchor="middle" class="now-label">
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
		font-size: 8px;
		fill: currentColor;
		opacity: 0.5;
	}

	.tick-label {
		font-size: 8px;
		fill: currentColor;
		opacity: 0.35;
	}

	.sunset-label {
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
