import { describe, it, expect } from 'vitest';
import { createDeck } from './deck';

describe('createDeck', () => {
	it('deals every item once per pass', () => {
		const deck = createDeck(['a', 'b', 'c', 'd']);
		for (let pass = 0; pass < 20; pass++) {
			const dealt = Array.from({ length: 4 }, () => deck.next());
			expect(dealt.sort()).toEqual(['a', 'b', 'c', 'd']);
		}
	});

	it('never deals the same item twice in a row', () => {
		const deck = createDeck(['a', 'b', 'c']);
		let previous = deck.next();
		for (let i = 0; i < 3000; i++) {
			const next = deck.next();
			expect(next).not.toBe(previous);
			previous = next;
		}
	});

	it('keeps dealing a single item', () => {
		const deck = createDeck(['a']);
		expect([deck.next(), deck.next()]).toEqual(['a', 'a']);
	});
});
