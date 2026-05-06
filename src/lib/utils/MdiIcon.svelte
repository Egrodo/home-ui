<script lang="ts">
	import * as mdi from '@mdi/js';

	export let name: string;
	export let size: number | string | undefined = undefined;
	export let width: number | string | undefined = undefined;
	export let height: number | string | undefined = undefined;
	export let color: string | undefined = undefined;

	$: w = width ?? size ?? 32;
	$: h = height ?? size ?? 32;
	$: path = (mdi as Record<string, string>)[name] ?? mdi.mdiHelpRhombusOutline;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	width={w}
	height={h}
	style={color ? `color: ${color}` : undefined}
	aria-hidden="true"
>
	<path fill="currentColor" d={path} />
</svg>
