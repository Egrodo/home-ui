<script lang="ts">
	import LoadingIcon from 'svelte-material-icons/Loading.svelte';
</script>

<style>
	.loading {
		height: 100%;
		width: 100%;
		background-color: var(--color-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: var(--opacity-text-secondary);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loader {
		animation: spin 1s ease-in-out infinite;
	}
</style>

<section class="loading">
	<span class="loader">
		<LoadingIcon height={150} width={150} />
	</span>
</section>
