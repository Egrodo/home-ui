<script>
	import DateBlock from "$lib/blocks/date.svelte";
    import TimeBlock from "$lib/blocks/time.svelte";
</script>
<style>
    .leftDrawer {
        height: 100%;
        width: calc(var(--page-width) / 4); /* Left drawer takes up 1/4th of the width */
        display: flex;
        flex-direction: column;
    }
    .leftDrawer > h2 {
        text-align: center;
        color: white;
        margin: 1.5em 0;
        font-weight: 500;
    }
    .blockRow {
        display: flex;
        column-gap: 10px;
        align-items: center;
    }
</style>

<section class="leftDrawer">
    <h2>Noah's Domicile</h2>
    <div class="blockRow">
        <DateBlock />
        <TimeBlock/>
    </div>
</section>