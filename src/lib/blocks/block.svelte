<script lang="ts">
	export let backgroundColor: string;
	export let borderColor: string = 'transparent';
	export let fontColor: string;
	export let flexGrow: boolean = false;
	export let onClick: (() => void) | null = null;
	export let onHold: (() => void) | null = null;
	export let toggle: boolean = false; // Whether to style this block as a toggle switch

	import PowerStandbyIcon from 'svelte-material-icons/PowerStandby.svelte';

	let holdTimeout: NodeJS.Timeout | null = null;
	function startHold() {
		if (onHold) {
			holdTimeout = setTimeout(onHold, 1000);
		}
	}

	function endHold() {
		if (holdTimeout) {
			clearTimeout(holdTimeout);
			holdTimeout = null;
		}
	}
</script>

<style>
	.block {
		border: 3px solid var(--block-border-color);
		border-radius: var(--block-border-radius);
		background: var(--background-color);
		color: var(--fontColor);
		text-align: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		aspect-ratio: 1 / 1.1; /* Make height 10% taller than width */
		position: relative;
	}
	.flexGrow {
		flex-grow: 1;
		flex-basis: 0;
	}
	.toggleIconContainer {
		position: absolute;
		top: 0.5em;
		right: 1em;
	}
</style>

<div
	class={`block ${$$props.class || ''}`}
	class:flexGrow
	style="--background-color: {backgroundColor}; --block-border-color: {borderColor}; --fontColor: {fontColor};"
	role={onClick ? 'button' : 'none'}
	on:click={onClick}
	on:touchstart={startHold}
	on:touchend={endHold}
>
	{#if toggle}
		<div class="toggleIconContainer"><PowerStandbyIcon height="2em" width="2em" /></div>
	{/if}
	<slot />
</div>
