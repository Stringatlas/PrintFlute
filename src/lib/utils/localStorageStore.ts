import { writable, type Writable } from 'svelte/store';

export function localStorageStore<T>(key: string, defaultValue: T): Writable<T> {
	let storedValue: T = defaultValue;
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(key);
		if (stored) {
			try {
				storedValue = JSON.parse(stored);
			} catch {
				storedValue = defaultValue;
			}
		}
	}
	
	const { subscribe, set, update } = writable<T>(storedValue);
	
	return {
		subscribe,
		set: (value: T) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(key, JSON.stringify(value));
			}
			set(value);
		},
		update: (fn: (value: T) => T) => {
			update(currentValue => {
				const newValue = fn(currentValue);
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem(key, JSON.stringify(newValue));
				}
				return newValue;
			});
		}
	};
}
