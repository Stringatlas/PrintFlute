import { get } from 'svelte/store';
import { localStorageStore } from '$lib/utils/localStorageStore';
import {
	fluteParams,
	toneHoleParams,
	type FluteParameters,
	type ToneHoleParameters
} from './fluteStore';

export interface FlutePreset {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	fluteParameters: FluteParameters;
	toneHoleParameters: ToneHoleParameters;
}

interface LibraryState {
	presets: FlutePreset[];
	activePresetId: string | null;
}

const DEFAULT_LIBRARY_STATE: LibraryState = {
	presets: [],
	activePresetId: null,
};

function createLibraryStore() {
	const { subscribe, set, update } = localStorageStore<LibraryState>(
		'flute-generator-library',
		{ ...DEFAULT_LIBRARY_STATE }
	);

	return {
		subscribe,

		saveCurrentAsPreset: (name: string, description: string = '') => {
			const preset: FlutePreset = {
				id: crypto.randomUUID(),
				name,
				description,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				fluteParameters: { ...get(fluteParams) },
				toneHoleParameters: { ...get(toneHoleParams) },
			};

			update(state => ({
				...state,
				presets: [...state.presets, preset],
				activePresetId: preset.id,
			}));

			return preset.id;
		},

		updatePreset: (id: string) => {
			update(state => ({
				...state,
				presets: state.presets.map(p =>
					p.id === id
						? {
								...p,
								updatedAt: new Date().toISOString(),
								fluteParameters: { ...get(fluteParams) },
								toneHoleParameters: { ...get(toneHoleParams) },
							}
						: p
				),
			}));
		},

		loadPreset: (id: string) => {
			const state = get({ subscribe });
			const preset = state.presets.find(p => p.id === id);
			if (!preset) return;

			fluteParams.resetAll();
			toneHoleParams.resetAll();

			Object.entries(preset.fluteParameters).forEach(([key, value]) => {
				fluteParams.updateParameter(key as keyof FluteParameters, value);
			});

			toneHoleParams.updateToneHoleParams(preset.toneHoleParameters);

			update(state => ({ ...state, activePresetId: id }));
		},

		deletePreset: (id: string) => {
			update(state => ({
				...state,
				presets: state.presets.filter(p => p.id !== id),
				activePresetId: state.activePresetId === id ? null : state.activePresetId,
			}));
		},

		renamePreset: (id: string, name: string) => {
			update(state => ({
				...state,
				presets: state.presets.map(p =>
					p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
				),
			}));
		},

		updatePresetDescription: (id: string, description: string) => {
			update(state => ({
				...state,
				presets: state.presets.map(p =>
					p.id === id ? { ...p, description, updatedAt: new Date().toISOString() } : p
				),
			}));
		},

		overwriteWithData: (id: string, fluteParameters: FluteParameters, toneHoleParameters: ToneHoleParameters) => {
			update(state => ({
				...state,
				presets: state.presets.map(p =>
					p.id === id
						? {
								...p,
								updatedAt: new Date().toISOString(),
								fluteParameters: { ...fluteParameters },
								toneHoleParameters: { ...toneHoleParameters },
							}
						: p
				),
			}));
		},

		duplicatePreset: (id: string) => {
			update(state => {
				const source = state.presets.find(p => p.id === id);
				if (!source) return state;

				const duplicate: FlutePreset = {
					...structuredClone(source),
					id: crypto.randomUUID(),
					name: `${source.name} (Copy)`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				return {
					...state,
					presets: [...state.presets, duplicate],
				};
			});
		},

		clearActivePreset: () => {
			update(state => ({ ...state, activePresetId: null }));
		},
	};
}

export const libraryStore = createLibraryStore();
