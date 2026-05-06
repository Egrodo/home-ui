<script lang="ts">
	import HourlyTempGraph from './HourlyTempGraph.svelte';
</script>

<style>
	.row {
		height: 100%;
		padding: 10px 20px;
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 6px;
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
	<span class="section-label">Temp Graph</span>
	<div class="sparkline-track">
		<HourlyTempGraph />
	</div>
</div>
