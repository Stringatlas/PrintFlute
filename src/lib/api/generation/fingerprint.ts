import type { DesignDraft, DesignFingerprint } from './contracts';

function canonicalize(value: unknown, ancestors: Set<object>): string {
	if (value === null) return 'null';

	switch (typeof value) {
		case 'string':
		case 'boolean':
			return JSON.stringify(value);
		case 'number':
			if (!Number.isFinite(value)) throw new TypeError('Fingerprint input contains a non-finite number');
			return Object.is(value, -0) ? '0' : JSON.stringify(value);
		case 'object': {
			if (ancestors.has(value)) throw new TypeError('Fingerprint input contains a cycle');
			ancestors.add(value);
			let result: string;
			if (Array.isArray(value)) {
				result = `[${value.map((entry) => canonicalize(entry, ancestors)).join(',')}]`;
			} else {
				const record = value as Record<string, unknown>;
				const entries = Object.keys(record)
					.sort()
					.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key], ancestors)}`);
				result = `{${entries.join(',')}}`;
			}
			ancestors.delete(value);
			return result;
		}
		default:
			throw new TypeError(`Fingerprint input contains unsupported ${typeof value}`);
	}
}

/** Stable JSON representation with recursively sorted object keys. */
export function canonicalJson(value: unknown): string {
	return canonicalize(value, new Set());
}

function fnv1a32(value: string, seed: number): number {
	let hash = seed >>> 0;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

/**
 * Deterministic, non-cryptographic design identity.
 *
 * This is for cache/staleness checks, not tamper detection. Both hashes cover
 * canonical JSON to reduce accidental collisions while remaining synchronous
 * in browsers and workers.
 */
export function fingerprintDesign(design: DesignDraft): DesignFingerprint {
	const canonical = canonicalJson(design);
	const left = fnv1a32(canonical, 0x811c9dc5).toString(16).padStart(8, '0');
	const right = fnv1a32(canonical, 0x9e3779b9).toString(16).padStart(8, '0');
	return `fg1-${left}${right}`;
}
