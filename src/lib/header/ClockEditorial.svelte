<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { themeStore } from '$lib/data/theme';

	export let size: number = 280;
	export let time: { h: number; m: number; s?: number } | undefined = undefined;

	let now: Date = time ? new Date(0, 0, 0, time.h, time.m, time.s ?? 0) : new Date();
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		if (!time) {
			interval = setInterval(() => {
				now = new Date();
			}, 1000);
		}
	});

	onDestroy(() => clearInterval(interval));

	const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
		const rad = ((deg - 90) * Math.PI) / 180;
		return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
	};

	$: h = now.getHours();
	$: m = now.getMinutes();
	$: s = now.getSeconds();

	$: hourAngle = ((h % 12) + m / 60) * 30;
	$: minAngle = m * 6 + s * 0.1;
	$: secAngle = s * 6;

	$: c = size / 2;
	$: [hx, hy] = polar(c, c, c * 0.5, hourAngle);
	$: [mx, my] = polar(c, c, c * 0.78, minAngle);
	$: [sx, sy] = polar(c, c, c * 0.84, secAngle);
	$: [tx, ty] = polar(c, c, -c * 0.18, secAngle);

	$: ariaLabel = `Clock showing ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 {size} {size}"
	role="button"
	aria-label={ariaLabel}
	style="cursor: pointer"
	on:click={() => themeStore.toggle()}
	on:keydown={(e) => e.key === 'Enter' && themeStore.toggle()}
	tabindex="0"
>
	<!-- face -->
	<circle
		cx={c}
		cy={c}
		r={c - 2}
		fill="var(--surface-1)"
		stroke="var(--ink-1)"
		stroke-width="1.2"
	/>

	<!-- 12 hour ticks only -->
	{#each Array.from({ length: 12 }, (_, i) => i) as i}
		{@const [x1, y1] = polar(c, c, c - 6, i * 30)}
		{@const [x2, y2] = polar(c, c, c - 14, i * 30)}
		<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-1)" stroke-width={2} />
	{/each}

	<!-- hour hand -->
	<line
		x1={c}
		y1={c}
		x2={hx}
		y2={hy}
		stroke="var(--ink-1)"
		stroke-width={size * 0.022}
		stroke-linecap="square"
	/>

	<!-- minute hand -->
	<line
		x1={c}
		y1={c}
		x2={mx}
		y2={my}
		stroke="var(--ink-1)"
		stroke-width={size * 0.014}
		stroke-linecap="square"
	/>

	<!-- second hand with counter-balance tail -->
	<line
		x1={tx}
		y1={ty}
		x2={sx}
		y2={sy}
		stroke="var(--accent-warm)"
		stroke-width={Math.max(1.2, size * 0.005)}
		stroke-linecap="round"
	/>

	<!-- pivot dot -->
	<circle cx={c} cy={c} r={Math.max(2, size * 0.018)} fill="var(--accent-warm)" />
</svg>
