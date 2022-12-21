<script lang="ts">
	export let backgroundColor: string;
	export let fontColor: string;
	export let flexGrow: boolean = false;
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
		aspect-ratio: 1 / 1.1; /* Make height 10% taller than width */
	}
	.flexGrow {
		flex-grow: 1;
		flex-basis: 0;
	}
</style>

<div
	class={`block ${$$props.class || ''}`}
	class:flexGrow
	style="--background-color:{backgroundColor}; --fontColor: {fontColor};"
>
	<slot />
</div>
