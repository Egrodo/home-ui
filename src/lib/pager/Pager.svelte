<script lang="ts">
	import { onMount } from 'svelte';
	import { currentPageStore } from './pagerStore';
	import PageDots from './PageDots.svelte';

	let scroller: HTMLDivElement;

	onMount(() => {
		// Fresh mount (initial load or reconnect) always starts on page 1.
		scroller.scrollLeft = 0;
		currentPageStore.set(0);

		// Chrome 129+. Fires DURING the drag whenever the pending snap target
		// changes (crossing ~50% visibility, or fling intent) — drives the dots live.
		const onSnapChanging = (e: Event) => {
			const target = (e as unknown as { snapTargetInline: Element | null }).snapTargetInline;
			if (!target) return;
			const idx = Array.prototype.indexOf.call(scroller.children, target);
			if (idx >= 0) currentPageStore.set(idx);
		};
		// Authoritative settled state; also covers any programmatic scroll.
		const onScrollEnd = () => {
			currentPageStore.set(Math.round(scroller.scrollLeft / scroller.clientWidth));
		};

		scroller.addEventListener('scrollsnapchanging', onSnapChanging);
		scroller.addEventListener('scrollend', onScrollEnd);
		return () => {
			scroller.removeEventListener('scrollsnapchanging', onSnapChanging);
			scroller.removeEventListener('scrollend', onScrollEnd);
		};
	});
</script>

<style>
	.frame {
		/* Anchors the dots overlay. */
		position: relative;
		width: 100%;
		height: 100%;
	}

	.pager {
		width: 100%;
		height: 100%;
		/* The flex row IS the track; no inner track div needed. */
		display: flex;
		overflow-x: auto;
		overflow-y: hidden;
		/* Can never rest between pages. */
		scroll-snap-type: x mandatory;
		/* No rubber-band past edges, no Chrome edge-swipe navigation. */
		overscroll-behavior-x: contain;
		/* Modern standard prop; Chrome 121+ — no ::-webkit-scrollbar needed. */
		scrollbar-width: none;
	}

	.page {
		/* Exactly one snap-port wide; no shrink from content. */
		flex: 0 0 100%;
		height: 100%;
		scroll-snap-align: start;
		position: relative;
		/* Content can never widen the track. */
		overflow: hidden;
		/* Isolates each page's layout/paint; also makes each page a stacking
		   context, confining LightDrawer's z-index to page 1. */
		contain: layout paint;
	}
</style>

<div class="frame">
	<div class="pager" bind:this={scroller}>
		<div class="page"><slot name="page1" /></div>
		<div class="page"><slot name="page2" /></div>
	</div>
	<PageDots />
</div>
