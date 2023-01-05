<script lang="ts">
	// TODO:
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
	.sliderTrack {
		width: 100%;
		height: 50px;
		background: linear-gradient(to-right, #5d6387, white);
		position: relative;
	}
	.sliderThumb {
		position: absolute;
		top: 0;
		left: 0;
		width: 50px;
		height: 50px;
		border: 2px solid black;
		background-color: white;
	}
</style>

<div class="container">
	<h2>Brightness</h2>
	<div class="sliderTrack">
		<div class="sliderThumb" />
	</div>
</div>
