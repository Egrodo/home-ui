<script lang="ts">
	import { weatherStore } from '../data/backendStores';
	import { showFahrenheitStore } from '../data/stores';
	import { getIconKey } from '../utils/getIcon';
	import { displayTemp } from '../utils/temperature';
	import { tempColor } from '../utils/tempColor';
	import MdiIcon from '../utils/MdiIcon.svelte';

	$: weather = $weatherStore;
	$: unit = weather?.attributes.temperature_unit ?? '°F';
	$: showFahrenheit = $showFahrenheitStore;
</script>

<style>
	.current-weather {
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
		font-size: var(--text-headline);
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
		font-size: var(--text-caption);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}

	.current-humidity {
		font-size: var(--text-caption);
		opacity: var(--opacity-text-muted);
		margin-top: 2px;
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
		font-size: var(--text-caption);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="current-weather">
	<span class="section-label">Now</span>
	{#if weather}
		<div class="current-block">
			<MdiIcon
				name={getIconKey(weather.state)}
				size="48"
				color={tempColor(weather.attributes.temperature, unit)}
			/>
			<button class="current-temp" on:click={() => showFahrenheitStore.update((v) => !v)}>
				{displayTemp(weather.attributes.temperature, unit, showFahrenheit)}
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
