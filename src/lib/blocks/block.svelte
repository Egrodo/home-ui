<script lang="ts">
	export let backgroundColor: string;
	export let fontColor: string;
	export let flexGrow: boolean = false;
	export let onClick: (() => void) | null = null;
	export let toggle: boolean = false; // Whether to style this block as a toggle switch
	import PowerStandbyIcon from 'svelte-material-icons/PowerStandby.svelte';
</script>

<style>
	.block {
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
	style="--background-color:{backgroundColor}; --fontColor: {fontColor};"
	role={onClick ? 'button' : 'none'}
	on:click={onClick}
>
	{#if toggle}
		<div class="toggleIconContainer"><PowerStandbyIcon height="2em" width="2em" /></div>
	{/if}
	<slot />
</div>
