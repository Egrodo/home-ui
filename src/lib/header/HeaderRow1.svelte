<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_HOME_NAME } from '$env/static/public';
	import ClockEditorial from './ClockEditorial.svelte';

	const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const MONTH_NAMES = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	let now = new Date();
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		interval = setInterval(() => {
			now = new Date();
		}, 1000);
	});

	onDestroy(() => clearInterval(interval));

	$: dayName = DAY_NAMES[now.getDay()];
	$: monthName = MONTH_NAMES[now.getMonth()];
	$: dayNum = String(now.getDate()).padStart(2, '0');
	$: dateString = `${dayName} · ${monthName} ${dayNum}`;

	let use24h = false;

	$: hours24 = now.getHours();
	$: ampm = hours24 >= 12 ? 'PM' : 'AM';
	$: hours12 = hours24 % 12 || 12;
	$: minutes = String(now.getMinutes()).padStart(2, '0');
	$: timeString = use24h
		? `${String(hours24).padStart(2, '0')}:${minutes}`
		: `${hours12}:${minutes}`;
</script>

<style>
	.row {
		display: grid;
		grid-template-columns: 100px 1fr 1fr auto;
		align-items: center;
		padding: 0 28px;
		height: 100%;
		gap: 16px;
	}

	.clock {
		flex-shrink: 0;
		display: flex;
	}

	/* House name + date */
	.identity {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Digital time + am/pm label */
	.time {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: inherit;
		font-family: inherit;
	}

	/* Placeholder text */
	.p-name {
		font-size: var(--text-headline);
		font-weight: var(--font-weight-semibold);
		opacity: var(--opacity-text-primary);
	}

	.p-date {
		font-size: var(--text-body);
		font-weight: var(--font-weight-normal);
		opacity: var(--opacity-text-muted);
		letter-spacing: 0.01em;
	}

	.p-hhmm {
		font-size: var(--text-title);
		font-weight: var(--font-weight-normal);
		line-height: 1;
		opacity: var(--opacity-text-primary);
		letter-spacing: -0.02em;
	}

	.p-ampm {
		font-size: var(--text-caption);
		font-weight: var(--font-weight-medium);
		opacity: var(--opacity-text-muted);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		align-self: flex-end;
	}
</style>

<div class="row">
	<!-- Analog clock -->
	<div class="clock">
		<ClockEditorial size={80} />
	</div>

	<!-- House name + date -->
	<div class="identity">
		<span class="p-name">{PUBLIC_HOME_NAME}</span>
		<span class="p-date">{dateString}</span>
	</div>

	<!-- Intentional whitespace (center zone) -->
	<div class="whitespace"></div>

	<!-- Digital time + AM/PM -->
	<button class="time" on:click={() => (use24h = !use24h)}>
		<span class="p-hhmm">{timeString}</span>
		{#if !use24h}<span class="p-ampm">{ampm}</span>{/if}
	</button>
</div>
