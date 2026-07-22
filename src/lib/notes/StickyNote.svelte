<script lang="ts">
	import type { NoteList, TodoItem } from '../data/types';
	import { NOTE_WIDTH, type NotePosition } from './notePositions';
	import { draggable as dragAction } from './draggable';

	/** Shrink-and-fade as the note is removed. */
	function popOut(_node: HTMLElement, { duration = 100 } = {}) {
		return {
			duration,
			css: (t: number) => `transform: scale(${0.7 + t * 0.3}); opacity: ${t};`
		};
	}

	export let list: NoteList;
	export let pos: NotePosition;
	export let onBringToFront: () => void;
	export let onMove: (x: number, y: number) => void;
	export let onEnd: () => void;
	export let onToggleItem: (item: TodoItem) => void;
	export let onDelete: () => void;

	let confirming = false;
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	function handleClose() {
		if (!confirming) {
			// First tap arms the confirm; auto-disarm if not confirmed shortly.
			confirming = true;
			confirmTimer = setTimeout(() => (confirming = false), 3000);
			return;
		}
		// Keep the confirm label until the note animates away — resetting to "✕"
		// here would flash the old state during the pop-out.
		if (confirmTimer) clearTimeout(confirmTimer);
		onDelete();
	}
</script>

<style>
	.sticky-note {
		position: absolute;
		width: var(--note-width);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 0px 24px rgba(0, 0, 0, 0.25);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
		/* Own the touch so dragging never scrolls the pager underneath. */
		touch-action: none;
	}

	.note-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		border-bottom: 1px solid var(--color-border);
		cursor: grab;
	}

	.note-title {
		flex: 1;
		font-size: var(--text-body);
		font-weight: var(--font-weight-semibold);
		color: var(--ink-1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.close-btn {
		flex-shrink: 0;
		min-width: 28px;
		height: 28px;
		padding: 0 8px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink-2);
		font-size: var(--text-caption);
		line-height: 1;
		cursor: pointer;
	}

	.close-btn.confirming {
		border-color: var(--color-negative);
		color: var(--color-negative);
	}

	.note-body {
		display: flex;
		flex-direction: column;
		padding: 10px 14px 14px;
		gap: 4px;
	}

	.todo-line {
		display: flex;
		gap: 8px;
		align-items: baseline;
		padding: 4px 2px;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: var(--text-body);
		color: var(--ink-1);
	}

	.checkbox {
		font-family: ui-monospace, monospace;
		color: var(--ink-2);
		flex-shrink: 0;
	}

	.todo-line.done .summary {
		text-decoration: line-through;
		color: var(--ink-3);
	}

	.empty {
		font-size: var(--text-caption);
		color: var(--ink-3);
		padding: 4px 2px;
	}
</style>

<div
	class="sticky-note"
	style="left: {pos.x}px; top: {pos.y}px; z-index: {pos.z}; --note-width: {NOTE_WIDTH}px;"
	use:dragAction={{ handle: '.note-header', onStart: onBringToFront, onMove, onEnd }}
	out:popOut|global
>
	<div class="note-header">
		<span class="note-title">{list.title}</span>
		<button
			class="close-btn"
			class:confirming
			data-no-drag
			on:click={handleClose}
			aria-label={confirming ? 'Confirm delete list' : 'Delete list'}
		>
			{confirming ? 'Delete?' : '✕'}
		</button>
	</div>

	<div class="note-body">
		{#if list.items.length === 0}
			<span class="empty">No items</span>
		{:else}
			{#each list.items as item (item.uid)}
				<button
					class="todo-line"
					class:done={item.status === 'completed'}
					on:click={() => onToggleItem(item)}
				>
					<span class="checkbox">{item.status === 'completed' ? '[x]' : '[ ]'}</span>
					<span class="summary">{item.summary}</span>
				</button>
			{/each}
		{/if}
	</div>
</div>
