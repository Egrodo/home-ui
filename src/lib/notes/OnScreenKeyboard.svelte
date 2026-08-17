<script context="module" lang="ts">
	/** Total docked height, so the board can lift notes clear of the keyboard. */
	export const KEYBOARD_HEIGHT = 380;
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Keyboard from 'simple-keyboard';
	import 'simple-keyboard/build/css/index.css';
	import { keyboardDockHeight } from './keyboardStore';

	export let value = '';
	export let onInput: (value: string) => void;
	export let onEnter: () => void;
	export let onClose: () => void;
	/** Label on the enter key — names what committing actually does. */
	export let enterLabel = 'Enter';

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
	$: keyboard?.setOptions({ display: { ...displayBase, '{enter}': enterLabel } });

	// ⌫ (U+232B) has no glyph in the display's font stack and renders blank — the
	// plain arrow is the one that actually draws.
	const displayBase = {
		'{bksp}': '←',
		'{shift}': '⇧',
		'{space}': 'space'
	};

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
			display: { ...displayBase, '{enter}': enterLabel }
		});
		keyboard.setInput(value);
		keyboardDockHeight.set(KEYBOARD_HEIGHT);
	});

	onDestroy(() => {
		keyboard?.destroy();
		keyboardDockHeight.set(0);
	});

	// Swallow touches so a swipe on the keyboard never reaches the pager underneath.
	function swallow(e: Event) {
		e.stopPropagation();
	}
</script>

<style>
	.keyboard-dock {
		/* Local palette — the app tokens don't carry a "recessed panel" step, and the
		   keys need to read as raised against the dock at 1–2 m. */
		--kb-dock-bg: color-mix(in srgb, var(--color-bg) 55%, var(--color-surface));
		--kb-key-bg: var(--color-surface-2);
		--kb-key-ink: var(--ink-1);
		--kb-key-line: color-mix(in srgb, var(--ink-1) 14%, transparent);
		--kb-mod-bg: color-mix(in srgb, var(--color-surface-2) 55%, transparent);
		--kb-mod-ink: var(--ink-2);
		--kb-gap: 8px;

		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: var(--kb-height);
		background: var(--kb-dock-bg);
		border-top: 1px solid var(--rule-strong);
		box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.45);
		z-index: 10000;
		display: flex;
		flex-direction: column;
		/* Own the touch so dragging the keyboard never scrolls the pager underneath. */
		touch-action: none;
	}

	/* Paper scheme reads the other way round: keys are the lightest surface. */
	:global([data-theme='light']) .keyboard-dock {
		--kb-dock-bg: var(--color-surface-2);
		--kb-key-bg: var(--color-surface);
		--kb-key-line: var(--color-border);
		--kb-mod-bg: color-mix(in srgb, var(--color-surface) 55%, transparent);
		box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.18);
	}

	.dock-bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex: 0 0 auto;
		padding: 10px 16px;
	}

	.done-btn {
		min-width: 96px;
		height: 44px;
		padding: 0 22px;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		background: var(--color-accent);
		color: var(--color-bg);
		font-size: var(--text-body);
		font-weight: var(--font-weight-semibold);
		letter-spacing: 0.02em;
		cursor: pointer;
	}
	.done-btn:active {
		transform: translateY(1px);
		filter: brightness(1.1);
	}

	/* ── simple-keyboard theming ────────────────
	   Tree is .hg-theme-default > .hg-rows > .hg-row > .hg-button, with the theme class
	   on the container simple-keyboard was handed (the inner div, not .keyboard-host).
	   Qualifying with .hg-theme-default also clears the library's own specificity. */
	.keyboard-host {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.keyboard-host :global(.hg-theme-default) {
		background: transparent;
		flex: 1;
		min-height: 0;
		padding: 0 var(--kb-gap) var(--kb-gap);
	}

	/* Undocumented wrapper between the theme root and the rows — it has no styles of
	   its own, so it has to carry the column layout. */
	.keyboard-host :global(.hg-theme-default .hg-rows) {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: var(--kb-gap);
	}

	.keyboard-host :global(.hg-theme-default .hg-row) {
		flex: 1;
		min-height: 0;
		gap: var(--kb-gap);
	}
	/* The library spaces rows/keys with margins; the flex gap replaces them. */
	.keyboard-host :global(.hg-theme-default .hg-row:not(:last-child)) {
		margin-bottom: 0;
	}
	.keyboard-host :global(.hg-theme-default .hg-row .hg-button:not(:last-child)) {
		margin-right: 0;
	}
	/* Space bar gets a shorter row — the letters are what need the reach. */
	.keyboard-host :global(.hg-theme-default .hg-rows .hg-row:last-child) {
		flex: 0.62;
	}

	.keyboard-host :global(.hg-theme-default .hg-button) {
		height: auto;
		flex: 1 1 0;
		width: auto;
		min-width: 0;
		background: var(--kb-key-bg);
		border: 1px solid var(--kb-key-line);
		border-bottom: 1px solid var(--kb-key-line);
		border-radius: var(--radius-sm);
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
		color: var(--kb-key-ink);
		font-size: 26px;
		font-weight: var(--font-weight-medium);
		/* Beat the global 300ms colour transition — key feedback has to feel instant. */
		transition:
			background-color 40ms linear,
			transform 40ms linear;
	}

	.keyboard-host :global(.hg-theme-default .hg-button:active),
	.keyboard-host :global(.hg-theme-default .hg-button.hg-activeButton) {
		background: var(--color-accent);
		color: var(--color-bg);
		border-color: var(--color-accent);
		transform: translateY(1px);
		box-shadow: none;
	}

	/* Modifiers sit back so the letters lead. */
	.keyboard-host :global(.hg-theme-default .hg-button.hg-functionBtn) {
		background: var(--kb-mod-bg);
		color: var(--kb-mod-ink);
		font-size: 20px;
		font-weight: var(--font-weight-semibold);
	}

	.keyboard-host :global(.hg-theme-default .hg-button[data-skbtn='{bksp}']),
	.keyboard-host :global(.hg-theme-default .hg-button[data-skbtn='{shift}']) {
		flex: 1.45 1 0;
	}

	/* Shift is a latched layer, so it has to look latched. */
	.keyboard-dock.shifted .keyboard-host :global(.hg-button[data-skbtn='{shift}']) {
		background: color-mix(in srgb, var(--color-accent) 34%, transparent);
		border-color: var(--color-accent);
		color: var(--ink-1);
	}

	/* Enter is the commit action — carry the accent so it's findable at a glance. */
	.keyboard-host :global(.hg-theme-default .hg-button[data-skbtn='{enter}']) {
		flex: 1.9 1 0;
		background: color-mix(in srgb, var(--color-accent) 26%, transparent);
		border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
		color: var(--ink-1);
		font-size: var(--text-body);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.keyboard-host :global(.hg-theme-default .hg-button[data-skbtn='{space}']) {
		font-size: var(--text-caption);
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--ink-3);
	}
</style>

<div
	class="keyboard-dock"
	class:shifted={layoutName === 'shift'}
	style="--kb-height: {KEYBOARD_HEIGHT}px;"
	on:pointerdown={swallow}
	on:touchstart={swallow}
>
	<div class="dock-bar">
		<button class="done-btn" data-no-drag on:click={onClose}>Done</button>
	</div>
	<!-- simple-keyboard overwrites its container's className (dropping Svelte's scoping
	     class), so it gets a sacrificial inner div and .keyboard-host stays styleable. -->
	<div class="keyboard-host">
		<div class="kb-mount" bind:this={container}></div>
	</div>
</div>
