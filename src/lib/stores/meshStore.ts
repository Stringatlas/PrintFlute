/**
 * Note: These stores are currently not being used.
 */
import { writable } from 'svelte/store';
export interface MeshResolution {
	preview: {
		radialSegments: number;
		heightSegments: number;
	};
	export: {
		radialSegments: number;
		heightSegments: number;
	};
}

export const DEFAULT_MESH_RESOLUTION: MeshResolution = {
	preview: {
		radialSegments: 32,
		heightSegments: 1,
	},
	export: {
		radialSegments: 64,
		heightSegments: 4,
	},
};

export const meshResolution = writable<MeshResolution>({ ...DEFAULT_MESH_RESOLUTION });
