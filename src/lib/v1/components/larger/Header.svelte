<script lang="ts">
	import { onMount } from 'svelte';
	import type { ComponentType } from 'svelte';
	import { PUBLIC_HOME_NAME } from '$env/static/public';
	import { weatherStore } from '$lib/data/stores';
	import { getIcon } from '$lib/utils/getIcon';
	import { formatForecast } from '$lib/utils/formatForcast';
	import type { ForecastType } from '$lib/data/types';
	import WeatherCloudy from 'svelte-material-icons/WeatherCloudy.svelte';

	// --- Clock ---
	let date = new Date();
	let timeType: '12' | '24' = '12';

	$: hour = (() => {
		const h = date.getHours();
		return timeType === '12' ? (h % 12 || 12) : h;
	})();
	$: minute = String(date.getMinutes()).padStart(2, '0');
	$: amPm = date.getHours() >= 12 ? 'PM' : 'AM';
	$: dayWord = date.toLocaleDateString('en-US', { weekday: 'long' });
	$: dayNum = date.getDate();
	$: monthWord = date.toLocaleDateString('en-US', { month: 'long' });

	onMount(() => {
		const interval = setInterval(() => (date = new Date()), 1000);
		return () => clearInterval(interval);
	});

	// --- Weather ---
	let givenUnit: '°C' | '°F' = '°F';
	let shownUnit: '°C' | '°F' = '°F';
	let givenTemperature = 0;
	let condition = '';
	let humidity = 0;
	let forecast: ForecastType[] = [];
	let WeatherIcon: ComponentType = WeatherCloudy;
	let forecastIcons: ComponentType[] = [];

	$: shownTemperature =
		givenUnit === shownUnit
			? givenTemperature
			: givenUnit === '°C'
				? Number(((givenTemperature * 9) / 5 + 32).toFixed(1))
				: Number((((givenTemperature - 32) * 5) / 9).toFixed(1));

	weatherStore.subscribe(async (w) => {
		if (!w) return;
		givenUnit = w.attributes.temperature_unit;
		givenTemperature = w.attributes.temperature;
		condition = formatForecast(w.state);
		humidity = w.attributes.humidity;
		forecast = (w.attributes.forecast ?? []).slice(0, 3);
		WeatherIcon = await getIcon(w.state);
		forecastIcons = await Promise.all(forecast.map((f) => getIcon(f.condition)));
	});

	function formatForecastDate(datetime: string): string {
		return new Date(datetime).toLocaleDateString('en-US', { weekday: 'short' });
	}

	function formatForecastTemp(temp: number): string {
		if (givenUnit === shownUnit) return `${Math.round(temp)}`;
		return givenUnit === '°C'
			? `${Math.round((temp * 9) / 5 + 32)}`
			: `${Math.round(((temp - 32) * 5) / 9)}`;
	}
</script>

<style>
	header {
		width: 100%;
		height: 180px;
		background-color: var(--page-drawer-background);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 2.5rem;
		box-sizing: border-box;
		flex-shrink: 0;
	}

	/* --- Left: identity --- */
	.identity {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 280px;
	}
	.home-name {
		font-size: 2rem;
		font-weight: 700;
		color: var(--page-light-font-color);
		margin: 0;
	}
	.date {
		font-size: 1.1rem;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.5);
		margin: 0;
	}

	/* --- Centre: clock --- */
	.clock {
		display: flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
		user-select: none;
	}
	.clock-time {
		font-size: 4rem;
		font-weight: 700;
		color: var(--page-light-font-color);
		line-height: 1;
		letter-spacing: 2px;
	}
	.clock-ampm {
		font-size: 1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.25rem;
		letter-spacing: 2px;
	}

	/* --- Right: weather --- */
	.weather {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		min-width: 320px;
	}
	.weather-main {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.weather-icon {
		color: var(--page-light-font-color);
		opacity: 0.9;
	}
	.weather-details {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.weather-temp {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--page-light-font-color);
		cursor: pointer;
		line-height: 1;
	}
	.weather-condition {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.2rem;
	}
	.forecast-strip {
		display: flex;
		gap: 1.25rem;
	}
	.forecast-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.8rem;
	}
	.forecast-day span {
		font-weight: 600;
	}
	.forecast-temps {
		display: flex;
		gap: 0.3rem;
		font-size: 0.8rem;
	}
	.forecast-high {
		color: var(--page-light-font-color);
		font-weight: 600;
	}
	.forecast-low {
		color: rgba(255, 255, 255, 0.4);
	}
</style>

<header>
	<!-- Left: home name + date -->
	<div class="identity">
		<h1 class="home-name">{PUBLIC_HOME_NAME}</h1>
		<p class="date">{dayWord}, {monthWord} {dayNum}</p>
	</div>

	<!-- Centre: clock -->
	<div class="clock" role="button" on:click={() => (timeType = timeType === '12' ? '24' : '12')}>
		<span class="clock-time">{hour}:{minute}</span>
		{#if timeType === '12'}
			<span class="clock-ampm">{amPm}</span>
		{/if}
	</div>

	<!-- Right: weather -->
	<div class="weather">
		<div class="weather-main">
			<div class="weather-icon">
				<svelte:component this={WeatherIcon} height="3.5rem" width="3.5rem" />
			</div>
			<div class="weather-details">
				<span
					class="weather-temp"
					role="button"
					on:click={() => (shownUnit = shownUnit === '°C' ? '°F' : '°C')}
				>
					{shownTemperature}{shownUnit}
				</span>
				<span class="weather-condition">{condition} · {humidity}% humidity</span>
			</div>
		</div>
		{#if forecast.length}
			<div class="forecast-strip">
				{#each forecast as day, i}
					<div class="forecast-day">
						<span>{formatForecastDate(day.datetime)}</span>
						<svelte:component this={forecastIcons[i] ?? WeatherCloudy} height="1.4rem" width="1.4rem" />
						<div class="forecast-temps">
							<span class="forecast-high">{formatForecastTemp(day.temperature)}°</span>
							<span class="forecast-low">{formatForecastTemp(day.templow)}°</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</header>
