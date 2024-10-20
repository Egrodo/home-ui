<script lang="ts">
	import type { AppConnections } from '$lib/data/types';
	import TennisIcon from 'svelte-material-icons/Tennis.svelte';
	import Block from './block.svelte';
	const backgroundColor = '#FFEDD8';
	const fontColor = '#000';
</script>

<style>
	a {
		text-decoration: none;
	}
	h2 {
		font-size: 1.5em;
		font-weight: 600;
		margin: 0.25em 0 0 0;
	}
</style>

<a href="/pong">
	<Block {fontColor} {backgroundColor}>
		<TennisIcon height="8em" width="8em" />
		<h2>Want to play a game?</h2>
	</Block>
</a>
