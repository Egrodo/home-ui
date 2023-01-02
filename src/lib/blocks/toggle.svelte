<script lang="ts">
	import Block from './block.svelte';
	import ToggleSwitchIcon from 'svelte-material-icons/ToggleSwitchOutline.svelte';
</script>

<style>
</style>

<Block {fontColor} {backgroundColor} flexGrow>
	<ToggleSwitchIcon />
	<h2>All Devices On</h2>
</Block>
