const MAX_DT_SECONDS = 0.1;

/** Calls frame on every animation frame until signal aborts. dt is in seconds. */
export function loop(signal: AbortSignal, frame: (dt: number) => void): void {
	let last = performance.now();
	let id = requestAnimationFrame(tick);

	function tick(now: number) {
		// rAF's timestamp is the frame start, which can precede the first performance.now().
		const dt = Math.min(Math.max(now - last, 0) / 1000, MAX_DT_SECONDS);
		last = now;
		frame(dt);
		id = requestAnimationFrame(tick);
	}

	signal.addEventListener('abort', () => cancelAnimationFrame(id), { once: true });
}
