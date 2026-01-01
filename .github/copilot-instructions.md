## Overview
Web tool: design 3D printed flutes → generate STL files + predict pitches → analyze real audio to validate.

**Stack**: Svelte, Three.js, Web Audio API, STL export

## Architecture: Modular by Concern
```
src/lib/
  acoustics/     # Pure calculations (freq, hole positions, fingerings)
  geometry/      # Three.js mesh generation (bore, holes, assembly)
  audio/         # Pitch detection, harmonic analysis, metrics
  export/        # STL generation
  utils/         # Math helpers, validation
components/      # Svelte UI (Designer, Preview3D, Analyzer, etc)
stores/          # State (fluteParams, analysisData)
```

## Critical Rules

1. **Pure functions everywhere possible** - Calculations separate from rendering/state
2. **Single responsibility per file** - If it's >200 lines, split it
3. **No magic numbers** - `SPEED_OF_SOUND_M_S` not `343`
4. **Don't couple layers** - Acoustics shouldn't import Three.js, geometry shouldn't import stores
5. **Do not use emojis anywhere** - Either use placeholder icons or proper SVGs

## Anti-Patterns

- Adding comments for self-explanatory code
- One 1000-line component
- Mixing calculations + UI in same function
- Mutating global state instead of returning values


## Phases

1. Core: params → calculations → 3D → STL
2. Analysis: mic input → pitch detection → compare predicted/actual
3. Refinement: quality metrics, adjustments, save/load

## Notes
- Debounce 3D regeneration on param changes
- 4096 FFT size for audio (good freq resolution/latency balance)
- Reuse Three.js geometries