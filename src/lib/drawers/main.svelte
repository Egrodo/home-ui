<script lang="ts">
</script>

<style>
	.mainDrawer {
		height: 100%;
		flex-grow: 1;

		padding: 1.5em 2em 0 2em;
		overflow-y: auto;
	}

	.blocksContainer {
		display: flex;
		flex-direction: column;
		row-gap: 10px;
	}

	/* room select css */
	.roomSelect {
		display: flex;
		flex-direction: row;
		column-gap: 0.5em;
		padding: 0;
		margin: 0 auto;
		list-style: none;
		font-size: 2em;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.3);

		overflow-x: scroll;
		scrollbar-width: none;
	}
	.roomSelect > .selected {
		width: max-content;
		color: rgb(220, 220, 220);
	}
	.roomSelect > li {
		margin: 0 0.75em;
		flex-grow: 1;
		min-width: fit-content;
	}
</style>

<section class="mainDrawer">
	<ul class="roomSelect">
		<li class="selected">All Rooms</li>
		<li>Bedroom</li>
		<li>Living Room</li>
		<li>Office</li>
	</ul>
	<div class="blocksContainer" />
</section>
