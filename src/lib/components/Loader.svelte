<script lang="ts">
	import LoadingIcon from 'svelte-material-icons/Loading.svelte';
</script>

<style>
	.loading {
		height: 100%;
		width: 100%;
		background-color: var(--page-background);
		color: var(--page-light-font-color);

		display: flex;
		align-items: center;
		justify-content: center;
	}

	@keyframes loading-animation {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.loader {
		animation: ease-in-out loading-animation 1s infinite;
	}
</style>

<section class="loading">
	<span class="loader">
		<LoadingIcon height={150} width={150} />
	</span>
</section>
