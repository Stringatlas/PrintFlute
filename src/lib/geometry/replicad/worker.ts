
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC } from "replicad";
import { expose } from "comlink";
import { createFluteCAD } from "$lib/geometry/replicad/fluteCAD";
import type { FluteParameters, ToneHoleParameters } from "$lib/stores/fluteStore";

interface MeshData {
    faces: unknown;
    edges: unknown;
    parts?: Array<{
        faces: unknown;
        edges: unknown;
    }>;
}

let loaded = false;

const init = async (): Promise<boolean> => {
    if (loaded) return true;
    // @ts-ignore
    const OC = await opencascade({ locateFile: () => opencascadeWasm }); 
    loaded = true;
    setOC(OC);
    return true;
};

const started = init();


async function createFluteMesh(
  fluteParams: FluteParameters,
  toneHoleParams: ToneHoleParameters
): Promise<MeshData> {
  await started;
  const { full, parts } = createFluteCAD(fluteParams, toneHoleParams);
  
  const meshData: MeshData = {
    faces: full.mesh({ tolerance: 0.01, angularTolerance: 30 }),
    edges: full.meshEdges({ tolerance: 0.01, angularTolerance: 30 }),
  };

  if (parts && parts.length > 0) {
    meshData.parts = parts.map(part => ({
      faces: part.mesh({ tolerance: 0.01, angularTolerance: 30 }),
      edges: part.meshEdges({ tolerance: 0.01, angularTolerance: 30 }),
    }));
  }

  return meshData;
}

async function exportFluteSTL(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob> {
    await started;
    const { full } = createFluteCAD(fluteParams, toneHoleParams);
    return full.blobSTL();
}

async function exportFluteSTEP(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob> {
    await started;
    const { full } = createFluteCAD(fluteParams, toneHoleParams);
    return full.blobSTEP();
}

async function exportPartsSTL(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob[]> {
    await started;
    const { parts } = createFluteCAD(fluteParams, toneHoleParams);
    if (!parts || parts.length === 0) {
        return [];
    }
    return Promise.all(parts.map(part => part.blobSTL()));
}

async function exportPartsSTEP(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob[]> {
    await started;
    const { parts } = createFluteCAD(fluteParams, toneHoleParams);
    if (!parts || parts.length === 0) {
        return [];
    }
    return Promise.all(parts.map(part => part.blobSTEP()));
}

expose({ 
    createFluteMesh,
    exportFluteSTL,
    exportFluteSTEP,
    exportPartsSTL,
    exportPartsSTEP,
});
