<script lang="ts">
	import { calendarStore, weatherStore } from '../data/backendStores';
	import { showFahrenheitStore } from '../data/stores';
	import { getIcon } from '../utils/getIcon';
	import type { WeatherStates } from '../data/types';

	interface ForecastEntry {
		condition: WeatherStates;
		datetime: string;
		temperature: number;
		templow?: number;
	}

	function toFahrenheit(temp: number, unit: string): number {
		return unit === '°C' ? (temp * 9) / 5 + 32 : temp;
	}

	function tempColor(temp: number, unit: string): string {
		const f = toFahrenheit(temp, unit);
		const cold = { r: 30, g: 74, b: 140 };
		const mid = { r: 200, g: 120, b: 48 };
		const hot = { r: 140, g: 30, b: 30 };

		let r: number, g: number, b: number;
		if (f <= 40) {
			({ r, g, b } = cold);
		} else if (f <= 65) {
			const t = (f - 40) / 25;
			r = Math.round(cold.r + t * (mid.r - cold.r));
			g = Math.round(cold.g + t * (mid.g - cold.g));
			b = Math.round(cold.b + t * (mid.b - cold.b));
		} else if (f <= 90) {
			const t = (f - 65) / 25;
			r = Math.round(mid.r + t * (hot.r - mid.r));
			g = Math.round(mid.g + t * (hot.g - mid.g));
			b = Math.round(mid.b + t * (hot.b - mid.b));
		} else {
			({ r, g, b } = hot);
		}
		return `rgb(${r}, ${g}, ${b})`;
	}

	function getDayLabel(datetime: string): string {
		const d = new Date(datetime);
		const today = new Date();
		if (d.toDateString() === today.toDateString()) return 'Today';
		return d.toLocaleDateString('en-US', { weekday: 'short' });
	}

	function getDailyForecasts(forecast: ForecastEntry[]): ForecastEntry[] {
		const seen = new Set<string>();
		const daily: ForecastEntry[] = [];
		for (const entry of forecast) {
			const date = entry.datetime.slice(0, 10);
			if (!seen.has(date)) {
				seen.add(date);
				daily.push(entry);
			}
		}
		return daily;
	}

	$: showFahrenheit = $showFahrenheitStore;

	function displayTemp(temp: number): string {
		if (showFahrenheit && unit === '°C') return Math.round((temp * 9) / 5 + 32) + '°F';
		if (!showFahrenheit && unit === '°F') return Math.round(((temp - 32) * 5) / 9) + '°C';
		return Math.round(temp) + unit;
	}

	function formatEventTime(iso: string | undefined): string {
		if (!iso) return '';
		const d = new Date(iso);
		const h = d.getHours();
		const m = d.getMinutes();
		const ampm = h >= 12 ? 'pm' : 'am';
		const hour = h % 12 || 12;
		return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
	}

	function isAllDay(event: { start: string }): boolean {
		return !event.start.includes('T');
	}

	$: weather = $weatherStore;
	$: unit = weather?.attributes.temperature_unit ?? '°F';
	$: dailyForecast = weather ? getDailyForecasts(weather.attributes.forecast ?? []) : [];
	$: events = $calendarStore;
</script>

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
		border: 1px solid var(--color-border);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 0 10px;
		gap: 8px;
		overflow: hidden;
	}

	.agenda-time {
		font-size: var(--text-xs);
		letter-spacing: 0.04em;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
		width: 56px;
	}

	.agenda-title {
		font-size: var(--text-xs);
		opacity: var(--opacity-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.agenda-empty {
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		padding-top: 4px;
	}

	/* Current weather */
	.current-block {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		margin-top: 8px;
	}

	.current-temp {
		font-size: var(--text-lg);
		font-weight: var(--font-weight-normal);
		line-height: 1;
		opacity: var(--opacity-text-secondary);
		background: none;
		border: none;
		padding: 0;
		color: inherit;
		font-family: inherit;
		cursor: pointer;
	}

	.current-condition {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}

	.current-humidity {
		font-size: var(--text-xs);
		opacity: var(--opacity-text-muted);
		margin-top: 2px;
	}

	/* Forecast */
	.forecast-days {
		max-height: 120px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 8px;
	}

	.forecast-days::-webkit-scrollbar {
		display: none;
	}

	.forecast-day {
		height: 36px;
		flex-shrink: 0;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		padding: 0 10px;
		gap: 8px;
	}

	.forecast-day-label {
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-secondary);
		width: 36px;
		flex-shrink: 0;
	}

	.forecast-day-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.forecast-day-temps {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-xs);
	}

	.temp-high {
		font-weight: var(--font-weight-medium);
		opacity: var(--opacity-text-primary);
	}

	.temp-sep {
		opacity: var(--opacity-text-muted);
	}

	.temp-low {
		opacity: var(--opacity-text-muted);
	}

	.section-label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
	}

	.placeholder-block {
		flex: 1;
		border-radius: var(--radius-sm);
		border: 1.5px dashed var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 8px;
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
			{#if events.length === 0}
				<div class="agenda-empty">No events</div>
			{:else}
				{#each events as event}
					<div class="agenda-item">
						<span class="agenda-time">
							{#if isAllDay(event)}
								All day
							{:else}
								{formatEventTime(event.start)}
							{/if}
						</span>
						<span class="agenda-title">{event.summary}</span>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Center: current conditions -->
	<div class="current-weather">
		<span class="section-label">Now</span>
		{#if weather}
			<div class="current-block">
				{#await getIcon(weather.state)}
					<div style="width:48px;height:48px;"></div>
				{:then Icon}
					<svelte:component
						this={Icon}
						size="48"
						color={tempColor(weather.attributes.temperature, unit)}
					/>
				{/await}
				<button class="current-temp" on:click={() => showFahrenheitStore.update((v) => !v)}>
					{displayTemp(weather.attributes.temperature)}
				</button>
				<span class="current-condition">{weather.state.replace(/-/g, ' ')}</span>
				<span class="current-humidity">{weather.attributes.humidity}% humidity</span>
			</div>
		{:else}
			<div class="placeholder-block">
				<span class="p-tiny">Loading…</span>
			</div>
		{/if}
	</div>

	<!-- Right: 3-day forecast -->
	<div class="forecast">
		<span class="section-label">Forecast</span>
		{#if dailyForecast.length > 0}
			<div class="forecast-days">
				{#each dailyForecast as day}
					<div class="forecast-day">
						<span class="forecast-day-label">{getDayLabel(day.datetime)}</span>
						<span class="forecast-day-icon">
							{#await getIcon(day.condition)}
								<div style="width:20px;height:20px;"></div>
							{:then Icon}
								<svelte:component this={Icon} size="20" color={tempColor(day.temperature, unit)} />
							{/await}
						</span>
						<div class="forecast-day-temps">
							<span class="temp-high">{displayTemp(day.temperature)}</span>
							{#if day.templow != null}
								<span class="temp-sep">–</span>
								<span class="temp-low">{displayTemp(day.templow)}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="forecast-days">
				<div class="forecast-day"><span class="p-tiny">Day 1</span></div>
				<div class="forecast-day"><span class="p-tiny">Day 2</span></div>
				<div class="forecast-day"><span class="p-tiny">Day 3</span></div>
			</div>
		{/if}
	</div>
</div>
