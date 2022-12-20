<script>
	import { onMount } from 'svelte';
	import Block from './block.svelte';

	const backgroundColor = '#1F212E'; // dark-background
	const fontColor = '#ffffff'; // white

	let date = new Date();

	$: hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
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

<Block {fontColor} {backgroundColor} flexGrow>
	<h1>
		{hour}:{minute}
	</h1>
	<h2>
		{amPm}
	</h2>
</Block>
