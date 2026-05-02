<script lang="ts">
	import ReturnIcon from 'svelte-material-icons/KeyboardReturn.svelte';

	export let onBack: () => void;
</script>

<style>
	.backBtn {
		position: absolute;
		z-index: 100;
		top: 0;
		left: 0;
		height: 8em;
		width: 8em;
		padding-top: 1em;
	}
</style>

<button class="backBtn" on:click={onBack}>
	<ReturnIcon height={64} width={64} />
</button>
