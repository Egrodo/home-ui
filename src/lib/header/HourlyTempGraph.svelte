<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { hourlyForecastStore, sunStore, weatherStore } from '../data/backendStores';

	const PAD_X = 8;
	const PAD_TOP = 18; // room for temp label above the line
	const PAD_BOTTOM = 16; // room for hour tick labels

	let containerWidth = 0;
	let containerHeight = 0;
	let now = new Date();
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		interval = setInterval(() => (now = new Date()), 30_000);
	});
	onDestroy(() => clearInterval(interval));

	function toMinutes(iso: string): number {
		const d = new Date(iso);
		return d.getHours() * 60 + d.getMinutes();
	}

	// Absolute minutes from a fixed epoch for cross-day comparison
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

	// Show the next 12 hours from now regardless of day boundary
	$: windowEntries = (() => {
		const nowAbs = toAbsMinutes(now.toISOString());
		return hourly.filter((e) => {
			const abs = toAbsMinutes(e.datetime);
			return abs >= nowAbs - 30 && abs <= nowAbs + 12 * 60;
		});
	})();

	$: minAbs = windowEntries.length ? toAbsMinutes(windowEntries[0].datetime) : 0;
	$: maxAbs = windowEntries.length ? toAbsMinutes(windowEntries[windowEntries.length - 1].datetime) : 12 * 60;
	$: timeRange = Math.max(maxAbs - minAbs, 60);

	$: temps = windowEntries.map((e) => e.temperature);
	$: rawMin = temps.length ? Math.min(...temps) : 0;
	$: rawMax = temps.length ? Math.max(...temps) : 10;
	// Pad the Y scale so even a narrow temp range shows visible curvature
	$: tempPad = Math.max((rawMax - rawMin) * 0.4, 2);
	$: minTemp = rawMin - tempPad;
	$: maxTemp = rawMax + tempPad;
	$: tempRange = maxTemp - minTemp;

	function toX(absMinutes: number): number {
		return PAD_X + ((absMinutes - minAbs) / timeRange) * (containerWidth - PAD_X * 2);
	}

	function toY(temp: number): number {
		const normalized = (temp - minTemp) / tempRange;
		return PAD_TOP + (1 - normalized) * (containerHeight - PAD_TOP - PAD_BOTTOM);
	}

	$: points = windowEntries.map((e) => ({
		x: toX(toAbsMinutes(e.datetime)),
		y: toY(e.temperature),
		temp: e.temperature,
		abs: toAbsMinutes(e.datetime)
	}));

	$: pathD = catmullRomPath(points);

	// Now indicator
	$: nowAbs = toAbsMinutes(now.toISOString());
	$: nowX = toX(nowAbs);
	$: nowInRange = nowAbs >= minAbs && nowAbs <= maxAbs;

	$: nowTemp = (() => {
		if (!points.length) return null;
		const before = points.filter((p) => p.abs <= nowAbs);
		const after = points.filter((p) => p.abs > nowAbs);
		if (!before.length) return points[0].temp;
		if (!after.length) return points[points.length - 1].temp;
		const p1 = before[before.length - 1];
		const p2 = after[0];
		const t = (nowAbs - p1.abs) / (p2.abs - p1.abs);
		return p1.temp + t * (p2.temp - p1.temp);
	})();

	$: nowY = nowTemp != null ? toY(nowTemp) : 0;

	function displayTemp(temp: number): string {
		const val = unit === '°C' ? Math.round((temp * 9) / 5 + 32) : Math.round(temp);
		return `${val}°`;
	}

	// Sunset marker
	$: sunsetIso = sun?.attributes.next_setting ?? null;
	$: sunsetAbs = sunsetIso ? toAbsMinutes(sunsetIso) : null;
	$: sunsetInRange = sunsetAbs != null && sunsetAbs >= minAbs && sunsetAbs <= maxAbs;
	$: sunsetX = sunsetAbs != null ? toX(sunsetAbs) : 0;

	// Hour tick labels — one per 3h across the window
	$: tickHours = (() => {
		if (!windowEntries.length) return [];
		const ticks: { label: string; x: number }[] = [];
		const startMs = minAbs * 60_000;
		const endMs = maxAbs * 60_000;
		// Snap to next whole 3-hour boundary after start
		const startD = new Date(startMs);
		let h = new Date(startD);
		h.setMinutes(0, 0, 0);
		if (h.getTime() < startMs) h.setHours(h.getHours() + 1);
		// Advance to next 3h slot
		while (h.getHours() % 3 !== 0) h.setHours(h.getHours() + 1);
		while (h.getTime() <= endMs) {
			ticks.push({ label: formatHour(h.getHours()), x: toX(h.getTime() / 60_000) });
			h.setHours(h.getHours() + 3);
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
					opacity="0.2"
				/>
				<text
					x={sunsetX}
					y={containerHeight - PAD_BOTTOM + 12}
					text-anchor="middle"
					class="tick-label sunset-label"
				>
					☀
				</text>
			{/if}

			<!-- Now indicator -->
			{#if nowInRange}
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
				<circle
					cx={nowX}
					cy={nowY}
					r="2.5"
					fill="var(--color-bg)"
					stroke="var(--color-accent)"
					stroke-width="1.5"
				/>
				{#if nowTemp != null}
					<text x={nowX} y={PAD_TOP - 5} text-anchor="middle" class="now-label">
						{displayTemp(nowTemp)}
					</text>
				{/if}
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
