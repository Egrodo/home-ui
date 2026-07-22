<script lang="ts">
	import { onMount } from 'svelte';

	let maxTouchPoints = 0;
	let lastPointerType = '—';
	let pointerdowns = 0;
	let touchstarts = 0;
	let scrolls = 0;

	onMount(() => {
		maxTouchPoints = navigator.maxTouchPoints;

		const onPointerDown = (e: PointerEvent) => {
			lastPointerType = e.pointerType || '(empty)';
			pointerdowns++;
		};
		const onTouchStart = () => touchstarts++;
		const onScroll = () => scrolls++;

		// capture:true so we see events on any element, including the pager scroller
		window.addEventListener('pointerdown', onPointerDown, true);
		window.addEventListener('touchstart', onTouchStart, true);
		window.addEventListener('scroll', onScroll, true);
		return () => {
			window.removeEventListener('pointerdown', onPointerDown, true);
			window.removeEventListener('touchstart', onTouchStart, true);
			window.removeEventListener('scroll', onScroll, true);
		};
	});
</script>

<div class="probe">
	<div>maxTouchPoints: <b>{maxTouchPoints}</b></div>
	<div>last pointerType: <b>{lastPointerType}</b></div>
	<div>pointerdown: <b>{pointerdowns}</b></div>
	<div>touchstart: <b>{touchstarts}</b></div>
	<div>native scroll: <b>{scrolls}</b></div>
</div>

<style>
	.probe {
		position: fixed;
		top: 8px;
		left: 8px;
		z-index: 99999;
		padding: 10px 14px;
		background: rgba(0, 0, 0, 0.8);
		color: #fff;
		font-size: 20px;
		line-height: 1.5;
		border-radius: 8px;
		pointer-events: none;
		font-variant-numeric: tabular-nums;
	}
	b {
		color: #7dd3fc;
	}
</style>
