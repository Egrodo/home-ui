<script context="module" lang="ts">
	/** Total docked height, so the board can lift notes clear of the keyboard. */
	export const KEYBOARD_HEIGHT = 380;
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Keyboard from 'simple-keyboard';
	import 'simple-keyboard/build/css/index.css';

	export let value = '';
	export let onInput: (value: string) => void;
	export let onEnter: () => void;
	export let onClose: () => void;

	let container: HTMLDivElement;
	let keyboard: Keyboard | null = null;
	let layoutName: 'default' | 'shift' = 'default';

	/** Only printable ASCII reaches the field — no control chars or emoji. */
	function toAscii(input: string): string {
		return input.replace(/[^\x20-\x7e]/g, '');
	}

	// Keep simple-keyboard's internal buffer in sync when the value is changed from
	// the outside (e.g. cleared after committing an item for rapid re-entry).
	$: if (keyboard && value !== keyboard.getInput()) keyboard.setInput(value);

	function handleChange(input: string) {
		onInput(toAscii(input));
	}

	function handleKeyPress(button: string) {
		if (button === '{enter}') {
			onEnter();
			return;
		}
		if (button === '{shift}' || button === '{lock}') {
			layoutName = layoutName === 'default' ? 'shift' : 'default';
			keyboard?.setOptions({ layoutName });
			return;
		}
	}

	onMount(() => {
		keyboard = new Keyboard(container, {
			onChange: handleChange,
			onKeyPress: handleKeyPress,
			mergeDisplay: true,
			layoutName,
			layout: {
				default: [
					'q w e r t y u i o p {bksp}',
					'a s d f g h j k l {enter}',
					'{shift} z x c v b n m , .',
					'{space}'
				],
				shift: [
					'Q W E R T Y U I O P {bksp}',
					'A S D F G H J K L {enter}',
					'{shift} Z X C V B N M ! ?',
					'{space}'
				]
			},
			display: {
				'{bksp}': '←',
				'{enter}': '↵',
				'{shift}': '⇧',
				'{space}': ' '
			}
		});
		keyboard.setInput(value);
	});

	onDestroy(() => keyboard?.destroy());

	// Swallow touches so a swipe on the keyboard never reaches the pager underneath.
	function swallow(e: Event) {
		e.stopPropagation();
	}
</script>

<style>
	.keyboard-dock {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: var(--kb-height);
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.25);
		z-index: 10000;
		display: flex;
		flex-direction: column;
		/* Own the touch so dragging the keyboard never scrolls the pager underneath. */
		touch-action: none;
	}

	.dock-bar {
		display: flex;
		justify-content: flex-end;
		padding: 8px 14px;
		border-bottom: 1px solid var(--color-border);
	}

	.done-btn {
		min-width: 72px;
		height: 36px;
		padding: 0 16px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink-1);
		font-size: var(--text-body);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
	}

	.keyboard-host {
		flex: 1;
		min-height: 0;
	}

	/* simple-keyboard theming to match the app surface. */
	.keyboard-host :global(.simple-keyboard) {
		background: transparent;
		height: 100%;
		padding: 8px;
	}
	.keyboard-host :global(.hg-button) {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		color: var(--ink-1);
		font-size: var(--text-body);
		height: 56px;
	}
	.keyboard-host :global(.hg-button:active),
	.keyboard-host :global(.hg-button.hg-activeButton) {
		background: var(--color-border);
	}
</style>

<div
	class="keyboard-dock"
	style="--kb-height: {KEYBOARD_HEIGHT}px;"
	on:pointerdown={swallow}
	on:touchstart={swallow}
>
	<div class="dock-bar">
		<button class="done-btn" data-no-drag on:click={onClose}>Done</button>
	</div>
	<div class="keyboard-host" bind:this={container}></div>
</div>
