<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { wrap } from "comlink";
  import "replicad-opencascadejs/src/replicad_single.wasm?url";
  import { fluteParams, toneHoleParams } from "$lib/stores/fluteStore";

  let ReplicadViewer;
  let mesh = null;
  let loading = true;
  let error = null;
  let cad = null;
  let exportFormat = "stl";

  $: if (cad && $fluteParams && $toneHoleParams) {
    updateMesh();
  }

  onMount(async () => {
    try {
      ReplicadViewer = (await import("$lib/geometry/replicad/ReplicadViewer.svelte")).default;
      const CadWorker = (await import("$lib/geometry/replicad/worker?worker")).default;
      cad = wrap(new CadWorker());
      await updateMesh();
    } catch (e) {
      error = e.message;
      loading = false;
    }
  });

  async function updateMesh() {
    if (!cad || !$fluteParams || !$toneHoleParams) return;
    loading = true;
    error = null;
    try {
      mesh = await cad.createFluteMesh($fluteParams, $toneHoleParams);
    } catch (e) {
      error = e.message;
    }
    loading = false;
  }

  async function downloadFile() {
    if (!cad) return;
    let blob;
    if (exportFormat === "stl") {
      blob = await cad.exportFluteSTL($fluteParams, $toneHoleParams);
    } else {
      blob = await cad.exportFluteSTEP($fluteParams, $toneHoleParams);
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flute.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="max-w-4xl mx-auto p-8">
  <h1 class="text-3xl font-bold mb-6">Replicad Flute Preview</h1>

  <div class="flex flex-col gap-4 mb-6 p-6 bg-neutral-700 rounded-lg">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span class="text-neutral-400">Bore:</span>
        <span class="font-medium">{$fluteParams?.boreDiameter ?? 0}mm</span>
      </div>
      <div>
        <span class="text-neutral-400">Wall:</span>
        <span class="font-medium">{$fluteParams?.wallThickness ?? 0}mm</span>
      </div>
      <div>
        <span class="text-neutral-400">Length:</span>
        <span class="font-medium">{$fluteParams?.fluteLength ?? 0}mm</span>
      </div>
      <div>
        <span class="text-neutral-400">Holes:</span>
        <span class="font-medium">{$fluteParams?.numberOfToneHoles ?? 0}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-end gap-4 pt-4 border-t border-neutral-600">
      <label class="flex flex-col gap-1 text-sm">
        <span class="font-medium">Export Format</span>
        <select 
          bind:value={exportFormat}
          class="min-w-30 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="stl">STL</option>
          <option value="step">STEP</option>
        </select>
      </label>
      <button 
        on:click={downloadFile} 
        disabled={loading}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Download {exportFormat.toUpperCase()}
      </button>
    </div>
  </div>

  {#if error}
    <div class="p-4 bg-red-100 text-red-800 rounded-lg">
      <strong>Error:</strong> {error}
    </div>
  {:else if loading}
    <div class="p-8 text-center text-neutral-400">
      Loading OpenCascade...
    </div>
  {:else if mesh && ReplicadViewer}
    <svelte:component this={ReplicadViewer} faces={mesh.faces} edges={mesh.edges} />
  {/if}
</div>
