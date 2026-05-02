<style>
	.row {
		height: 100%;
		padding: 10px 28px;
		border-top: 1px solid currentColor;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.section-label {
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.25;
		flex-shrink: 0;
	}

	/* Full-width canvas area for the sparkline */
	.sparkline-track {
		flex: 1;
		border-radius: 6px;
		border: 1.5px dashed currentColor;
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
		font-size: 9px;
		opacity: 0.2;
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
