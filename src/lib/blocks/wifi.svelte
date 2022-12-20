<script>
	import WifiQrSrc from '$lib/assets/wifi_qr.png';
	import Block from './block.svelte';
	const backgroundColor = '#fff'; // warm-yellow
	const fontColor = '#000'; // black
	const height = '10em';
</script>

<style>
	:global(.wifiBlock) {
		align-items: center;
	}

	.image {
		width: 80%;
		height: 80%;
	}
</style>

<Block {fontColor} {backgroundColor} {height} class="wifiBlock">
	<img src={WifiQrSrc} class="image" alt="WiFi QR Code" />
</Block>
