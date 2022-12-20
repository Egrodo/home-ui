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
</style>

<div
	class={`block ${$$props.class || ''}`}
	style="--background-color:{backgroundColor}; --fontColor: {fontColor}; flex-grow: {flexGrow
		? 1
		: 0};"
>
	<slot />
</div>
