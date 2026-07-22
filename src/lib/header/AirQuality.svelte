<script lang="ts">
	import { airQualityStore } from '../data/backendStores';
	import { showFahrenheitStore } from '../data/stores';
	import { displayTemp } from '../utils/temperature';

	type Status = 'good' | 'fair' | 'poor' | 'none';

	const statusColor: Record<Status, string> = {
		good: 'var(--color-positive)',
		fair: 'var(--color-accent)',
		poor: 'var(--color-negative)',
		none: 'var(--ink-3)'
	};

	/** Airthings standard thresholds → status level. */
	function band(value: number, fairBelow: number, poorBelow: number): Status {
		if (value < fairBelow) return 'good';
		if (value < poorBelow) return 'fair';
		return 'poor';
	}

	function humidityStatus(value: number): Status {
		if (value >= 30 && value <= 60) return 'good';
		if (value >= 25 && value <= 70) return 'fair';
		return 'poor';
	}

	$: aq = $airQualityStore;
	$: showFahrenheit = $showFahrenheitStore;

	interface Metric {
		label: string;
		value: string;
		status: Status;
	}

	$: metrics = ((): Metric[] => {
		if (!aq) return [];
		const out: Metric[] = [];
		const push = (label: string, raw: number | null, unit: string, status: Status) => {
			out.push({
				label,
				value: raw == null ? '—' : `${Math.round(raw)}${unit}`,
				status: raw == null ? 'none' : status
			});
		};
		push('Radon', aq.radon, ' Bq/m³', aq.radon == null ? 'none' : band(aq.radon, 100, 150));
		push('CO₂', aq.co2, ' ppm', aq.co2 == null ? 'none' : band(aq.co2, 800, 1000));
		push('VOC', aq.voc, ' ppb', aq.voc == null ? 'none' : band(aq.voc, 250, 2000));
		push('PM2.5', aq.pm25, ' µg/m³', aq.pm25 == null ? 'none' : band(aq.pm25, 10, 25));
		push('Humidity', aq.humidity, '%', aq.humidity == null ? 'none' : humidityStatus(aq.humidity));
		out.push({
			label: 'Indoor',
			value: aq.temperature == null ? '—' : displayTemp(aq.temperature, '°C', showFahrenheit),
			status: 'none'
		});
		return out;
	})();
</script>

<style>
	.air {
		display: flex;
		flex-direction: column;
		padding: 10px 20px;
		overflow: hidden;
		border-left: 1px solid var(--color-border);
	}

	.section-label {
		font-size: var(--text-caption);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
	}

	.grid {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-auto-rows: 1fr;
		column-gap: 28px;
		margin-top: 8px;
	}

	.metric {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: var(--radius-pill);
		flex-shrink: 0;
	}

	.metric-label {
		font-size: var(--text-caption);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
	}

	.metric-value {
		margin-left: auto;
		font-size: var(--text-caption);
		opacity: var(--opacity-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.placeholder {
		flex: 1;
		border-radius: var(--radius-sm);
		border: 1.5px dashed var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 8px;
	}

	.p-tiny {
		font-size: var(--text-caption);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="air">
	<span class="section-label">Indoor Air</span>
	{#if metrics.length}
		<div class="grid">
			{#each metrics as metric}
				<div class="metric">
					<span class="dot" style="background: {statusColor[metric.status]}"></span>
					<span class="metric-label">{metric.label}</span>
					<span class="metric-value">{metric.value}</span>
				</div>
			{/each}
		</div>
	{:else}
		<div class="placeholder">
			<span class="p-tiny">Loading…</span>
		</div>
	{/if}
</div>
