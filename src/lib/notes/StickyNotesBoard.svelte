<script lang="ts">
	import { onMount } from 'svelte';
	import { notesStore } from '../data/backendStores';
	import { setNoteItemStatus, deleteNoteList } from '../data/backend';
	import type { NoteList, TodoItem } from '../data/types';
	import StickyNote from './StickyNote.svelte';
	import { findFreeSlot, loadPositions, savePositions, type NotePositions } from './notePositions';

	let boardEl: HTMLDivElement;
	let boardWidth = 1080;
	let positions: NotePositions = {};
	let topZ = 1;
	let ready = false;

	onMount(() => {
		positions = loadPositions();
		topZ = Object.values(positions).reduce((max, p) => Math.max(max, p.z), 1);
		if (boardEl) boardWidth = boardEl.clientWidth;
		ready = true;
	});

	// Lists we've optimistically removed: hidden immediately (so the pop-out plays)
	// while the HA delete is in flight, then confirmed or reverted.
	let pendingDeletion = new Set<string>();

	// Stable ordering so default-layout indices don't jump around as items load.
	$: lists = Object.values($notesStore).sort((a, b) => a.entityId.localeCompare(b.entityId));

	// What the board actually renders — everything except in-flight deletions.
	$: visibleLists = lists.filter((l) => !pendingDeletion.has(l.entityId));

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
		// placed). New notes avoid these, and each new placement joins the set so
		// two lists created at once don't land on each other either.
		const occupied = currentLists
			.map((list) => positions[list.entityId])
			.filter((pos): pos is NotePositions[string] => pos != null);

		currentLists.forEach((list) => {
			if (positions[list.entityId]) return;
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
</script>

<style>
	.board {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>

<div class="board" bind:this={boardEl}>
	{#each visibleLists as list (list.entityId)}
		{#if positions[list.entityId]}
			<StickyNote
				{list}
				pos={positions[list.entityId]}
				onBringToFront={() => bringToFront(list.entityId)}
				onMove={(x, y) => move(list.entityId, x, y)}
				onEnd={persist}
				onToggleItem={(item) => toggleItem(list.entityId, item)}
				onDelete={() => remove(list.entityId)}
			/>
		{/if}
	{/each}
</div>
