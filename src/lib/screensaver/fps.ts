/** Reports frames per second about once a second, until the returned function is called. */
export function startFpsMeter(report: (fps: number) => void): () => void {
	let frames = 0;
	let windowStart = performance.now();
	let id = requestAnimationFrame(tick);

	function tick(now: number) {
		frames++;
		const elapsed = now - windowStart;
		if (elapsed >= 1000) {
			report((frames * 1000) / elapsed);
			frames = 0;
			windowStart = now;
		}
		id = requestAnimationFrame(tick);
	}

	return () => cancelAnimationFrame(id);
}
