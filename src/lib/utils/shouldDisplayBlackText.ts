import RGBToHSL from './RGBToHSL';

// Colors are represented throughout the app as rgb,converted as needed
export default ([r, g, b]: [number, number, number]): boolean => {
	if (Number.isNaN(r) || Number.isNaN(b) || Number.isNaN(g)) {
		throw new Error('Invalid rgbColor passed to shouldDisplayBlackText');
	}
	const hsl = RGBToHSL(r, g, b);
	const [hue, saturation, luminesence] = (hsl.match(/\d+/g) ?? []).map(Number);
	if (hue == null || saturation == null || luminesence == null) {
		console.error('Failed to parse HSL from color in shouldDisplayBlackText', [r, g, b], hsl);
		return false;
	}
	// Anything with a luminesence brighter than 60% should have black text.
	if (luminesence > 60) {
		return true;
	}
	return false;
};
