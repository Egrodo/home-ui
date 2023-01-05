<script lang="ts">
	export let background: string;
	export let onChange: (percentage: number) => void;
	let sliderThumb: HTMLElement;
	let sliderTrack: HTMLElement;

	let percentage: number = 0;
	let isDragging: boolean = false;
	function handleThumbTouchStart() {
		isDragging = true;
	}
	function handleThumbTouchEnd() {
		isDragging = false;
	}
	function handleThumbTouchMove(event: TouchEvent) {
		if (isDragging) {
			// Determine what percentage of the slider track the touch is at
			const trackStart = sliderTrack.getBoundingClientRect().left;
			const trackEnd = trackStart + sliderTrack.offsetWidth;
			const touchX = event.touches[0].clientX;
			let overflowingPercentage = (touchX - trackStart) / (trackEnd - trackStart);

			// If user slides far to the left or right we want to snap to edges of track
			if (overflowingPercentage <= 0) {
				sliderThumb.style.left = `0px`;
				return;
			} else if (overflowingPercentage >= 1) {
				sliderThumb.style.left = `${trackEnd - trackStart - sliderThumb.offsetWidth}px`;
				return;
			}

			// If we've verified the percentage is within bounds, set it
			percentage = overflowingPercentage;

			// Then handle the cases where user drags the thumb close enough to the edges
			// that the thumb would be partially off the track
			if (touchX - sliderThumb.offsetWidth / 2 < trackStart) {
				sliderThumb.style.left = `0px`;
				return;
			} else if (touchX + sliderThumb.offsetWidth / 2 > trackEnd) {
				sliderThumb.style.left = `${trackEnd - trackStart - sliderThumb.offsetWidth}px`;
				return;
			}

			// Otherwise, just move the thumb normally
			sliderThumb.style.left = `${touchX - trackStart - sliderThumb.offsetWidth / 2}px`;
		}
	}
	// If user clicks on the track however we want to move the thumb immediately to that position
	function handleTrackClick(event: MouseEvent) {
		const trackStart = sliderTrack.getBoundingClientRect().left;
		const trackEnd = trackStart + sliderTrack.offsetWidth;
		const touchX = event.clientX;
		percentage = (touchX - trackStart) / (trackEnd - trackStart);

		// Then handle the cases where user drags the thumb close enough to the edges
		// that the thumb would be partially off the track
		if (touchX - sliderThumb.offsetWidth / 2 < trackStart) {
			sliderThumb.style.left = `0px`;
			return;
		} else if (touchX + sliderThumb.offsetWidth / 2 > trackEnd) {
			sliderThumb.style.left = `${trackEnd - trackStart - sliderThumb.offsetWidth}px`;
			return;
		}

		// Otherwise, just move the thumb normally
		sliderThumb.style.left = `${touchX - trackStart - sliderThumb.offsetWidth / 2}px`;
	}

	$: onChange(percentage);
</script>

<style>
	.sliderTrack {
		width: 100%;
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
		style="left: 0"
		on:touchstart={handleThumbTouchStart}
		on:touchmove={handleThumbTouchMove}
		on:touchend={handleThumbTouchEnd}
	/>
</div>
