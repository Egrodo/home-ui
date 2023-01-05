// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// https://css-tricks.com/converting-color-spaces-in-javascript/
export default function hexToRGB(h): [number, number, number] {
	let r = 0,
		g = 0,
		b = 0;

	// 3 digits
	if (h.length == 4) {
		r = '0x' + h[1] + h[1];
		g = '0x' + h[2] + h[2];
		b = '0x' + h[3] + h[3];

		// 6 digits
	} else if (h.length == 7) {
		r = '0x' + h[1] + h[2];
		g = '0x' + h[3] + h[4];
		b = '0x' + h[5] + h[6];
	}

	return [+r, +g, +b];
}

export function hexToRGBString(h) {
	let r = 0,
		g = 0,
		b = 0;

	// 3 digits
	if (h.length == 4) {
		r = '0x' + h[1] + h[1];
		g = '0x' + h[2] + h[2];
		b = '0x' + h[3] + h[3];

		// 6 digits
	} else if (h.length == 7) {
		r = '0x' + h[1] + h[2];
		g = '0x' + h[3] + h[4];
		b = '0x' + h[5] + h[6];
	}

	return 'rgb(' + +r + ',' + +g + ',' + +b + ')';
}
