import { writable } from 'svelte/store';
import { localStorageStore } from '$lib/utils/localStorageStore';

export type ViewMode = 'basic' | 'advanced';

export const viewMode = localStorageStore<ViewMode>('flute-generator-view-mode', 'basic');

export type DesignStep = 1 | 2 | 3;
export const currentDesignStep = writable<DesignStep>(1);