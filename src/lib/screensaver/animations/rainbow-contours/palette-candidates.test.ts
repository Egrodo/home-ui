import { describe, it, expect } from 'vitest';
import { hexToOklab } from '../../oklab';
import { createCandidateSource, isGoodSequence } from './palette-candidates';

describe('createCandidateSource', () => {
	const next = createCandidateSource();
	const candidates = Array.from({ length: 300 }, next);

	it('only proposes palettes that pass the rules', () => {
		for (const { palette } of candidates) {
			expect(isGoodSequence(palette.bands.map(hexToOklab), hexToOklab(palette.line))).toBe(true);
		}
	});

	it('keeps band counts in range and every family represented', () => {
		expect(candidates.every(({ palette }) => palette.bands.length >= 5)).toBe(true);
		expect(candidates.every(({ palette }) => palette.bands.length <= 9)).toBe(true);
		expect(new Set(candidates.map((c) => c.family)).size).toBe(6);
	});
});

describe('isGoodSequence', () => {
	const line = hexToOklab('#140f12');

	it('rejects touching bands that are too alike', () => {
		const alike = ['#e0a526', '#e2a728', '#6e3b23', '#b5482a', '#f3e3c3'].map(hexToOklab);
		expect(isGoodSequence(alike, line)).toBe(false);
	});

	it('rejects a band that hides the outline', () => {
		const dark = ['#17121a', '#e0a526', '#6e3b23', '#b5482a', '#f3e3c3'].map(hexToOklab);
		expect(isGoodSequence(dark, line)).toBe(false);
	});
});
