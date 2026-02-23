## Overview
Web tool: design 3D printed flutes → generate STL files + predict pitches → analyze real audio to validate.

**Stack**: Svelte, Three.js (Mesh preview), Tailwind CSS, Replicad (CAD kernel), Web Audio API, STL/STEP export

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
2. **Single responsibility per file** - If it's >300 lines, split it
3. **No magic numbers** - `SPEED_OF_SOUND_M_S` not `343`
4. **Don't couple layers** - Acoustics shouldn't import Three.js, geometry shouldn't import stores
5. **Do not use emojis anywhere** - Either use placeholder icons or proper SVGs
6. **Do not add comments for self-explanatory code**

## Anti-Patterns
- One huge component (>300 lines)
- Mixing calculations + UI in same function
- Mutating global state instead of returning values
