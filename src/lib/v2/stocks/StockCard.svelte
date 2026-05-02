<script lang="ts">
	export let ticker: string;
	export let price: number;
	export let change: number; // absolute
	export let changePercent: number;
	export let sparkline: number[]; // normalized 0–1

	$: isUp = change >= 0;
	$: sign = isUp ? '+' : '';

	// Build SVG polyline points from normalized values
	$: points = sparkline
		.map((v, i) => {
			const x = (i / (sparkline.length - 1)) * 100;
			const y = (1 - v) * 32 + 4; // 4px top padding, 32px range within 40px height
			return `${x},${y}`;
		})
		.join(' ');
</script>

<style>
	.card {
		display: flex;
		flex-direction: column;
		padding: 12px 14px 10px;
		border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
		border-radius: 12px;
		gap: 4px;
		min-height: 90px;
		position: relative;
		overflow: hidden;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.ticker {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.05em;
		opacity: 0.9;
	}

	.price {
		font-size: 13px;
		font-weight: 500;
		opacity: 0.85;
	}

	.change {
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.change.up {
		color: #4caf7d;
	}

	.change.down {
		color: #e05c5c;
	}

	.sparkline {
		margin-top: auto;
		width: 100%;
		height: 40px;
		overflow: visible;
	}

	polyline {
		fill: none;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	polyline.up {
		stroke: #4caf7d;
	}

	polyline.down {
		stroke: #e05c5c;
	}
</style>

<div class="card">
	<div class="top-row">
		<span class="ticker">{ticker}</span>
		<span class="price">${price.toFixed(2)}</span>
	</div>
	<span class="change" class:up={isUp} class:down={!isUp}>
		{sign}{change.toFixed(2)} ({sign}{changePercent.toFixed(2)}%)
	</span>
	<svg class="sparkline" viewBox="0 0 100 40" preserveAspectRatio="none">
		<polyline class:up={isUp} class:down={!isUp} {points} />
	</svg>
</div>
