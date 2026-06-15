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

function parseParamsB(name: string): number | null {
  const m = name.match(/(?:^|[-_])(\d+(?:\.\d+)?)B(?:[-_]|$)/i);
  return m ? parseFloat(m[1]) : null;
}

function parseQuantization(name: string): string {
  // 4bit, 8bit, 2bit
  let m = name.match(/(?:^|[-_])(\d+bit)(?:[-_]|$)/i);
  if (m) return m[1].toLowerCase();
  // oQ4, Q4, Q8 — strip optional leading 'o'
  m = name.match(/(?:^|[-_])o?[Qq](\d+)(?:[-_]|$)/);
  if (m) return `Q${m[1]}`;
  // qx86, qx128
  m = name.match(/(?:^|[-_])(qx\d+)(?:[-_]|$)/i);
  if (m) return m[1].toLowerCase();
  return "";
}

async function fetchModelSize(modelName: string): Promise<number | null> {
  try {
    const searchRes = await fetch(
      `https://huggingface.co/api/models?search=${encodeURIComponent(modelName)}&limit=5`,
    );
    if (!searchRes.ok) return null;
    const models: Array<{ id: string }> = await searchRes.json();
    if (!models.length) return null;
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
          parameters_b: parseParamsB(result.model),
          quantization: parseQuantization(result.model),
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
