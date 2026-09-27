import type { Object3D } from 'three';
import type {
	ComputedParameter,
	DesignDraft,
	FluteParameters,
	ToneHoleParameters
} from '$lib/domain/fluteTypes';

export const DESIGN_SCHEMA_VERSION = 2 as const;

export type DesignSchemaVersion = typeof DESIGN_SCHEMA_VERSION;
export type DesignRevision = number;
export type DesignFingerprint = string;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type ValidationSeverity = 'warning' | 'error';

export interface DesignValidationIssue {
	path: DesignParameterPath | string;
	severity: ValidationSeverity;
	code: string;
	message: string;
}

/** Serializable acoustic-engine output. Positions and spacings are millimetres. */
export interface AcousticHoleResult {
	frequency: number;
	diameter: number;
	acousticPosition: number;
	physicalPosition: number;
	cutoffFrequency: number;
	spacing: number;
}

/** Serializable acoustic-engine output. Frequencies are Hz; lengths are mm. */
export interface AcousticCalculation {
	embouchurePhysicalPosition: number;
	holes: AcousticHoleResult[];
	acousticEndX: number;
}

/** Derived values projected back into the legacy parameter model. */
export interface CalculatedDesignUpdates {
	embouchureDistance: number;
	fluteLength: number;
	holeDistances: number[];
	cutoffRatios: number[];
}

export interface ResolvedComputedParameters {
	corkDistance: number;
	corkThickness: number;
}

export interface ToneHoleTuningAdvisory {
	index: number;
	status: 'in-tune' | 'warning';
	targetFrequency: number;
	estimatedCentsOffset: number;
	currentPosition: number;
	suggestedPosition: number;
	positionDelta: number;
	suggestedDiameter?: number;
	message: string;
}

/** Acoustic advice layered over the physical design; it never mutates geometry. */
export interface TuningAnalysis {
	available: boolean;
	message?: string;
	toneHoles: ToneHoleTuningAdvisory[];
}

export interface ResolvedDesignSnapshot {
	schemaVersion: DesignSchemaVersion;
	revision: DesignRevision;
	fingerprint: DesignFingerprint;
	/** Normalized legacy-compatible inputs. Calculated compatibility fields are updated. */
	design: DesignDraft;
	/** Final scalar values after resolving auto/manual inputs. */
	resolved: ResolvedComputedParameters;
	calculation: {
		data: AcousticCalculation;
		updates: CalculatedDesignUpdates;
	};
	tuning: TuningAnalysis;
	validation: DesignValidationIssue[];
}

export const API_ERROR_CODES = [
	'VALIDATION_FAILED',
	'CALCULATION_FAILED',
	'PREVIEW_FAILED',
	'CAD_INIT_FAILED',
	'CAD_BUILD_FAILED',
	'CAD_EXPORT_FAILED',
	'CANCELLED',
	'STALE_JOB',
	'STORAGE_FAILED'
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiError {
	code: ApiErrorCode;
	message: string;
	/** Optional serializable diagnostic context. Never carries an Error instance. */
	details?: JsonObject;
	issues?: DesignValidationIssue[];
	retryable?: boolean;
}

export type ApiResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: ApiError };

export interface EvaluateDesignRequest {
	revision: DesignRevision;
	design: DesignDraft;
}

export interface GenerationApi {
	evaluate(request: EvaluateDesignRequest): Promise<ApiResult<ResolvedDesignSnapshot>>;
}

export type PreviewKind = 'headjoint' | 'full' | 'printing';

export interface ThreePreviewRequest {
	snapshot: ResolvedDesignSnapshot;
	previewKind: PreviewKind;
}

/**
 * Runtime-only preview result. `root` and `dispose` must not cross a worker,
 * persistence, or HTTP boundary.
 */
export interface ThreePreviewResult {
	root: Object3D;
	dispose(): void;
}

export interface ThreePreviewService {
	build(request: ThreePreviewRequest): Promise<ApiResult<ThreePreviewResult>>;
}

export type ProductionArtifactKind = 'mesh' | 'stl' | 'step';
export type ProductionArtifactScope = 'full' | 'parts';

export interface ProductionArtifactOptions {
	kind: ProductionArtifactKind;
	scope: ProductionArtifactScope;
	/** Tessellation tolerance in millimetres; applies only to mesh/STL. */
	linearDeflection?: number;
	/** Tessellation angular tolerance in radians; applies only to mesh/STL. */
	angularDeflection?: number;
}

export interface ProductionJobRequest {
	jobId: string;
	revision: DesignRevision;
	fingerprint: DesignFingerprint;
	snapshot: ResolvedDesignSnapshot;
	artifact: ProductionArtifactOptions;
}

/** Serializable mesh payload suitable for structured cloning to/from a worker. */
export interface ProductionMeshPart {
	name: string;
	positions: number[];
	indices: number[];
	normals?: number[];
}

export interface ProductionMeshArtifact {
	kind: 'mesh';
	parts: ProductionMeshPart[];
}

/**
 * Runtime-only export payload. Blob is the only non-plain-data production field
 * and must be converted by an HTTP adapter.
 */
export interface ProductionBlobArtifact {
	kind: 'stl' | 'step';
	files: Array<{ name: string; blob: Blob }>;
}

export type ProductionArtifact = ProductionMeshArtifact | ProductionBlobArtifact;

export interface ProductionJobResult {
	jobId: string;
	revision: DesignRevision;
	fingerprint: DesignFingerprint;
	artifact: ProductionArtifact;
}

export interface CancelProductionResult {
	jobId: string;
	cancelled: boolean;
}

export interface ReplicadProductionService {
	build(request: ProductionJobRequest): Promise<ApiResult<ProductionJobResult>>;
	cancel(jobId: string): Promise<ApiResult<CancelProductionResult>>;
}

export type FluteParameterPath = `flute.${keyof FluteParameters & string}`;
export type ToneHoleArrayKey = keyof ToneHoleParameters & string;
export type ToneHoleParameterPath = `toneHoles.${ToneHoleArrayKey}.${number}`;
export type DesignParameterPath = FluteParameterPath | ToneHoleParameterPath;

export type DesignParameterValue<Path extends DesignParameterPath> =
	Path extends `flute.${infer Key extends keyof FluteParameters}`
		? FluteParameters[Key]
		: Path extends `toneHoles.${keyof ToneHoleParameters & string}.${number}`
			? number
			: never;

export type ParameterUpdateCommand = {
	[Path in DesignParameterPath]: {
		type: 'set';
		path: Path;
		value: DesignParameterValue<Path>;
	};
}[DesignParameterPath];

export interface ReplaceDesignCommand {
	type: 'replace';
	design: DesignDraft;
}

export type DesignCommand = ParameterUpdateCommand | ReplaceDesignCommand;

export type { ComputedParameter, DesignDraft, FluteParameters, ToneHoleParameters };
