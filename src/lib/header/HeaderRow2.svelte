<style>
	.row {
		display: grid;
		grid-template-columns: 1fr 200px 220px;
		height: 100%;
		border-top: 1px solid var(--color-border);
	}

	.calendar,
	.current-weather,
	.forecast {
		display: flex;
		flex-direction: column;
		padding: 14px 20px;
		overflow: hidden;
	}

	.current-weather,
	.forecast {
		border-left: 1px solid var(--color-border);
	}

	/* Agenda scroll */
	.agenda-scroll {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}

	.agenda-scroll::-webkit-scrollbar {
		display: none;
	}

	.agenda-item {
		height: 32px;
		border-radius: var(--radius-sm);
		border: 1.5px dashed var(--color-border);
		flex-shrink: 0;
	}

	/* Current weather: single centered block */
	.current-block {
		flex: 1;
		border-radius: var(--radius-sm);
		border: 1.5px dashed var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 8px;
	}

	/* 3-day forecast: vertical stack of day rows */
	.forecast-days {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 8px;
	}

	.forecast-day {
		flex: 1;
		border-radius: var(--radius-sm);
		border: 1.5px dashed var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.section-label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
	}

	.p-tiny {
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="row">
	<!-- Left: scrolling agenda -->
	<div class="calendar">
		<span class="section-label">Today</span>
		<div class="agenda-scroll">
			<div class="agenda-item"></div>
			<div class="agenda-item"></div>
			<div class="agenda-item"></div>
			<div class="agenda-item"></div>
		</div>
	</div>

	<!-- Center: current conditions -->
	<div class="current-weather">
		<span class="section-label">Now</span>
		<div class="current-block">
			<span class="p-tiny">Temp · Condition</span>
		</div>
	</div>

	<!-- Right: 3-day forecast -->
	<div class="forecast">
		<span class="section-label">Forecast</span>
		<div class="forecast-days">
			<div class="forecast-day"><span class="p-tiny">Day 1</span></div>
			<div class="forecast-day"><span class="p-tiny">Day 2</span></div>
			<div class="forecast-day"><span class="p-tiny">Day 3</span></div>
		</div>
	</div>
</div>
