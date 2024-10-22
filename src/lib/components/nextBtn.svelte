<script lang="ts">
	import ReturnIcon from 'svelte-material-icons/KeyboardReturn.svelte';

	export let onNext: () => void;
</script>

<style>
	.nextBtn {
		position: absolute;
		bottom: 0;
		right: 0;
		height: 8em;
		width: 8em;
		padding-top: 1em;
		transform: scaleX(-1);
	}
</style>

<button class="nextBtn" on:click={onNext}>
	<ReturnIcon height={64} width={64} />
</button>
