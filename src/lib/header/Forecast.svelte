<script lang="ts">
	import { weatherStore } from '../data/backendStores';
	import { showFahrenheitStore } from '../data/stores';
	import { getIconKey } from '../utils/getIcon';
	import { displayTemp } from '../utils/temperature';
	import { tempColor } from '../utils/tempColor';
	import MdiIcon from '../utils/MdiIcon.svelte';
	import type { WeatherStates } from '../data/types';

	interface ForecastEntry {
		condition: WeatherStates;
		datetime: string;
		temperature: number;
		templow?: number;
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

	$: weather = $weatherStore;
	$: unit = weather?.attributes.temperature_unit ?? '°F';
	$: showFahrenheit = $showFahrenheitStore;
	$: dailyForecast = weather ? getDailyForecasts(weather.attributes.forecast ?? []) : [];
</script>

<style>
	.forecast {
		display: flex;
		flex-direction: column;
		padding: 14px 20px;
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

	.forecast-days {
		max-height: 120px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 8px;
		touch-action: pan-y;
		cursor: grab;
		user-select: none;
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
		font-size: var(--text-caption);
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
		font-size: var(--text-caption);
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

	.p-tiny {
		font-size: var(--text-caption);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="forecast">
	<span class="section-label">Forecast</span>
	{#if dailyForecast.length > 0}
		<div
			class="forecast-days"
			on:pointerdown={(e) => {
				const el = e.currentTarget;
				const startY = e.clientY;
				const startTop = el.scrollTop;
				el.setPointerCapture(e.pointerId);
				const onMove = (ev: PointerEvent) => {
					el.scrollTop = startTop - (ev.clientY - startY);
				};
				const onUp = () => {
					el.removeEventListener('pointermove', onMove);
					el.removeEventListener('pointerup', onUp);
				};
				el.addEventListener('pointermove', onMove);
				el.addEventListener('pointerup', onUp);
			}}
		>
			{#each dailyForecast as day}
				<div class="forecast-day">
					<span class="forecast-day-label">{getDayLabel(day.datetime)}</span>
					<span class="forecast-day-icon">
						<MdiIcon
							name={getIconKey(day.condition)}
							size="20"
							color={tempColor(day.temperature, unit)}
						/>
					</span>
					<div class="forecast-day-temps">
						<span class="temp-high">{displayTemp(day.temperature, unit, showFahrenheit)}</span>
						{#if day.templow != null}
							<span class="temp-sep">–</span>
							<span class="temp-low">{displayTemp(day.templow, unit, showFahrenheit)}</span>
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
