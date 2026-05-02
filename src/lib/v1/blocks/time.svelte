<script lang="ts">
	import { onMount } from 'svelte';
	import Block from './block.svelte';

	const backgroundColor = '#1F212E'; // dark-background
	const fontColor = '#ffffff'; // white

	let date = new Date();
	let timeType: '12' | '24' = '12';

	function getReadableHour(date: Date, innerTimeType: '12' | '24') {
		const hour = date.getHours();
		if (innerTimeType === '12') {
			return hour > 12 ? hour - 12 : hour;
		}
		return hour;
	}

	function toggleTimeType() {
		timeType = timeType === '12' ? '24' : '12';
	}

	$: hour = getReadableHour(date, timeType);
	$: minute = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
	$: amPm = date.getHours() >= 12 ? 'PM' : 'AM';

	onMount(() => {
		const interval = setInterval(() => (date = new Date()), 1000);

		return () => clearInterval(interval);
	});
</script>

<style>
	h1 {
		font-size: 3em;
		font-weight: 600;
		margin: 0;
		letter-spacing: 1px;
	}

	h2 {
		font-size: 1.5em;
		font-weight: 600;
		margin: 0.25em 0 0 0;
	}
</style>

<Block {fontColor} {backgroundColor} flexGrow onClick={toggleTimeType}>
	<h1>
		{hour}:{minute}
	</h1>
	<h2>
		{amPm}
	</h2>
</Block>
