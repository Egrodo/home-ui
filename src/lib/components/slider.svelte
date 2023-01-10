<script lang="ts">
	import { onMount } from 'svelte';

	export let background: string;
	export let onChange: (percentage: number) => void;
	export let initialPercent: number;

	let percentage = initialPercent;
	$: {
		percentage = initialPercent;
	}

	let sliderThumb: HTMLElement;
	let sliderTrack: HTMLElement;
	let isDragging: boolean = false;

	/**
	 * When the user clicks and drags, I want their mouse to be centered on the thumb. I want the range of slidability
	 * to be calculated based on trackStart + half thumb and end at trackEnd - trackThumb
	 */

	function handleThumbTouchMove(event: TouchEvent) {
		if (isDragging) {
			// Determine what percentage of the slider track the touch is at
			const trackStart = sliderTrack.getBoundingClientRect().left + sliderThumb.offsetWidth / 2;
			const trackEnd = trackStart + sliderTrack.offsetWidth - sliderThumb.offsetWidth;
			const touchX = event.touches[0].clientX;

			const overflowingPercentage = (touchX - trackStart) / (trackEnd - trackStart);

			// If user slides far to the left or right we want to snap to edges of track
			if (overflowingPercentage <= 0) {
				percentage = 0;
			} else if (overflowingPercentage >= 1) {
				percentage = 1;
			} else {
				percentage = overflowingPercentage;
			}

			onChange(percentage);
		}
	}
	// If user clicks on the track however we want to move the thumb immediately to that position
	function handleTrackClick(event: MouseEvent) {
		const trackStart = sliderTrack.getBoundingClientRect().left + sliderThumb.offsetWidth / 2;
		const trackEnd = trackStart + sliderTrack.offsetWidth - sliderThumb.offsetWidth;
		const touchX = event.clientX;

		const overflowingPercentage = (touchX - trackStart) / (trackEnd - trackStart);

		// If user slides far to the left or right we want to snap to edges of track
		if (overflowingPercentage <= 0) {
			percentage = 0;
		} else if (overflowingPercentage >= 1) {
			percentage = 1;
		} else {
			percentage = overflowingPercentage;
		}

		onChange(percentage);
	}

	$: {
		if (initialPercent === percentage) {
			if (sliderThumb) sliderThumb.style.transition = 'left 0.2s ease';
			window.setTimeout(() => {
				if (sliderThumb) sliderThumb.style.transition = '';
			}, 200);
		}
	}

	$: {
		if (sliderThumb && sliderTrack) {
			// I have need to find the percentage point between two values
			const trackStart = sliderTrack.getBoundingClientRect().left + sliderThumb.offsetWidth / 2;
			const trackEnd = trackStart + sliderTrack.offsetWidth - sliderThumb.offsetWidth;
			// Get the position of percentage between trackStart and trackEnd
			const left = (trackEnd - trackStart) * percentage;
			sliderThumb.style.left = `${left}px`;
		}
	}
</script>

<style>
	.sliderTrack {
		width: 342px; /* BUG: Because of the drawer sliding out animation changing the width of the track I have to hardset it here. This sux bc it's not responsive but wtv none of this is responsive. Maybe fix later */
		height: 50px;
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

<div
	class="sliderTrack"
	style="background: {background}"
	bind:this={sliderTrack}
	on:click={handleTrackClick}
>
	<div
		bind:this={sliderThumb}
		class="sliderThumb"
		style="left: 0; transition: left 0.2s ease"
		on:touchstart={() => (isDragging = true)}
		on:touchmove={handleThumbTouchMove}
		on:touchend={() => (isDragging = false)}
	/>
</div>
