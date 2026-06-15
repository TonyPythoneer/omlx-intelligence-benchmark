import { describe, it, expect } from "vite-plus/test";
import { ref } from "vue";
import { useImport } from "./useImport";
import type { Entry } from "../types/benchmark";

const makeBenchmarkText = (model: string) => `Model: ${model}
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 80.0%        24      30     492.9     Yes
TRUTHFULQA           75.0%        15      20     138.8     Yes`;

const makeEntry = (model: string, overrides: Partial<Entry> = {}): Entry => ({
  model,
  date: "2026-05-25",
  spec: { parameters_b: 7, quantization: "4bit", size_gb: 14 },
  deprecated: false,
  tiers: { opus: false, sonnet: false, haiku: false },
  abilities: { thinking: false, mtp: false },
  scores: { MMLU: { accuracy: 40.0, samples: 30, time_s: 100.0 } },
  ...overrides,
});

describe("useImport", () => {
  describe("merge NEW entries", () => {
    it("creates Entry with auto-detected spec from model name", () => {
      const currentEntries = ref<Entry[]>([]);
      const { importText, applyImport } = useImport(currentEntries);

      importText.value = makeBenchmarkText("TestModel-20B-MLX-8bit");
      applyImport(currentEntries);

      expect(currentEntries.value).toHaveLength(1);
      const entry = currentEntries.value[0];
      expect(entry.model).toBe("TestModel-20B-MLX-8bit");
      expect(entry.spec.parameters_b).toBe(20);
      expect(entry.spec.quantization).toBe("8bit");
      expect(entry.spec.size_gb).toBeNull();
      expect(entry.abilities?.thinking).toBe(false);
      expect(entry.abilities?.mtp).toBe(false);
      expect(entry.tiers.opus).toBe(false);
      expect(entry.tiers.sonnet).toBe(false);
      expect(entry.tiers.haiku).toBe(false);
      expect(entry.deprecated).toBe(false);
      expect(entry.scores.MMLU).toEqual({ accuracy: 80.0, samples: 30, time_s: 492.9 });
      expect(entry.scores.TRUTHFULQA).toEqual({ accuracy: 75.0, samples: 20, time_s: 138.8 });
    });

    it("parses Q-style quantization from model name", () => {
      const currentEntries = ref<Entry[]>([]);
      const { importText, applyImport } = useImport(currentEntries);

      importText.value = makeBenchmarkText("Qwen3-35B-MLX-oQ4-MTP");
      applyImport(currentEntries);

      const entry = currentEntries.value[0];
      expect(entry.spec.parameters_b).toBe(35);
      expect(entry.spec.quantization).toBe("Q4");
    });
  });

  describe("merge OVERWRITE entries", () => {
    it("preserves spec/tiers/abilities/deprecated on score-only update", () => {
      const existing = makeEntry("existing-model", {
        spec: { parameters_b: 35, quantization: "4bit", size_gb: 18 },
        deprecated: true,
        tiers: { opus: true, sonnet: false, haiku: false },
        abilities: { thinking: true, mtp: false },
      });
      const currentEntries = ref<Entry[]>([existing]);
      const { importText, applyImport } = useImport(currentEntries);

      importText.value = makeBenchmarkText("existing-model");
      applyImport(currentEntries);

      expect(currentEntries.value).toHaveLength(1);
      const entry = currentEntries.value[0];
      expect(entry.date).toBe("2026-05-25");
      expect(entry.spec.parameters_b).toBe(35);
      expect(entry.spec.quantization).toBe("4bit");
      expect(entry.spec.size_gb).toBe(18);
      expect(entry.deprecated).toBe(true);
      expect(entry.tiers.opus).toBe(true);
      expect(entry.abilities?.thinking).toBe(true);
      expect(entry.scores.MMLU).toEqual({ accuracy: 80.0, samples: 30, time_s: 492.9 });
      expect(entry.scores.TRUTHFULQA).toEqual({ accuracy: 75.0, samples: 20, time_s: 138.8 });
    });
  });

  describe("merge mixed NEW and OVERWRITE", () => {
    it("handles batch of NEW + OVERWRITE in one apply", () => {
      const currentEntries = ref<Entry[]>([makeEntry("model-a")]);
      const { importText, applyImport } = useImport(currentEntries);

      importText.value = `Model: model-a
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 50.0%        15      30     120.0     Yes
Model: NewModel-13B-MLX-4bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 60.0%        18      30     150.0     Yes`;

      applyImport(currentEntries);

      expect(currentEntries.value).toHaveLength(2);

      const modelA = currentEntries.value.find((e) => e.model === "model-a");
      expect(modelA!.date).toBe("2026-05-25");
      expect(modelA!.spec.parameters_b).toBe(7);
      expect(modelA!.scores.MMLU.accuracy).toBe(50.0);

      const modelB = currentEntries.value.find((e) => e.model === "NewModel-13B-MLX-4bit");
      expect(modelB!.spec.parameters_b).toBe(13);
      expect(modelB!.spec.quantization).toBe("4bit");
      expect(modelB!.deprecated).toBe(false);
      expect(modelB!.scores.MMLU.accuracy).toBe(60.0);
    });
  });

  describe("merge empty list", () => {
    it("does nothing when import text is empty", () => {
      const currentEntries = ref<Entry[]>([makeEntry("original")]);
      const { importText, applyImport } = useImport(currentEntries);

      importText.value = "";
      applyImport(currentEntries);

      expect(currentEntries.value).toHaveLength(1);
      expect(currentEntries.value[0].model).toBe("original");
    });
  });

  describe("modal state clearing", () => {
    it("clears isModalOpen and importText after apply", () => {
      const currentEntries = ref<Entry[]>([]);
      const { isModalOpen, importText, applyImport } = useImport(currentEntries);

      isModalOpen.value = true;
      importText.value = makeBenchmarkText("TestModel-7B-8bit");
      applyImport(currentEntries);

      expect(isModalOpen.value).toBe(false);
      expect(importText.value).toBe("");
    });
  });
});
