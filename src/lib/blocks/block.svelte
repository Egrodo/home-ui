<script lang="ts">
	export let backgroundColor: string;
	export let fontColor: string;
</script>

<style>
	.block {
		border-radius: var(--block-border-radius);
		background: var(--background-color);
		color: var(--fontColor);
		text-align: center;
		overflow: hidden;
		width: 100%;
		max-height: 18em;
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		justify-content: center;
		aspect-ratio: 1 / 1.1; /* Make height 10% taller than width */
		align-self: stretch;
	}
</style>

<div
	class={`${$$props.class || ''} block`}
	style="--background-color:{backgroundColor}; --fontColor: {fontColor};"
>
	<slot />
</div>
