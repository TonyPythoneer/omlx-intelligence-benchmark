import { ref, computed, watch, type Ref } from "vue";
import { type Entry, type Scores } from "../types/benchmark";
// @ts-ignore — import.mjs has no types
import { parseImportInput, mergeImport } from "../lib/import.mjs";

interface ParsedResult {
  model: string;
  scores: Scores;
  scores_no_thinking?: Scores;
  status: "NEW" | "OVERWRITE";
  spec: {
    parameters_b: number | null;
    quantization: string;
    size_gb: number | null;
  };
  sizeFetching: boolean;
}

export async function fetchModelSize(modelName: string): Promise<number | null> {
  try {
    // Filter to MLX library repos only — these are the only ones that show a meaningful single size
    const searchRes = await fetch(
      `https://huggingface.co/api/models?search=${encodeURIComponent(modelName)}&library=mlx&limit=5`,
    );
    if (!searchRes.ok) return null;
    const models: Array<{ id: string }> = await searchRes.json();
    if (!models.length) return null;
    // Prefer exact repo name match, otherwise take first MLX result
    const match = models.find((m) => m.id.split("/").pop() === modelName) ?? models[0];
    const detailRes = await fetch(`https://huggingface.co/api/models/${match.id}?blobs=true`);
    if (!detailRes.ok) return null;
    const detail: { siblings?: Array<{ rfilename: string; size?: number }> } =
      await detailRes.json();
    const totalBytes = (detail.siblings ?? [])
      .filter((f) => f.rfilename.endsWith(".safetensors"))
      .reduce((sum, f) => sum + (f.size ?? 0), 0);
    return totalBytes > 0 ? parseFloat((totalBytes / 1024 ** 3).toFixed(2)) : null;
  } catch {
    return null;
  }
}

export function useImport(currentEntries: Ref<Entry[]>) {
  const isModalOpen = ref<boolean>(false);
  const importText = ref<string>("");
  const modelSizes = ref<Record<string, number | null>>({});
  const sizeFetching = ref<Record<string, boolean>>({});

  function getTodaysDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  function getRawParsedResults(): Array<{
    model: string;
    scores: Scores;
    scores_no_thinking?: Scores;
  }> {
    if (!importText.value.trim()) return [];
    try {
      return parseImportInput(importText.value);
    } catch {
      return [];
    }
  }

  watch(importText, (text) => {
    if (!text.trim()) {
      modelSizes.value = {};
      sizeFetching.value = {};
      return;
    }
    // Use already-computed parsedEntries to avoid re-parsing and to get NEW/OVERWRITE status
    for (const entry of parsedEntries.value) {
      if (
        entry.status === "NEW" &&
        !(entry.model in modelSizes.value) &&
        !(entry.model in sizeFetching.value)
      ) {
        sizeFetching.value = { ...sizeFetching.value, [entry.model]: true };
        void fetchModelSize(entry.model).then((size) => {
          modelSizes.value = { ...modelSizes.value, [entry.model]: size };
          const next = { ...sizeFetching.value };
          delete next[entry.model];
          sizeFetching.value = next;
        });
      }
    }
  });

  const parsedEntries = computed<ParsedResult[]>(() => {
    const raw = getRawParsedResults();
    const existingModels = new Set(currentEntries.value.map((e) => e.model));

    return raw.map((result) => {
      const status = existingModels.has(result.model) ? "OVERWRITE" : "NEW";
      return {
        model: result.model,
        scores: result.scores,
        scores_no_thinking: result.scores_no_thinking,
        status,
        spec: {
          parameters_b: null,
          quantization: "",
          size_gb: modelSizes.value[result.model] ?? null,
        },
        sizeFetching: sizeFetching.value[result.model] ?? false,
      };
    });
  });

  const isApplyEnabled = computed<boolean>(
    () =>
      importText.value.trim().length > 0 &&
      parsedEntries.value.length > 0 &&
      Object.keys(sizeFetching.value).length === 0,
  );

  function applyImport(mutableEntries: Ref<Entry[]>): void {
    const detected = parsedEntries.value.map((p) => ({
      model: p.model,
      spec: p.spec,
      scores: p.scores,
      scores_no_thinking: p.scores_no_thinking,
    }));
    mutableEntries.value = mergeImport(mutableEntries.value, detected, getTodaysDate()) as Entry[];
    closeModal();
  }

  function openModal(): void {
    isModalOpen.value = true;
  }

  function closeModal(): void {
    isModalOpen.value = false;
    importText.value = "";
    modelSizes.value = {};
    sizeFetching.value = {};
  }

  return {
    isModalOpen,
    importText,
    parsedEntries,
    isApplyEnabled,
    openModal,
    closeModal,
    applyImport,
  };
}
