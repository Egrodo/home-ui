<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import StockCard from './StockCard.svelte';
	import type { StockData } from '$lib/data/types';

	// NYSE/NASDAQ: 9:30–16:00 America/New_York, weekdays only
	function isMarketOpen(): boolean {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: 'America/New_York',
			hour: 'numeric',
			minute: 'numeric',
			hour12: false,
			weekday: 'short'
		}).formatToParts(new Date());

		const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
		const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0');
		const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0');

		if (weekday === 'Sat' || weekday === 'Sun') return false;

		const mins = hour * 60 + minute;
		return mins >= 9 * 60 + 30 && mins < 16 * 60;
	}

	let stocks: StockData[] = [];
	let interval: ReturnType<typeof setInterval>;

	async function fetchStocks() {
		try {
			const res = await fetch('/api/stocks');
			if (res.ok) stocks = await res.json();
		} catch {
			// silently retain last data
		}
	}

	onMount(() => {
		fetchStocks();
		// Refetch hourly — only during market hours to avoid unnecessary calls
		interval = setInterval(() => {
			if (isMarketOpen()) fetchStocks();
		}, 60 * 60 * 1000);
	});

	onDestroy(() => clearInterval(interval));
</script>

<style>
	.stocks {
		margin: 0 24px 24px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 16px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}
</style>

<section class="stocks">
	<div class="grid">
		{#each stocks as stock (stock.ticker)}
			<StockCard
				ticker={stock.ticker}
				price={stock.price}
				change={stock.change}
				changePercent={stock.changePercent}
				sparkline={stock.sparkline}
			/>
		{/each}
	</div>
</section>
