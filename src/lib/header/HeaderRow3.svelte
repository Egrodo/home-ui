<script lang="ts">
	import HourlyTempGraph from './HourlyTempGraph.svelte';
	import AirQuality from './AirQuality.svelte';
</script>

<style>
	/* Columns mirror HeaderRow2 (1fr 200px 220px) so the temp graph lines up with
	   the calendar above and the air panel sits under the weather blocks. */
	.row {
		height: 100%;
		border-top: 1px solid var(--color-border);
		display: grid;
		grid-template-columns: 1fr 420px;
		overflow: hidden;
	}

	.graph-cell {
		padding: 10px 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow: hidden;
	}

	.section-label {
		font-size: var(--text-caption);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
	}

	.sparkline-track {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
</style>

<div class="row">
	<div class="graph-cell">
		<span class="section-label">Temp Graph</span>
		<div class="sparkline-track">
			<HourlyTempGraph />
		</div>
	</div>
	<AirQuality />
</div>
