import { describe, it, expect, beforeEach } from "vite-plus/test";
import { ref } from "vue";
import { useImport } from "./useImport";
import type { Entry } from "../types/benchmark";

/**
 * Test suite for useImport composable - merge behavior verification
 * Tests the core import logic: NEW entries, OVERWRITE entries, mixed cases, state clearing
 */
describe("useImport", () => {
  let composable: ReturnType<typeof useImport>;

  beforeEach(() => {
    composable = useImport();
  });

  describe("merge NEW entries", () => {
    it("creates Entry with filled spec when model is not in current entries", () => {
      // Setup: empty current entries
      const currentEntries = ref<Entry[]>([]);

      // Simulate parsed entry from import
      composable.importText.value = `Model: gpt-oss-20b-test
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 80.0%        24      30     492.9     Yes
TRUTHFULQA           75.0%        15      20     138.8     Yes`;

      // Fill spec form for NEW entry
      composable.specForms.value["gpt-oss-20b-test"] = {
        parameters_b: "20",
        quantization: "8bit",
        size_gb: "40",
      };

      // Call applyImport
      composable.applyImport(currentEntries);

      // Assertions
      expect(currentEntries.value).toHaveLength(1);
      const entry = currentEntries.value[0];
      expect(entry.model).toBe("gpt-oss-20b-test");
      expect(entry.spec.parameters_b).toBe(20);
      expect(entry.spec.quantization).toBe("8bit");
      expect(entry.spec.size_gb).toBe(40);
      expect(entry.abilities?.thinking).toBe(false);
      expect(entry.abilities?.mtp).toBe(false);
      expect(entry.tiers.opus).toBe(false);
      expect(entry.tiers.sonnet).toBe(false);
      expect(entry.tiers.haiku).toBe(false);
      expect(entry.deprecated).toBe(false);
      expect(entry.scores.MMLU).toEqual({
        accuracy: 80.0,
        samples: 30,
        time_s: 492.9,
      });
      expect(entry.scores.TRUTHFULQA).toEqual({
        accuracy: 75.0,
        samples: 20,
        time_s: 138.8,
      });
    });
  });

  describe("merge OVERWRITE entries", () => {
    it("preserves spec/tiers/abilities/deprecated on score-only update", () => {
      // Setup: existing entry with spec, tiers, abilities
      const existingEntry: Entry = {
        model: "existing-model",
        date: "2026-05-25",
        spec: {
          parameters_b: 35,
          quantization: "4bit",
          size_gb: 18,
        },
        deprecated: true,
        tiers: {
          opus: true,
          sonnet: false,
          haiku: false,
        },
        abilities: {
          thinking: true,
          mtp: false,
        },
        scores: {
          MMLU: {
            accuracy: 40.0,
            samples: 30,
            time_s: 100.0,
          },
        },
      };
      const currentEntries = ref<Entry[]>([existingEntry]);

      // Simulate parsed entry with new scores (OVERWRITE case)
      composable.importText.value = `Model: existing-model
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 55.0%        17      30     120.0     Yes
TRUTHFULQA           48.0%        14      30     80.0      Yes`;

      // No spec form needed for OVERWRITE
      composable.applyImport(currentEntries);

      // Assertions
      expect(currentEntries.value).toHaveLength(1);
      const entry = currentEntries.value[0];
      expect(entry.model).toBe("existing-model");

      // Preserved fields
      expect(entry.date).toBe("2026-05-25");
      expect(entry.spec.parameters_b).toBe(35);
      expect(entry.spec.quantization).toBe("4bit");
      expect(entry.spec.size_gb).toBe(18);
      expect(entry.deprecated).toBe(true);
      expect(entry.tiers.opus).toBe(true);
      expect(entry.tiers.sonnet).toBe(false);
      expect(entry.tiers.haiku).toBe(false);
      expect(entry.abilities?.thinking).toBe(true);
      expect(entry.abilities?.mtp).toBe(false);

      // Updated scores
      expect(entry.scores.MMLU).toEqual({
        accuracy: 55.0,
        samples: 30,
        time_s: 120.0,
      });
      expect(entry.scores.TRUTHFULQA).toEqual({
        accuracy: 48.0,
        samples: 30,
        time_s: 80.0,
      });
    });
  });

  describe("merge mixed NEW and OVERWRITE", () => {
    it("handles batch of NEW + OVERWRITE in one apply", () => {
      // Setup: one existing entry
      const existingEntry: Entry = {
        model: "model-a",
        date: "2026-05-25",
        spec: {
          parameters_b: 7,
          quantization: "8bit",
          size_gb: 14,
        },
        deprecated: false,
        tiers: {
          opus: false,
          sonnet: false,
          haiku: false,
        },
        abilities: {
          thinking: false,
          mtp: false,
        },
        scores: {
          MMLU: {
            accuracy: 40.0,
            samples: 30,
            time_s: 100.0,
          },
        },
      };
      const currentEntries = ref<Entry[]>([existingEntry]);

      // Simulate parsed entries with both existing and new models
      composable.importText.value = `Model: model-a
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 50.0%        15      30     120.0     Yes
Model: model-b
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 60.0%        18      30     150.0     Yes`;

      // Fill spec form only for NEW entry (model-b)
      composable.specForms.value["model-b"] = {
        parameters_b: "13",
        quantization: "4bit",
        size_gb: "26",
      };

      // Apply
      composable.applyImport(currentEntries);

      // Assertions
      expect(currentEntries.value).toHaveLength(2);

      // model-a should be OVERWRITE (scores updated)
      const modelA = currentEntries.value.find((e) => e.model === "model-a");
      expect(modelA).toBeDefined();
      expect(modelA!.date).toBe("2026-05-25"); // preserved
      expect(modelA!.spec.parameters_b).toBe(7); // preserved
      expect(modelA!.scores.MMLU.accuracy).toBe(50.0); // updated

      // model-b should be NEW (full entry created)
      const modelB = currentEntries.value.find((e) => e.model === "model-b");
      expect(modelB).toBeDefined();
      expect(modelB!.spec.parameters_b).toBe(13); // from form
      expect(modelB!.spec.quantization).toBe("4bit"); // from form
      expect(modelB!.spec.size_gb).toBe(26); // from form
      expect(modelB!.deprecated).toBe(false); // default for NEW
      expect(modelB!.scores.MMLU.accuracy).toBe(60.0); // parsed
    });
  });

  describe("merge empty list", () => {
    it("does nothing when no entries parsed", () => {
      const currentEntries = ref<Entry[]>([
        {
          model: "original",
          date: "2026-05-25",
          spec: {
            parameters_b: 7,
            quantization: "4bit",
            size_gb: 14,
          },
          deprecated: false,
          tiers: {
            opus: false,
            sonnet: false,
            haiku: false,
          },
          abilities: {
            thinking: false,
            mtp: false,
          },
          scores: {
            MMLU: {
              accuracy: 40.0,
              samples: 30,
              time_s: 100.0,
            },
          },
        },
      ]);

      // Empty import text
      composable.importText.value = "";

      // Apply
      composable.applyImport(currentEntries);

      // Should not change current entries
      expect(currentEntries.value).toHaveLength(1);
      expect(currentEntries.value[0].model).toBe("original");
    });
  });

  describe("modal state clearing", () => {
    it("clears modal state after apply", () => {
      const currentEntries = ref<Entry[]>([]);

      // Setup modal state
      composable.isModalOpen.value = true;
      composable.importText.value = `Model: test-model
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 50.0%        15      30     200.0     No`;

      composable.specForms.value["test-model"] = {
        parameters_b: "7",
        quantization: "8bit",
        size_gb: "14",
      };

      // Apply
      composable.applyImport(currentEntries);

      // Modal state should be cleared
      expect(composable.isModalOpen.value).toBe(false);
      expect(composable.importText.value).toBe("");
      expect(composable.specForms.value).toEqual({});
    });
  });

  describe("parsed entries enrichment", () => {
    it("enriches parsed entries with NEW/OVERWRITE status correctly", () => {
      const currentEntries: Entry[] = [
        {
          model: "existing",
          date: "2026-05-25",
          spec: {
            parameters_b: 7,
            quantization: "4bit",
            size_gb: 14,
          },
          deprecated: false,
          tiers: {
            opus: false,
            sonnet: false,
            haiku: false,
          },
          abilities: {
            thinking: false,
            mtp: false,
          },
          scores: {
            MMLU: {
              accuracy: 40.0,
              samples: 30,
              time_s: 100.0,
            },
          },
        },
      ];

      const rawResults = [
        {
          model: "existing",
          scores: {
            MMLU: {
              accuracy: 50.0,
              samples: 30,
              time_s: 120.0,
            },
          },
        },
        {
          model: "new-model",
          scores: {
            MMLU: {
              accuracy: 60.0,
              samples: 30,
              time_s: 150.0,
            },
          },
        },
      ];

      const enriched = composable.enrichParsedEntries(rawResults, currentEntries);

      expect(enriched).toHaveLength(2);
      expect(enriched[0].status).toBe("OVERWRITE");
      expect(enriched[0].model).toBe("existing");
      expect(enriched[1].status).toBe("NEW");
      expect(enriched[1].model).toBe("new-model");

      // Check that spec form was initialized for NEW entry
      expect(composable.specForms.value["new-model"]).toBeDefined();
      expect(composable.specForms.value["existing"]).toBeUndefined(); // OVERWRITE doesn't need form
    });
  });
});
