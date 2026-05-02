<script lang="ts">
	export let background: string;
	export let onChange: (percentage: number) => void;
	export let initialPercent: number;

	let percentage = initialPercent;
	$: {
		percentage = initialPercent;
	}

	let sliderThumb: HTMLElement;
	let sliderTrack: HTMLElement;

	function triggerPercentageChange(touchPos: number) {
		// Determine what percentage of the slider track the touch is at
		const trackStart = sliderTrack.getBoundingClientRect().left + sliderThumb.offsetWidth / 2;
		const trackEnd = trackStart + sliderTrack.offsetWidth - sliderThumb.offsetWidth;

		const overflowingPercentage = (touchPos - trackStart) / (trackEnd - trackStart);

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

	function animateChange() {
		// By adding a transition to left we can smoothly animate change in slider position from light update
		if (sliderThumb) sliderThumb.style.transition = 'left 0.2s ease';
		window.setTimeout(() => {
			if (sliderThumb) sliderThumb.style.transition = '';
		}, 200);
	}

	function handleThumbTouchMove(event: TouchEvent) {
		triggerPercentageChange(event.touches[0].clientX);
	}

	function handleTrackTouch(event: TouchEvent) {
		const touchPos = event.touches[0].clientX;

		// We don't want to animate the change if the user is clicking on the
		// thumb itself
		const thumbStart = sliderThumb.getBoundingClientRect().left;
		const thumbEnd = thumbStart + sliderThumb.offsetWidth;
		if (touchPos < thumbStart || touchPos > thumbEnd) {
			animateChange();
		}

		triggerPercentageChange(touchPos);
	}

	$: {
		if (initialPercent === percentage) {
			animateChange();
		}
	}

	$: {
		if (sliderThumb && sliderTrack) {
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
	on:touchstart={handleTrackTouch}
	on:touchmove={handleThumbTouchMove}
>
	<div
		bind:this={sliderThumb}
		class="sliderThumb"
		style="left: 0; transition: left 0.2s ease"
		on:touchmove={handleThumbTouchMove}
	/>
</div>
