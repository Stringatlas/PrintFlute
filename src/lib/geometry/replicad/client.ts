import { releaseProxy, wrap, type Remote } from 'comlink';
import type {
	ApiResult,
	CancelProductionResult,
	ProductionJobRequest,
	ProductionJobResult,
	ReplicadProductionService
} from '$lib/api/generation';
import { validateProductionRequest, validateProductionResult } from './production';

export interface ReplicadWorkerApi extends ReplicadProductionService {
	createFluteMesh(...args: unknown[]): Promise<unknown>;
	exportFluteSTL(...args: unknown[]): Promise<Blob>;
	exportFluteSTEP(...args: unknown[]): Promise<Blob>;
	exportPartsSTL(...args: unknown[]): Promise<Blob[]>;
	exportPartsSTEP(...args: unknown[]): Promise<Blob[]>;
}

export interface WorkerEndpoint {
	postMessage(message: unknown, transfer?: Transferable[]): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
	terminate(): void;
}

export class ReplicadProductionClient implements ReplicadProductionService {
	private readonly remote: Remote<ReplicadWorkerApi>;
	private sequence = 0;
	private terminated = false;

	constructor(private readonly worker: WorkerEndpoint) {
		this.remote = wrap<ReplicadWorkerApi>(worker);
	}

	async build(request: ProductionJobRequest): Promise<ApiResult<ProductionJobResult>> {
		if (this.terminated) {
			return {
				ok: false,
				error: { code: 'CAD_INIT_FAILED', message: 'Replicad worker has been terminated' }
			};
		}
		const validated = validateProductionRequest(request);
		if (!validated.ok) return validated;

		const buildSequence = ++this.sequence;
		try {
			const result = await this.remote.build(request);
			if (buildSequence !== this.sequence) {
				return {
					ok: false,
					error: { code: 'STALE_JOB', message: 'A newer production job superseded this result' }
				};
			}
			if (!result.ok) return result;
			return validateProductionResult(request, result.value);
		} catch (error) {
			return {
				ok: false,
				error: {
					code: 'CAD_BUILD_FAILED',
					message: 'Replicad worker communication failed',
					details: { cause: error instanceof Error ? error.message : String(error) },
					retryable: true
				}
			};
		}
	}

	async cancel(jobId: string): Promise<ApiResult<CancelProductionResult>> {
		if (this.terminated) return { ok: true, value: { jobId, cancelled: false } };
		this.sequence += 1;
		try {
			return await this.remote.cancel(jobId);
		} catch (error) {
			return {
				ok: false,
				error: {
					code: 'CAD_BUILD_FAILED',
					message: 'Could not cancel the Replicad job',
					details: { cause: error instanceof Error ? error.message : String(error) }
				}
			};
		}
	}

	terminate(): void {
		if (this.terminated) return;
		this.terminated = true;
		this.sequence += 1;
		this.remote[releaseProxy]();
		this.worker.terminate();
	}
}
