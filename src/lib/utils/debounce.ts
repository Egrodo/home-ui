export default <T extends unknown[]>(delay: number, fn: (...args: T) => void) => {
	let timerId: ReturnType<typeof setTimeout> | null = null;
	return (...args: T) => {
		if (timerId) clearTimeout(timerId);
		timerId = setTimeout(() => {
			fn(...args);
			timerId = null;
		}, delay);
	};
};
