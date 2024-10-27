// Function signatures aren't typechecked here so be careful

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default (delay: number, fn: Function) => {
	let timerId;
	return (...args) => {
		if (timerId) clearTimeout(timerId);
		timerId = setTimeout(() => {
			fn(...args);
			timerId = null;
		}, delay);
	};
};
