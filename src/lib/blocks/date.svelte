<script>
	import { onMount } from "svelte";
	import Block from "./block.svelte";

    const backgroundColor = '#FFE792'; // warm-yellow
    const fontColor = '#000'; // black

    let date = new Date();

    $: dayNum = date.getDate();
    $: dayWord = date.toLocaleDateString('en-US', { weekday: 'long' });

    onMount(() => {
        const interval = setInterval(() => date = new Date(), 1000);

	  return () => clearInterval(interval);
	});
</script>
<style>
    h1 {
        font-size: 3em;
        font-weight: 600;
        margin: 0;
        letter-spacing: 1px;
        
    }
    
    h2 {
        font-size: 1.5em;
        font-weight: 600;
        margin: 0.25em 0 0 0;
    }
</style>

<div class="dateBlock">
 
</div>

<Block fontColor="{fontColor}" backgroundColor="{backgroundColor}">
    <h1>
        {dayNum}
    </h1>
    <h2>
        {dayWord}
    </h2>
</Block>