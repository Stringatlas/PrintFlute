# Graph Report - flute-generator  (2026-08-20)

## Corpus Check
- 88 files · ~122,977 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 389 nodes · 616 edges · 26 communities (22 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Audio Analysis
- Geometry Generation
- Runtime Dependencies
- Build Dependencies
- Design Controls
- Analysis UI
- 3D Preview Camera
- CAD Construction
- Flute State Stores
- Acoustic Calculations
- TypeScript Configuration
- Model Export
- Acoustic Corrections
- Library and Modals
- Spectrogram Rendering
- SvelteKit Configuration
- Mesh State
- Application Types

## God Nodes (most connected - your core abstractions)
1. `FluteParameters` - 15 edges
2. `FluteCADBuilder` - 12 edges
3. `AudioCapture` - 11 edges
4. `resolveComputedParameter()` - 11 edges
5. `ToneHoleParameters` - 11 edges
6. `compilerOptions` - 11 edges
7. `SpectrogramRenderer` - 10 edges
8. `AudioAnalyzer` - 9 edges
9. `calculateFlutePositions()` - 8 edges
10. `createFullFluteGeometry()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ParameterTrigger` --references--> `FluteParameters`  [EXTRACTED]
  src/lib/components/generation/cameraAnimations.ts → src/lib/stores/fluteStore.ts
- `updateGeometry()` --calls--> `createGeometryForStep()`  [EXTRACTED]
  src/lib/components/generation/Preview3D.svelte → src/lib/components/generation/geometryManager.ts
- `handleSelectChange()` --calls--> `onChange()`  [INFERRED]
  src/lib/components/generation/form-elements/FrequencySelector.svelte → src/lib/components/generation/form-elements/ParameterControl.svelte
- `handleCustomInput()` --calls--> `onChange()`  [INFERRED]
  src/lib/components/generation/form-elements/FrequencySelector.svelte → src/lib/components/generation/form-elements/ParameterControl.svelte
- `resetToDefault()` --calls--> `onChange()`  [INFERRED]
  src/lib/components/generation/form-elements/FrequencySelector.svelte → src/lib/components/generation/form-elements/ParameterControl.svelte

## Import Cycles
- None detected.

## Communities (26 total, 4 thin omitted)

### Community 0 - "Audio Analysis"
Cohesion: 0.07
Nodes (22): AudioAnalysisResult, AudioAnalyzer, extractHarmonicsFromSpectrum(), TimbreMetrics, AudioBuffers, AudioCapture, FFT_SIZE, MAX_DECIBELS (+14 more)

### Community 1 - "Geometry Generation"
Cohesion: 0.10
Nodes (29): getDefaultCorkDistance(), getDefaultCorkThickness(), resolveComputedParameter(), createGeometryForStep(), createFullFluteGeometry(), FullFluteGeometryResult, TODO: Use tube helper function to simplify geometry creation, createHeadJointGeometry() (+21 more)

### Community 2 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (36): bootstrap-icons, chart.js, meyda, dependencies, bootstrap-icons, chart.js, comlink, meyda (+28 more)

### Community 3 - "Build Dependencies"
Cohesion: 0.06
Nodes (35): autoprefixer, devDependencies, autoprefixer, postcss, sass, svelte, svelte-check, @sveltejs/adapter-auto (+27 more)

### Community 4 - "Design Controls"
Cohesion: 0.09
Nodes (12): handleCustomInput(), handleSelectChange(), resetToDefault(), onChange(), PARAMETER_INFO, MIN_CONNECTOR_SPACING, ValidationResult, COMMON_FREQUENCIES (+4 more)

### Community 5 - "Analysis UI"
Cohesion: 0.10
Nodes (6): complete(), handleKeydown(), nextPage(), open, prevPage(), SpectrogramConfig

### Community 6 - "3D Preview Camera"
Cohesion: 0.13
Nodes (21): BIRDS_EYE_VIEW_POSE, CameraPose, cameraPoseTriggers, detectChangedParameters(), ParameterTrigger, updateCameraAnimation(), animate(), applyDesiredSectionAnalysisState() (+13 more)

### Community 7 - "CAD Construction"
Cohesion: 0.13
Nodes (14): createEllipticalHole(), createFluteCAD(), FluteCADBuilder, FluteCADResult, FIXME: Thumb hole not cutting at all, createFluteMesh(), exportFluteSTEP(), exportFluteSTL() (+6 more)

### Community 8 - "Flute State Stores"
Cohesion: 0.13
Nodes (16): ComputedParameter, createFluteStore(), createToneHoleStore(), DEFAULT_PARAMETERS, DEFAULT_TONEHOLE_PARAMETERS, fluteParams, toneHoleParams, createLibraryStore() (+8 more)

### Community 9 - "Acoustic Calculations"
Cohesion: 0.21
Nodes (15): calculateFlutePositions(), closedFHCorr(), cutoffForHole(), effWalW(), embCorr(), endCorr(), FluteHole, FluteParams (+7 more)

### Community 10 - "TypeScript Configuration"
Cohesion: 0.14
Nodes (13): ./.svelte-kit/tsconfig.json, compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule (+5 more)

### Community 11 - "Model Export"
Cohesion: 0.27
Nodes (10): downloadPartsSTEP(), downloadPartsSTL(), downloadSTEP(), downloadSTL(), generateMesh(), handleDownloadSTEP(), handleDownloadSTL(), startExport() (+2 more)

### Community 12 - "Acoustic Corrections"
Cohesion: 0.23
Nodes (12): calculateClosedHoleCorrection(), calculateEffectiveHoleHeight(), calculateEmbouchureCorrection(), calculateEndCorrection(), calculateFlutePositions(), calculateSpeedOfSound(), FluteHole, FluteParams (+4 more)

### Community 13 - "Library and Modals"
Cohesion: 0.22
Nodes (3): handleBackdropClick(), handleClose(), handleKeydown()

## Knowledge Gaps
- **104 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SpectrogramRenderer` connect `Spectrogram Rendering` to `Analysis UI`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `FluteParameters` connect `Geometry Generation` to `Flute State Stores`, `Acoustic Calculations`, `3D Preview Camera`, `CAD Construction`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Audio Analysis` be split into smaller, more focused modules?**
  _Cohesion score 0.0696969696969697 - nodes in this community are weakly interconnected._
- **Should `Geometry Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.1048780487804878 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Build Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._