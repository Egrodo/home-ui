/** Deals items in random order, playing each once per pass and never one twice in a row. */
export function createDeck<T>(items: readonly T[], random: () => number = Math.random) {
	let pile: T[] = [];
	let last: T | undefined;

	function shuffle(): T[] {
		const shuffled = [...items];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		// The next card is dealt from the end; don't let a new pass repeat the last one.
		if (shuffled.length > 1 && shuffled[shuffled.length - 1] === last) {
			[shuffled[0], shuffled[shuffled.length - 1]] = [shuffled[shuffled.length - 1], shuffled[0]];
		}
		return shuffled;
	}

	return {
		next(): T {
			if (pile.length === 0) pile = shuffle();
			last = pile.pop() as T;
			return last;
		}
	};
}
