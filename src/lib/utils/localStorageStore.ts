import { writable, type Writable } from 'svelte/store';

interface LocalStorageStoreOptions<T> {
	normalize?: (value: unknown) => T;
	debounceMs?: number;
}

/**
 * A browser-safe persisted store. Persisting is debounced so rapid slider/input
 * updates do not synchronously serialize to localStorage on every keystroke.
 */
export function localStorageStore<T>(
	key: string,
	defaultValue: T,
	{ normalize = (value: unknown) => value as T, debounceMs = 200 }: LocalStorageStoreOptions<T> = {}
): Writable<T> {
	let storedValue = defaultValue;
	let persistTimer: ReturnType<typeof setTimeout> | undefined;

	if (typeof localStorage !== 'undefined') {
		try {
			const stored = localStorage.getItem(key);
			if (stored) storedValue = normalize(JSON.parse(stored));
		} catch {
			storedValue = defaultValue;
		}
	}

	const { subscribe, set: setStore, update: updateStore } = writable<T>(storedValue);

	function persist(value: T) {
		if (typeof localStorage === 'undefined') return;
		if (persistTimer) clearTimeout(persistTimer);
		persistTimer = setTimeout(() => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {
				// Storage can be unavailable or full; keep the in-memory state usable.
			}
		}, debounceMs);
	}

	return {
		subscribe,
		set: (value) => {
			const normalized = normalize(value);
			persist(normalized);
			setStore(normalized);
		},
		update: (fn) => {
			updateStore((currentValue) => {
				const normalized = normalize(fn(currentValue));
				persist(normalized);
				return normalized;
			});
		}
	};
}
