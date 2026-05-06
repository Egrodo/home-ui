<script lang="ts">
	import CalendarPanel from './CalendarPanel.svelte';
	import TodayWeather from './TodayWeather.svelte';
	import Forecast from './Forecast.svelte';
</script>

<style>
	.row {
		display: grid;
		grid-template-columns: 1fr 200px 220px;
		height: 200px;
		border-top: 1px solid var(--color-border);
	}
</style>

<div class="row">
	<CalendarPanel />
	<TodayWeather />
	<Forecast />
</div>
