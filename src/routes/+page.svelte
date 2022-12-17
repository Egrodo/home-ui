<script lang="ts">
	import LeftDrawer from "$lib/drawers/left.svelte";


    let rightDrawerOpen: boolean = false;
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');

    :global(*) {
        font-family: 'Open Sans', sans-serif;
    }
    
    :global(body) {
        /* Page size globals */
        --page-background: #0C0D16;
        --page-height: 768px;
        --page-width: 1366px;

        /* Block globals */
        --block-border-radius: 32px;
        --block-padding: 38px;
        
        height: var(--page-height);
        width: var(--page-width);
        margin: 0;
    }

    .container {
        background-color: var(--page-background);
        height: 100%;
        width: 100%;
        display: flex;
    }

    .mainDrawer {
        width: auto;
        flex-grow: 1
    }
    .rightDrawer {
        width: 417px;
        transition: width 0.3s ease-out;
    }
    .rightDrawer.closed {
        width: 0px;
    }

</style>

<div class="container">
    <LeftDrawer />
    <section class="mainDrawer">
    </section>
    <section class="rightDrawer{rightDrawerOpen === false ? ' closed' : ''}">

    </section>
</div>
