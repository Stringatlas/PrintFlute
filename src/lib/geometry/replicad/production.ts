import {
	fingerprintDesign,
	type ApiError,
	type ApiResult,
	type ProductionArtifactKind,
	type ProductionArtifactOptions,
	type ProductionJobRequest,
	type ProductionJobResult,
	type ProductionMeshArtifact,
	type ProductionMeshPart
} from '$lib/api/generation';

export interface ReplicadFaces {
	vertices: number[];
	triangles: number[];
	normals?: number[];
	faceGroups?: unknown;
}

export interface ReplicadEdges {
	vertices: number[];
	lines: number[];
}

export interface ViewerMesh {
	faces: ReplicadFaces;
	edges?: ReplicadEdges;
	parts?: Array<{ faces: ReplicadFaces; edges?: ReplicadEdges }>;
}

function failure(code: ApiError['code'], message: string): ApiResult<never> {
	return { ok: false, error: { code, message } };
}

export function validateProductionRequest(request: ProductionJobRequest): ApiResult<ProductionJobRequest> {
	if (!request || typeof request !== 'object') {
		return failure('VALIDATION_FAILED', 'A production request is required');
	}
	if (typeof request.jobId !== 'string' || request.jobId.trim().length === 0) {
		return failure('VALIDATION_FAILED', 'jobId must be a non-empty string');
	}
	if (!Number.isInteger(request.revision) || request.revision < 0) {
		return failure('VALIDATION_FAILED', 'revision must be a non-negative integer');
	}
	if (!request.snapshot || typeof request.snapshot !== 'object') {
		return failure('VALIDATION_FAILED', 'snapshot is required');
	}
	if (
		request.revision !== request.snapshot.revision ||
		request.fingerprint !== request.snapshot.fingerprint
	) {
		return failure('STALE_JOB', 'Request identity does not match its snapshot');
	}

	try {
		if (fingerprintDesign(request.snapshot.design) !== request.fingerprint) {
			return failure('STALE_JOB', 'Snapshot fingerprint does not match its design');
		}
	} catch (error) {
		return {
			ok: false,
			error: {
				code: 'VALIDATION_FAILED',
				message: 'Snapshot design cannot be fingerprinted',
				details: { cause: error instanceof Error ? error.message : String(error) }
			}
		};
	}

	const { kind, scope, linearDeflection, angularDeflection } = request.artifact ?? {};
	if (!['mesh', 'stl', 'step'].includes(kind) || !['full', 'parts'].includes(scope)) {
		return failure('VALIDATION_FAILED', 'Unsupported production artifact');
	}
	if (
		(linearDeflection !== undefined && (!Number.isFinite(linearDeflection) || linearDeflection <= 0)) ||
		(angularDeflection !== undefined &&
			(!Number.isFinite(angularDeflection) || angularDeflection <= 0))
	) {
		return failure('VALIDATION_FAILED', 'Tessellation tolerances must be positive finite numbers');
	}
	return { ok: true, value: request };
}

export function validateProductionResult(
	request: ProductionJobRequest,
	result: ProductionJobResult
): ApiResult<ProductionJobResult> {
	if (
		result.jobId !== request.jobId ||
		result.revision !== request.revision ||
		result.fingerprint !== request.fingerprint ||
		result.artifact.kind !== request.artifact.kind
	) {
		return failure('STALE_JOB', 'Worker result does not match the requested job snapshot');
	}
	return { ok: true, value: result };
}

export function productionCacheKey(options: ProductionArtifactOptions): string {
	const linear = options.kind === 'step' ? '-' : (options.linearDeflection ?? 0.01);
	const angular = options.kind === 'step' ? '-' : (options.angularDeflection ?? 30);
	return `${options.kind}:${options.scope}:${linear}:${angular}`;
}

export function productionOutputNames(
	kind: Exclude<ProductionArtifactKind, 'mesh'>,
	scope: ProductionArtifactOptions['scope'],
	partCount = 1
): string[] {
	const extension = kind;
	if (scope === 'full') return [`flute.${extension}`];
	return Array.from({ length: Math.max(0, partCount) }, (_, index) =>
		`flute-part-${index + 1}.${extension}`
	);
}

export class ProductionJobState {
	private readonly cancelled = new Set<string>();
	private readonly known = new Set<string>();

	begin(jobId: string): void {
		this.known.add(jobId);
	}

	cancel(jobId: string): boolean {
		if (!this.known.has(jobId)) return false;
		this.cancelled.add(jobId);
		return true;
	}

	isCancelled(jobId: string): boolean {
		return this.cancelled.has(jobId);
	}
}

export function meshPartToViewer(part: ProductionMeshPart): {
	faces: ReplicadFaces;
	edges: undefined;
} {
	return {
		faces: {
			vertices: part.positions,
			triangles: part.indices,
			...(part.normals ? { normals: part.normals } : {})
		},
		edges: undefined
	};
}

/** Adapts the frozen serializable mesh contract to the existing Replicad viewer shape. */
export function productionMeshToViewer(artifact: ProductionMeshArtifact): ViewerMesh {
	const [full, ...parts] = artifact.parts;
	const fallback: ProductionMeshPart = { name: 'flute', positions: [], indices: [] };
	const root = meshPartToViewer(full ?? fallback);
	return {
		...root,
		...(parts.length > 0 ? { parts: parts.map(meshPartToViewer) } : {})
	};
}
