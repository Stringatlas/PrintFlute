import type { FluteParameters, ToneHoleParameters } from './fluteTypes';

export type LibrarySource = 'official' | 'local' | 'community';
export type FluteDifficulty = 'beginner' | 'intermediate' | 'experienced';
export type PrintFormat = 'one-piece' | 'sectional';
export type FluteSize = 'compact' | 'standard' | 'long';

export interface LibraryAuthor {
	id: string;
	displayName: string;
}

/**
 * Shared catalog shape. Official entries are bundled, local entries are stored on
 * this device, and future community entries can arrive from a remote repository.
 */
export interface FluteLibraryEntry {
	id: string;
	slug: string;
	source: LibrarySource;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	version: number;
	visibility: 'private' | 'public';
	author?: LibraryAuthor;
	featured?: boolean;
	metadata: {
		key: string;
		difficulty: FluteDifficulty;
		printFormat: PrintFormat;
		size: FluteSize;
		character: string;
		tags: string[];
	};
	fluteParameters: FluteParameters;
	toneHoleParameters: ToneHoleParameters;
}
