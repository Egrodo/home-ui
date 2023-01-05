<script lang="ts">
	import Slider from './slider.svelte';

	let percentage: number = 0;
	function handleChange(newPercentage: number) {
		console.log(percentage);
		percentage = newPercentage;
	}
</script>

<style>
	.container {
		width: 100%;
		margin-top: 1em;
	}
	.container > h2 {
		font-size: 1.2em;
		text-align: center;
		font-weight: 600;
		margin-top: 0.25em;
		color: white;
	}
</style>

<div class="container">
	<h2>Brightness</h2>
	<Slider background="linear-gradient(to right, #5d6387, white)" onChange={handleChange} />
</div>
