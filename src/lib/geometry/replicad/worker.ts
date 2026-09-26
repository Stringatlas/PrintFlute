import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC } from "replicad";
import type { Solid } from "replicad";
import { expose } from "comlink";
import { createFluteCAD } from "$lib/geometry/replicad/fluteCAD";
import {
	fingerprintDesign,
	type ApiError,
	type ApiResult,
	type ProductionArtifact,
	type ProductionBlobArtifact,
	type ProductionJobRequest,
	type ProductionJobResult,
	type ProductionMeshArtifact,
	type ProductionMeshPart,
	type ResolvedDesignSnapshot
} from '$lib/api/generation';
import type { FluteParameters, ToneHoleParameters } from '$lib/domain/fluteTypes';
import {
	ProductionJobState,
	productionCacheKey,
	productionOutputNames,
	validateProductionRequest
} from './production';

interface MeshData {
    faces: unknown;
    edges: unknown;
    parts?: Array<{
        faces: unknown;
        edges: unknown;
    }>;
}

let loaded = false;

const init = async (): Promise<void> => {
    if (loaded) return;
    // @ts-ignore
    const OC = await opencascade({ locateFile: () => opencascadeWasm }); 
    setOC(OC);
    loaded = true;
};

const started = init();

interface CacheEntry {
	full: Solid;
	parts: Solid[];
	artifacts: Map<string, ProductionArtifact>;
}

const cache = new Map<string, CacheEntry>();
const jobs = new ProductionJobState();
const MAX_CACHE_ENTRIES = 4;

function errorResult(code: ApiError['code'], message: string, error?: unknown): ApiResult<never> {
	return {
		ok: false,
		error: {
			code,
			message,
			...(error === undefined
				? {}
				: { details: { cause: error instanceof Error ? error.message : String(error) } })
		}
	};
}

function cancelled(jobId: string): ApiResult<never> | undefined {
	return jobs.isCancelled(jobId)
		? errorResult('CANCELLED', `Production job ${jobId} was cancelled`)
		: undefined;
}

function resolvedParameters(snapshot: ResolvedDesignSnapshot): {
	flute: FluteParameters;
	toneHoles: ToneHoleParameters;
} {
	return {
		flute: {
			...snapshot.design.flute,
			corkDistance: { mode: 'manual', value: snapshot.resolved.corkDistance },
			corkThickness: { mode: 'manual', value: snapshot.resolved.corkThickness }
		},
		toneHoles: snapshot.design.toneHoles
	};
}

function remember(fingerprint: string, entry: CacheEntry): CacheEntry {
	cache.delete(fingerprint);
	cache.set(fingerprint, entry);
	while (cache.size > MAX_CACHE_ENTRIES) {
		const oldest = cache.keys().next().value;
		if (oldest === undefined) break;
		cache.delete(oldest);
	}
	return entry;
}

function getOrCreateCAD(snapshot: ResolvedDesignSnapshot): CacheEntry {
	const existing = cache.get(snapshot.fingerprint);
	if (existing) return remember(snapshot.fingerprint, existing);
	const { flute, toneHoles } = resolvedParameters(snapshot);
	const result = createFluteCAD(flute, toneHoles);
	return remember(snapshot.fingerprint, {
		full: result.full,
		parts: result.parts?.length ? result.parts : [result.full],
		artifacts: new Map()
	});
}

function getOrCreateLegacyCAD(
	flute: FluteParameters,
	toneHoles: ToneHoleParameters
): CacheEntry {
	const fingerprint = fingerprintDesign({ flute, toneHoles });
	const existing = cache.get(fingerprint);
	if (existing) return remember(fingerprint, existing);
	const result = createFluteCAD(flute, toneHoles);
	return remember(fingerprint, {
		full: result.full,
		parts: result.parts?.length ? result.parts : [result.full],
		artifacts: new Map()
	});
}

function numericArray(value: unknown): number[] {
	if (Array.isArray(value) || ArrayBuffer.isView(value)) return Array.from(value as ArrayLike<number>);
	return [];
}

function toMeshPart(name: string, solid: Solid, linear: number, angular: number): ProductionMeshPart {
	const mesh = solid.mesh({ tolerance: linear, angularTolerance: angular }) as unknown as {
		vertices?: unknown;
		positions?: unknown;
		triangles?: unknown;
		indices?: unknown;
		normals?: unknown;
	};
	const normals = numericArray(mesh.normals);
	return {
		name,
		positions: numericArray(mesh.vertices ?? mesh.positions),
		indices: numericArray(mesh.triangles ?? mesh.indices),
		...(normals.length ? { normals } : {})
	};
}

async function createArtifact(
	entry: CacheEntry,
	request: ProductionJobRequest
): Promise<ProductionArtifact> {
	const key = productionCacheKey(request.artifact);
	const existing = entry.artifacts.get(key);
	if (existing) return existing;

	const solids = request.artifact.scope === 'full' ? [entry.full] : entry.parts;
	let artifact: ProductionArtifact;
	if (request.artifact.kind === 'mesh') {
		const linear = request.artifact.linearDeflection ?? 0.01;
		const angular = request.artifact.angularDeflection ?? 0.1;
		artifact = {
			kind: 'mesh',
			parts: solids.map((solid, index) =>
				toMeshPart(request.artifact.scope === 'full' ? 'flute' : `flute-part-${index + 1}`, solid, linear, angular)
			)
		} satisfies ProductionMeshArtifact;
	} else {
		const names = productionOutputNames(request.artifact.kind, request.artifact.scope, solids.length);
		const files = await Promise.all(
			solids.map(async (solid, index) => ({
				name: names[index],
				blob: request.artifact.kind === 'stl' ? await solid.blobSTL() : await solid.blobSTEP()
			}))
		);
		artifact = { kind: request.artifact.kind, files } satisfies ProductionBlobArtifact;
	}
	entry.artifacts.set(key, artifact);
	return artifact;
}

async function build(request: ProductionJobRequest): Promise<ApiResult<ProductionJobResult>> {
	const valid = validateProductionRequest(request);
	if (!valid.ok) return valid;
	jobs.begin(request.jobId);
	let stopped = cancelled(request.jobId);
	if (stopped) return stopped;

	try {
		await started;
	} catch (error) {
		return errorResult('CAD_INIT_FAILED', 'OpenCascade initialization failed', error);
	}
	stopped = cancelled(request.jobId);
	if (stopped) return stopped;

	let entry: CacheEntry;
	try {
		entry = getOrCreateCAD(request.snapshot);
	} catch (error) {
		return errorResult('CAD_BUILD_FAILED', 'Flute solid construction failed', error);
	}
	stopped = cancelled(request.jobId);
	if (stopped) return stopped;

	try {
		const artifact = await createArtifact(entry, request);
		stopped = cancelled(request.jobId);
		if (stopped) return stopped;
		return {
			ok: true,
			value: {
				jobId: request.jobId,
				revision: request.revision,
				fingerprint: request.fingerprint,
				artifact
			}
		};
	} catch (error) {
		return errorResult('CAD_EXPORT_FAILED', 'Replicad artifact generation failed', error);
	}
}

async function cancel(jobId: string) {
	return { ok: true as const, value: { jobId, cancelled: jobs.cancel(jobId) } };
}


async function createFluteMesh(
  fluteParams: FluteParameters,
  toneHoleParams: ToneHoleParameters
): Promise<MeshData> {
  await started;
  const entry = getOrCreateLegacyCAD(fluteParams, toneHoleParams);
  const { full, parts } = entry;
  
  const meshData: MeshData = {
    faces: full.mesh({ tolerance: 0.01, angularTolerance: 30 }),
    edges: full.meshEdges({ tolerance: 0.01, angularTolerance: 30 }),
  };

  if (parts.length > 1) {
    meshData.parts = parts.map(part => ({
      faces: part.mesh({ tolerance: 0.01, angularTolerance: 30 }),
      edges: part.meshEdges({ tolerance: 0.01, angularTolerance: 30 }),
    }));
  }

  return meshData;
}

async function exportFluteSTL(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob> {
    await started;
    const entry = getOrCreateLegacyCAD(fluteParams, toneHoleParams);
    return entry.full.blobSTL();
}

async function exportFluteSTEP(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob> {
    await started;
    const entry = getOrCreateLegacyCAD(fluteParams, toneHoleParams);
    return entry.full.blobSTEP();
}

async function exportPartsSTL(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob[]> {
    await started;
    const { parts } = getOrCreateLegacyCAD(fluteParams, toneHoleParams);
    if (parts.length <= 1) {
        return [];
    }
    return Promise.all(parts.map(part => part.blobSTL()));
}

async function exportPartsSTEP(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob[]> {
    await started;
    const { parts } = getOrCreateLegacyCAD(fluteParams, toneHoleParams);
    if (parts.length <= 1) {
        return [];
    }
    return Promise.all(parts.map(part => part.blobSTEP()));
}

expose({ 
	build,
	cancel,
    createFluteMesh,
    exportFluteSTL,
    exportFluteSTEP,
    exportPartsSTL,
    exportPartsSTEP,
});
