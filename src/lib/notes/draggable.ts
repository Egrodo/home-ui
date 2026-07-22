/**
 * Pointer-drag action for a positioned element within its parent.
 *
 * Applied to the note root; a drag only begins when the pointer goes down on an
 * element matching `handle` (and not on anything marked `[data-no-drag]`, so
 * buttons inside the handle stay tappable). Movement is clamped hard to the
 * parent's box — the note can never overflow the screen edges.
 */

export interface DragParams {
	/** CSS selector for the drag handle within the node (e.g. the header row). */
	handle: string;
	/** Fired on drag start — used to raise the note's z-index. */
	onStart: () => void;
	/** Fired on every move with the clamped position, in parent-relative px. */
	onMove: (x: number, y: number) => void;
	/** Fired once when the drag ends — used to persist the final position. */
	onEnd: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function draggable(node: HTMLElement, params: DragParams) {
	let p = params;
	let dragging = false;
	let pointerStartX = 0;
	let pointerStartY = 0;
	let baseX = 0;
	let baseY = 0;

	function onPointerDown(event: PointerEvent) {
		const target = event.target as Element;
		if (!target.closest(p.handle)) return;
		if (target.closest('[data-no-drag]')) return;

		dragging = true;
		pointerStartX = event.clientX;
		pointerStartY = event.clientY;

		const parent = node.parentElement;
		const rect = node.getBoundingClientRect();
		const parentRect = parent?.getBoundingClientRect();
		baseX = rect.left - (parentRect?.left ?? 0);
		baseY = rect.top - (parentRect?.top ?? 0);

		node.setPointerCapture(event.pointerId);
		p.onStart();
		event.preventDefault();
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		const parent = node.parentElement;
		if (!parent) return;

		const maxX = Math.max(0, parent.clientWidth - node.offsetWidth);
		const maxY = Math.max(0, parent.clientHeight - node.offsetHeight);
		const x = clamp(baseX + (event.clientX - pointerStartX), 0, maxX);
		const y = clamp(baseY + (event.clientY - pointerStartY), 0, maxY);
		p.onMove(x, y);
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
		p.onEnd();
	}

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('pointermove', onPointerMove);
	node.addEventListener('pointerup', onPointerUp);
	node.addEventListener('pointercancel', onPointerUp);

	return {
		update(next: DragParams) {
			p = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerup', onPointerUp);
			node.removeEventListener('pointercancel', onPointerUp);
		}
	};
}
