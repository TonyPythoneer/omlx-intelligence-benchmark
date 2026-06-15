import { ref, computed, watch, type Ref } from "vue";
import { type Entry, type Scores } from "../types/benchmark";
// @ts-ignore — import.mjs has no types
import { parseImportInput } from "../lib/import.mjs";

interface ParsedResult {
  model: string;
  scores: Scores;
  status: "NEW" | "OVERWRITE";
  spec: {
    parameters_b: number | null;
    quantization: string;
    size_gb: number | null;
  };
  sizeFetching: boolean;
}

async function fetchModelSize(modelName: string): Promise<number | null> {
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

  function getRawParsedResults(): Array<{ model: string; scores: Scores }> {
    if (!importText.value.trim()) return [];
    try {
      return parseImportInput(importText.value);
    } catch {
      return [];
    }
  }

  watch(importText, async (text) => {
    if (!text.trim()) {
      modelSizes.value = {};
      sizeFetching.value = {};
      return;
    }
    const raw = getRawParsedResults();
    const existingModels = new Set(currentEntries.value.map((e) => e.model));

    for (const result of raw) {
      if (!existingModels.has(result.model) && !(result.model in modelSizes.value)) {
        sizeFetching.value = { ...sizeFetching.value, [result.model]: true };
        void fetchModelSize(result.model).then((size) => {
          modelSizes.value = { ...modelSizes.value, [result.model]: size };
          const next = { ...sizeFetching.value };
          delete next[result.model];
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
    () => importText.value.trim().length > 0 && parsedEntries.value.length > 0,
  );

  function applyImport(mutableEntries: Ref<Entry[]>): void {
    const current = mutableEntries.value;
    const today = getTodaysDate();
    const existingMap = new Map(current.map((e, i) => [e.model, i]));
    const merged = [...current];

    for (const parsed of parsedEntries.value) {
      const existingIdx = existingMap.get(parsed.model);
      if (existingIdx !== undefined) {
        merged[existingIdx] = { ...merged[existingIdx], scores: parsed.scores };
      } else {
        merged.push({
          model: parsed.model,
          date: today,
          spec: parsed.spec,
          abilities: { thinking: false, mtp: false },
          tiers: { opus: false, sonnet: false, haiku: false },
          deprecated: false,
          scores: parsed.scores,
        });
      }
    }

    mutableEntries.value = merged;
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
