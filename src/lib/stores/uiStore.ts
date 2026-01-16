import { writable } from 'svelte/store';

export type ViewMode = 'basic' | 'advanced';

function createViewModeStore() {
    const STORAGE_KEY = 'flute-generator-view-mode';
    const defaultValue: ViewMode = 'basic';
    
    let storedValue: ViewMode = defaultValue;
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'basic' || stored === 'advanced') {
            storedValue = stored;
        }
    }
    
    const { subscribe, set, update } = writable<ViewMode>(storedValue);
    
    return {
        subscribe,
        set: (value: ViewMode) => {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, value);
            }
            set(value);
        },
        update: (fn: (value: ViewMode) => ViewMode) => {
            update(currentValue => {
                const newValue = fn(currentValue);
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, newValue);
                }
                return newValue;
            });
        }
    };
}

export const viewMode = createViewModeStore();

export type DesignStep = 1 | 2 | 3;
export const currentDesignStep = writable<DesignStep>(1);