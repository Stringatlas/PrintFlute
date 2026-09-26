# Generation contract

## Data and ownership

`DesignDraft` wraps the existing `FluteParameters` and `ToneHoleParameters` unchanged so persisted designs and current UI code remain compatible. The evaluator normalizes a draft and is the sole owner of these derived compatibility fields:

- `flute.embouchureDistance` and `flute.fluteLength`
- `toneHoles.holeDistances` and `toneHoles.cutoffRatios`

Incoming values for those fields must not influence evaluation. The normalized values are returned in `snapshot.design`; their explicit projection is also returned as `snapshot.calculation.updates`. `snapshot.resolved` owns final auto/manual cork values, while `snapshot.calculation.data` owns raw acoustic output. Consumers must not recalculate or write back any of them.

All lengths, diameters, radii, positions, and linear tolerances are millimetres. Frequencies are Hz, tuning offsets are cents, percentages are 0–100, cutoff ratios are dimensionless, `thumbHoleAngle` is degrees, and production `angularDeflection` is radians.

The canonical physical axis starts at the open/base end at axial position 0 and increases toward the head end. Tone-hole, embouchure, and cut distances use this axis. Replicad maps it to +Z. Three.js maps it to +X and centres the finished body at the origin; that conversion is presentation-only. Tone holes face the positive radial/front direction. A zero-degree thumb-hole angle is opposite the tone holes and positive angles rotate toward the side.

## Snapshot identity

`schemaVersion` versions persisted/transported DTO semantics. `revision` is a controller-issued, monotonically increasing edit generation. `fingerprint` is derived from the normalized design with `fingerprintDesign`; it is stable across object key order but is not cryptographic.

An evaluation result is publishable only if its revision is still current. Preview and production accept only a complete `ResolvedDesignSnapshot`. A production request repeats the snapshot revision and fingerprint; implementations must reject a mismatch as `STALE_JOB`. Results echo `jobId`, `revision`, and `fingerprint`, and consumers must discard results that no longer match current state.

## Lifecycle and failures

All service failures are returned as `ApiResult`, not thrown for expected domain or lifecycle failures. Unexpected programmer errors may still throw. Validation errors use `VALIDATION_FAILED`; warnings remain on successful snapshots. Calculation, preview, CAD initialization/build/export, cancellation, stale-job, and storage failures use the corresponding stable error code.

Each successful preview owns its Three.js `root` and a synchronous, idempotent `dispose`. The caller disposes replaced or abandoned previews exactly once and never persists either runtime value.

Production requests are plain serializable data. Mesh results are structured-cloneable; export `Blob`s are explicitly runtime-only. `cancel(jobId)` is cooperative: it requests cancellation, and a cancelled build resolves with `CANCELLED`. Cancellation is idempotent and does not make an older result current. Services may cache immutable CAD solids by fingerprint, but must not reuse them across differing fingerprints. `scope: "parts"` means one artifact per printable section; `"full"` means one assembled flute.
