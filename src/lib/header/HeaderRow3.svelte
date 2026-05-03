<style>
	.row {
		height: 100%;
		padding: 10px 28px;
		border-top: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.section-label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
	}

	/* Full-width canvas area for the sparkline */
	.sparkline-track {
		flex: 1;
		border-radius: var(--radius-sm);
		border: 1.5px dashed var(--color-border);
		position: relative;
		overflow: hidden;
	}

	/* Hour tick labels pinned to the bottom */
	.hour-ticks {
		position: absolute;
		inset: auto 12px 4px;
		display: flex;
		justify-content: space-between;
	}

	.tick {
		font-size: var(--text-xs);
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="row">
	<span class="section-label">Hourly</span>
	<!-- Temperature curve + sunset marker + rain bars -->
	<div class="sparkline-track">
		<div class="hour-ticks">
			{#each Array(13) as _, i}
				<span class="tick">{i}h</span>
			{/each}
		</div>
	</div>
</div>
