
import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC } from "replicad";
import { expose } from "comlink";
import { createBox, createCylinder } from "$lib/geometry/replicad/testcad";
import { createFluteCAD } from "$lib/geometry/replicad/fluteCAD";
import type { FluteParameters, ToneHoleParameters } from "$lib/stores/fluteStore";

interface MeshData {
    faces: unknown;
    edges: unknown;
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

async function createBoxMesh(
  width: number,
  height: number,
  depth: number,
  fillet: number
): Promise<MeshData> {
  await started;
  const shape = createBox(width, height, depth, fillet);
  return {
    faces: shape.mesh({ tolerance: 0.01, angularTolerance: 30 }),
    edges: shape.meshEdges({ tolerance: 0.01, angularTolerance: 30 }),
  };
}

async function createCylinderMesh(
  radius: number,
  height: number
): Promise<MeshData> {
  await started;
  const shape = createCylinder(radius, height);
  return {
    faces: shape.mesh({ tolerance: 0.01, angularTolerance: 30 }),
    edges: shape.meshEdges({ tolerance: 0.01, angularTolerance: 30 }),
  };
}

async function createFluteMesh(
  fluteParams: FluteParameters,
  toneHoleParams: ToneHoleParameters
): Promise<MeshData> {
  await started;
  const { solid } = createFluteCAD(fluteParams, toneHoleParams);
  return {
    faces: solid.mesh({ tolerance: 0.01, angularTolerance: 30 }),
    edges: solid.meshEdges({ tolerance: 0.01, angularTolerance: 30 }),
  };
}

async function exportBoxSTL(width: number, height: number, depth: number, fillet: number): Promise<Blob> {
  await started;
  return createBox(width, height, depth, fillet).blobSTL();
}

async function exportBoxSTEP(width: number, height: number, depth: number, fillet: number): Promise<Blob> {
  await started;
  return createBox(width, height, depth, fillet).blobSTEP();
}

async function exportCylinderSTL(radius: number, height: number): Promise<Blob> {
  await started;
  return createCylinder(radius, height).blobSTL();
}

async function exportCylinderSTEP(radius: number, height: number): Promise<Blob> {
  await started;
  return createCylinder(radius, height).blobSTEP();
}

async function exportFluteSTL(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob> {
    await started;
    const { solid } = createFluteCAD(fluteParams, toneHoleParams);
    return solid.blobSTL();
}

async function exportFluteSTEP(fluteParams: FluteParameters, toneHoleParams: ToneHoleParameters): Promise<Blob> {
    await started;
    const { solid } = createFluteCAD(fluteParams, toneHoleParams);
    return solid.blobSTEP();
}

expose({ 
    createBoxMesh, 
    createCylinderMesh, 
    createFluteMesh,
    exportBoxSTL, 
    exportBoxSTEP, 
    exportCylinderSTL, 
    exportCylinderSTEP,
    exportFluteSTL,
    exportFluteSTEP,
});
