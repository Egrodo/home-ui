<script lang="ts">
	import { onMount } from 'svelte';
	import { notesStore } from '../data/backendStores';
	import { setNoteItemStatus, deleteNoteList, addNoteItem, createNoteList } from '../data/backend';
	import type { NoteList, TodoItem } from '../data/types';
	import StickyNote from './StickyNote.svelte';
	import OnScreenKeyboard, { KEYBOARD_HEIGHT } from './OnScreenKeyboard.svelte';
	import { findFreeSlot, loadPositions, savePositions, type NotePositions } from './notePositions';

	let boardEl: HTMLDivElement;
	let boardWidth = 1080;
	let boardHeight = 1920;
	let positions: NotePositions = {};
	let topZ = 1;
	let ready = false;

	onMount(() => {
		positions = loadPositions();
		topZ = Object.values(positions).reduce((max, p) => Math.max(max, p.z), 1);
		if (boardEl) {
			boardWidth = boardEl.clientWidth;
			boardHeight = boardEl.clientHeight;
		}
		ready = true;
	});

	// Lists we've optimistically removed: hidden immediately (so the pop-out plays)
	// while the HA delete is in flight, then confirmed or reverted.
	let pendingDeletion = new Set<string>();

	// --- Creation / editing state ---

	// A not-yet-created note whose title is being entered. Rendered alongside the
	// real notes under a temp id until HA reports the real `todo.*` entity.
	let draft: { tempId: string; title: string; x: number; y: number; z: number } | null = null;
	// Set once we've asked HA to create the list; cleared when the real list arrives
	// (adopting the draft's slot) or the create fails/times out. `knownIds` is the set
	// of lists that already existed at create time, so the one new `todo.*` entity can
	// be identified by absence — robust even if HA titles the list differently.
	let pendingCreate: { tempId: string; title: string; knownIds: Set<string> } | null = null;
	let createTimer: ReturnType<typeof setTimeout> | null = null;
	const CREATE_TIMEOUT_MS = 10000;

	// Which field the on-screen keyboard is currently driving.
	let editing: { noteId: string; kind: 'title' | 'item'; value: string } | null = null;

	// Top edge of the docked keyboard, in board space — how high notes must clear.
	$: keyboardTopY = boardHeight - KEYBOARD_HEIGHT;

	// Stable ordering so default-layout indices don't jump around as items load.
	$: lists = Object.values($notesStore).sort((a, b) => a.entityId.localeCompare(b.entityId));

	// What the board actually renders — real notes minus in-flight deletions, plus
	// the draft note (if any) as a synthetic list.
	$: visibleLists = lists.filter((l) => !pendingDeletion.has(l.entityId));
	$: draftList = draft
		? ({ entityId: draft.tempId, title: draft.title, items: [] } as NoteList)
		: null;

	// Assign a default position to any newly discovered list; drop stale entries.
	$: if (ready) ensurePositions(lists);

	// Once HA confirms a delete the list leaves the store, so clear it from the
	// pending set to keep it from growing unbounded.
	$: reconcilePending(lists);

	function reconcilePending(currentLists: NoteList[]) {
		if (pendingDeletion.size === 0) return;
		const liveIds = new Set(currentLists.map((l) => l.entityId));
		const next = new Set([...pendingDeletion].filter((id) => liveIds.has(id)));
		if (next.size !== pendingDeletion.size) pendingDeletion = next;
	}

	function ensurePositions(currentLists: NoteList[]) {
		const liveIds = new Set(currentLists.map((l) => l.entityId));
		let changed = false;

		// Slots taken by notes that already have a position (dragged or previously
		// placed), plus the draft's slot, so new placements avoid all of them.
		const occupied = currentLists
			.map((list) => positions[list.entityId])
			.filter((pos): pos is NotePositions[string] => pos != null);
		if (draft) occupied.push({ x: draft.x, y: draft.y, z: draft.z });

		currentLists.forEach((list) => {
			if (positions[list.entityId]) return;

			// If this is the list we just created (a todo.* entity that wasn't there when
			// we asked HA to create one), adopt the draft's slot and move the keyboard
			// focus from the temp id to the real entity instead of placing it fresh.
			if (draft && pendingCreate && !pendingCreate.knownIds.has(list.entityId)) {
				topZ += 1;
				const pos = { x: draft.x, y: draft.y, z: topZ };
				positions[list.entityId] = pos;
				occupied.push(pos);
				if (editing && editing.noteId === pendingCreate.tempId) {
					editing = { ...editing, noteId: list.entityId };
				}
				clearCreatePending();
				changed = true;
				return;
			}

			const { x, y } = findFreeSlot(occupied, boardWidth);
			topZ += 1;
			const pos = { x, y, z: topZ };
			positions[list.entityId] = pos;
			occupied.push(pos);
			changed = true;
		});

		for (const id of Object.keys(positions)) {
			if (!liveIds.has(id)) {
				delete positions[id];
				changed = true;
			}
		}

		if (changed) {
			positions = positions;
			savePositions(positions);
		}
	}

	function clearCreatePending() {
		draft = null;
		pendingCreate = null;
		if (createTimer) {
			clearTimeout(createTimer);
			createTimer = null;
		}
	}

	function bringToFront(entityId: string) {
		topZ += 1;
		positions[entityId] = { ...positions[entityId], z: topZ };
		positions = positions;
		savePositions(positions);
	}

	function move(entityId: string, x: number, y: number) {
		positions[entityId] = { ...positions[entityId], x, y };
		positions = positions;
	}

	function persist() {
		savePositions(positions);
	}

	function toggleItem(entityId: string, item: TodoItem) {
		const next = item.status === 'completed' ? 'needs_action' : 'completed';
		setNoteItemStatus(entityId, item.uid, next);
	}

	async function remove(entityId: string) {
		// Eagerly hide the note so the pop-out plays right away.
		pendingDeletion = new Set(pendingDeletion).add(entityId);
		try {
			await deleteNoteList(entityId);
		} catch (err) {
			// Server rejected the delete — restore the note where it was.
			console.error(`Failed to delete ${entityId}, restoring`, err);
			const next = new Set(pendingDeletion);
			next.delete(entityId);
			pendingDeletion = next;
		}
	}

	// --- Creation flow ---

	function startNewNote() {
		const occupied = Object.values(positions);
		const { x, y } = findFreeSlot(occupied, boardWidth);
		topZ += 1;
		const tempId = `draft:${Date.now()}`;
		draft = { tempId, title: '', x, y, z: topZ };
		editing = { noteId: tempId, kind: 'title', value: '' };
	}

	function startAddItem(entityId: string) {
		editing = { noteId: entityId, kind: 'item', value: '' };
	}

	function onKeyInput(value: string) {
		if (editing) editing = { ...editing, value };
	}

	async function onKeyEnter() {
		if (!editing) return;
		const value = editing.value.trim();

		if (editing.kind === 'title') {
			if (!value || !draft) return; // ignore empty title
			const tempId = draft.tempId;
			draft = { ...draft, title: value };
			pendingCreate = { tempId, title: value, knownIds: new Set(lists.map((l) => l.entityId)) };
			// Flow straight into item entry; ensurePositions remaps this temp id to the
			// real entity once HA reports it (usually well under a second).
			editing = { noteId: tempId, kind: 'item', value: '' };
			startCreateTimeout();
			try {
				await createNoteList(value);
			} catch (err) {
				console.error(`Failed to create list "${value}"`, err);
				abortDraft();
			}
			return;
		}

		// Adding an item.
		if (!value) return;
		if (editing.noteId.startsWith('draft:')) return; // list not created yet — keep typing
		const entityId = editing.noteId;
		editing = { ...editing, value: '' };
		try {
			await addNoteItem(entityId, value);
		} catch (err) {
			console.error(`Failed to add item to ${entityId}`, err);
		}
	}

	function startCreateTimeout() {
		if (createTimer) clearTimeout(createTimer);
		createTimer = setTimeout(() => {
			if (pendingCreate) {
				console.error(`Timed out creating list "${pendingCreate.title}"`);
				abortDraft();
			}
		}, CREATE_TIMEOUT_MS);
	}

	// Drop the draft and close the keyboard when a create fails or times out.
	function abortDraft() {
		clearCreatePending();
		editing = null;
	}

	// "Done" / dismiss: close the keyboard. An uncommitted draft (title never
	// entered) is discarded rather than left as a nameless note.
	function stopEditing() {
		if (draft && !pendingCreate) draft = null;
		editing = null;
	}
</script>

<style>
	.board {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.fab {
		position: absolute;
		right: 28px;
		bottom: 28px;
		width: 68px;
		height: 68px;
		border-radius: 50%;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		color: var(--ink-1);
		font-size: 34px;
		line-height: 1;
		cursor: pointer;
		z-index: 100;
	}
</style>

<div class="board" bind:this={boardEl}>
	{#each visibleLists as list (list.entityId)}
		{#if positions[list.entityId]}
			<StickyNote
				{list}
				pos={positions[list.entityId]}
				activeField={editing?.noteId === list.entityId ? editing.kind : null}
				fieldValue={editing?.noteId === list.entityId ? editing.value : ''}
				keyboardClearance={editing?.noteId === list.entityId ? keyboardTopY : null}
				onBringToFront={() => bringToFront(list.entityId)}
				onMove={(x, y) => move(list.entityId, x, y)}
				onEnd={persist}
				onToggleItem={(item) => toggleItem(list.entityId, item)}
				onStartAddItem={() => startAddItem(list.entityId)}
				onDelete={() => remove(list.entityId)}
			/>
		{/if}
	{/each}

	{#if draft && draftList}
		<StickyNote
			list={draftList}
			pos={{ x: draft.x, y: draft.y, z: draft.z }}
			isDraft
			activeField={editing?.noteId === draft.tempId ? editing.kind : null}
			fieldValue={editing?.noteId === draft.tempId ? editing.value : ''}
			keyboardClearance={editing?.noteId === draft.tempId ? keyboardTopY : null}
			onBringToFront={() => {}}
			onMove={() => {}}
			onEnd={() => {}}
			onToggleItem={() => {}}
			onDelete={() => {}}
		/>
	{/if}

	{#if !editing}
		<button class="fab" on:click={startNewNote} aria-label="New list">＋</button>
	{/if}

	{#if editing}
		<OnScreenKeyboard
			value={editing.value}
			onInput={onKeyInput}
			onEnter={onKeyEnter}
			onClose={stopEditing}
		/>
	{/if}
</div>
