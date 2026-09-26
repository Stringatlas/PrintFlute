import { writable, type Readable } from 'svelte/store';
import type {
	ApiError,
	DesignCommand,
	DesignDraft,
	DesignParameterPath,
	GenerationApi,
	ResolvedDesignSnapshot
} from '$lib/api/generation';

export interface DesignControllerState {
	design: Readable<DesignDraft>;
	snapshot: Readable<ResolvedDesignSnapshot | null>;
	pending: Readable<boolean>;
	error: Readable<ApiError | null>;
	revision: Readable<number>;
}

export interface DesignControllerOptions {
	evaluateInitial?: boolean;
}

function cloneDesign(design: DesignDraft): DesignDraft {
	return {
		flute: {
			...design.flute,
			corkDistance: { ...design.flute.corkDistance },
			corkThickness: { ...design.flute.corkThickness },
			cutDistances: [...design.flute.cutDistances]
		},
		toneHoles: {
			holeDiameters: [...design.toneHoles.holeDiameters],
			holeCents: [...design.toneHoles.holeCents],
			holeDistances: [...design.toneHoles.holeDistances],
			cutoffRatios: [...design.toneHoles.cutoffRatios]
		}
	};
}

function setAtPath(design: DesignDraft, path: DesignParameterPath, value: unknown): DesignDraft {
	const next = cloneDesign(design);
	const [section, key, indexText] = path.split('.');

	if (section === 'flute') {
		(next.flute as unknown as Record<string, unknown>)[key] = value;
		return next;
	}

	const index = Number(indexText);
	if (!Number.isInteger(index) || index < 0) {
		throw new TypeError(`Invalid design parameter path: ${path}`);
	}
	const array = (next.toneHoles as unknown as Record<string, number[]>)[key];
	if (!Array.isArray(array)) throw new TypeError(`Invalid design parameter path: ${path}`);
	array[index] = value as number;
	return next;
}

/**
 * The only editable-design boundary: commands issue revisions and evaluations
 * publish only when their response still matches the current revision.
 */
export class DesignController implements DesignControllerState {
	private currentDesign: DesignDraft;
	private currentRevision = 0;
	private readonly designStore;
	private readonly snapshotStore = writable<ResolvedDesignSnapshot | null>(null);
	private readonly pendingStore = writable(false);
	private readonly errorStore = writable<ApiError | null>(null);
	private readonly revisionStore = writable(0);

	readonly design: Readable<DesignDraft>;
	readonly snapshot: Readable<ResolvedDesignSnapshot | null> = this.snapshotStore;
	readonly pending: Readable<boolean> = this.pendingStore;
	readonly error: Readable<ApiError | null> = this.errorStore;
	readonly revision: Readable<number> = this.revisionStore;

	constructor(
		private readonly api: GenerationApi,
		initialDesign: DesignDraft,
		options: DesignControllerOptions = {}
	) {
		this.currentDesign = cloneDesign(initialDesign);
		this.designStore = writable(this.currentDesign);
		this.design = this.designStore;
		if (options.evaluateInitial !== false) this.evaluate(this.currentDesign);
	}

	dispatch(command: DesignCommand): number {
		const next =
			command.type === 'replace'
				? cloneDesign(command.design)
				: setAtPath(this.currentDesign, command.path, command.value);
		this.currentDesign = next;
		this.designStore.set(next);
		return this.evaluate(next);
	}

	set(path: DesignParameterPath, value: unknown): number {
		return this.dispatch({ type: 'set', path, value } as DesignCommand);
	}

	replace(design: DesignDraft): number {
		return this.dispatch({ type: 'replace', design });
	}

	private evaluate(design: DesignDraft): number {
		const revision = ++this.currentRevision;
		const requestDesign = cloneDesign(design);
		this.revisionStore.set(revision);
		this.pendingStore.set(true);
		this.errorStore.set(null);

		void this.api.evaluate({ revision, design: requestDesign }).then(
			(result) => {
				if (revision !== this.currentRevision) return;
				this.pendingStore.set(false);
				if (!result.ok) {
					this.errorStore.set(result.error);
					return;
				}

				this.currentDesign = cloneDesign(result.value.design);
				this.designStore.set(this.currentDesign);
				this.snapshotStore.set(result.value);
				this.errorStore.set(null);
			},
			(error: unknown) => {
				if (revision !== this.currentRevision) return;
				this.pendingStore.set(false);
				this.errorStore.set({
					code: 'CALCULATION_FAILED',
					message:
						error instanceof Error ? error.message : 'The generation service failed unexpectedly',
					retryable: false
				});
			}
		);

		return revision;
	}
}
