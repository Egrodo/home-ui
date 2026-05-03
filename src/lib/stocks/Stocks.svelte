<script lang="ts">
	import StockCard from './StockCard.svelte';

	const stocks = [
		{
			ticker: 'AAPL',
			price: 213.49,
			change: 2.31,
			changePercent: 1.09,
			sparkline: [0.4, 0.38, 0.42, 0.36, 0.45, 0.5, 0.48, 0.55, 0.6, 0.58, 0.65, 0.7]
		},
		{
			ticker: 'TSLA',
			price: 174.12,
			change: -3.88,
			changePercent: -2.18,
			sparkline: [0.7, 0.65, 0.68, 0.6, 0.55, 0.52, 0.5, 0.45, 0.42, 0.4, 0.38, 0.35]
		},
		{
			ticker: 'NVDA',
			price: 875.4,
			change: 14.2,
			changePercent: 1.65,
			sparkline: [0.3, 0.35, 0.32, 0.4, 0.45, 0.5, 0.55, 0.6, 0.58, 0.65, 0.72, 0.78]
		},
		{
			ticker: 'MSFT',
			price: 418.76,
			change: -1.24,
			changePercent: -0.3,
			sparkline: [0.6, 0.62, 0.58, 0.55, 0.57, 0.54, 0.5, 0.52, 0.48, 0.45, 0.47, 0.44]
		},
		{
			ticker: 'GOOGL',
			price: 172.38,
			change: 0.94,
			changePercent: 0.55,
			sparkline: [0.45, 0.47, 0.44, 0.48, 0.5, 0.49, 0.52, 0.54, 0.53, 0.56, 0.55, 0.58]
		},
		{
			ticker: 'AMZN',
			price: 198.02,
			change: -4.11,
			changePercent: -2.03,
			sparkline: [0.75, 0.7, 0.72, 0.65, 0.62, 0.58, 0.55, 0.52, 0.5, 0.48, 0.45, 0.42]
		},
		{
			ticker: 'META',
			price: 524.67,
			change: 8.43,
			changePercent: 1.63,
			sparkline: [0.35, 0.38, 0.4, 0.42, 0.45, 0.5, 0.52, 0.56, 0.6, 0.63, 0.68, 0.72]
		},
		{
			ticker: 'SPY',
			price: 537.21,
			change: 1.78,
			changePercent: 0.33,
			sparkline: [0.5, 0.48, 0.52, 0.5, 0.53, 0.55, 0.54, 0.57, 0.56, 0.58, 0.6, 0.62]
		}
	];
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
