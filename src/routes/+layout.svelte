<script lang="ts">
	import '$lib/styles/theme.css';
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/data/theme';
	import { sunStore } from '$lib/data/backendStores';

	// Sync the stored theme to the DOM on first render
	themeStore.set($themeStore);

	if (browser) {
		(window as any).theme = (t: 'light' | 'dark') => themeStore.set(t);
	}

	// Auto-switch theme only when sun state transitions (sunrise/sunset), not on every poll
	let prevSunState: string | null = null;
	$: if ($sunStore && $sunStore.state !== prevSunState) {
		prevSunState = $sunStore.state;
		themeStore.set($sunStore.state === 'below_horizon' ? 'dark' : 'light');
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..700,0..1,-50..200');

	:global(*) {
		font-family: 'Open Sans', sans-serif;
		box-sizing: border-box;
		user-select: none;
	}

	:global(body) {
		margin: 0;
	}

	:global(body::-webkit-scrollbar) {
		display: none;
	}
</style>

<slot />
