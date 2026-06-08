import { ref, computed, type Ref } from "vue";
import { type Entry, type Scores } from "../types/benchmark";
// @ts-ignore — import.mjs has no types
import { parseImportInput } from "../lib/import.mjs";

/**
 * Parsed entry result with status and spec filling state
 */
interface ParsedResult {
  model: string;
  scores: Scores;
  status: "NEW" | "OVERWRITE";
  specFilled: boolean;
  spec: {
    parameters_b: number | null;
    quantization: string;
    size_gb: number | null;
  };
}

/**
 * useImport composable - Manage import modal state and entry parsing
 *
 * Provides:
 * - Modal state (isModalOpen, importText)
 * - Parsed entries with NEW/OVERWRITE status detection
 * - Spec form state for NEW entries
 * - Apply enabled/disabled state based on completeness
 * - applyImport function to merge entries
 */
export function useImport() {
  const isModalOpen = ref<boolean>(false);
  const importText = ref<string>("");

  /**
   * Spec form state: stores user-filled spec values for NEW entries
   * Key: model name, Value: { parameters_b, quantization, size_gb }
   */
  const specForms = ref<
    Record<string, { parameters_b: string; quantization: string; size_gb: string }>
  >({});

  /**
   * Helper: Get today's date in YYYY-MM-DD format
   */
  function getTodaysDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  /**
   * Helper: Get raw parsed results from import text (without status enrichment)
   * Status will be determined by enrichParsedEntries based on current entries
   */
  function getRawParsedResults(): Array<{ model: string; scores: Scores }> {
    if (!importText.value.trim()) {
      specForms.value = {};
      return [];
    }

    try {
      return parseImportInput(importText.value);
    } catch (err) {
      console.error("Error parsing import text:", err);
      return [];
    }
  }

  /**
   * Helper: Enrich raw parsed results with status (NEW/OVERWRITE) and spec tracking
   * This should be called after getRawParsedResults when current entries are available
   */
  function enrichParsedEntries(
    rawResults: Array<{ model: string; scores: Scores }>,
    currentEntries: Entry[],
  ): ParsedResult[] {
    const existingModels = new Set(currentEntries.map((e) => e.model));

    return rawResults.map((result) => {
      const status = existingModels.has(result.model) ? "OVERWRITE" : "NEW";

      // Initialize spec form for NEW entries if not already present
      if (status === "NEW" && !specForms.value[result.model]) {
        specForms.value[result.model] = {
          parameters_b: "",
          quantization: "",
          size_gb: "",
        };
      }

      // Check if spec is filled (all three fields non-empty)
      const form = specForms.value[result.model];
      const specFilled =
        status === "NEW"
          ? form && form.parameters_b !== "" && form.quantization !== "" && form.size_gb !== ""
          : false;

      return {
        model: result.model,
        scores: result.scores,
        status,
        specFilled,
        spec: {
          parameters_b: null,
          quantization: "",
          size_gb: null,
        },
      };
    });
  }

  /**
   * Computed: parsedEntries - reactive list of parsed entries
   * NOTE: This version returns entries without status (all marked as NEW)
   * Call enrichParsedEntries in parent to add status based on current entries
   */
  const parsedEntries = computed<ParsedResult[]>(() => {
    const raw = getRawParsedResults();

    return raw.map((result: { model: string; scores: Scores }) => {
      // Initialize spec form if not present
      if (!specForms.value[result.model]) {
        specForms.value[result.model] = {
          parameters_b: "",
          quantization: "",
          size_gb: "",
        };
      }

      // Check if spec is filled
      const form = specForms.value[result.model];
      const specFilled =
        form && form.parameters_b !== "" && form.quantization !== "" && form.size_gb !== "";

      return {
        model: result.model,
        scores: result.scores,
        status: "NEW" as const,
        specFilled,
        spec: {
          parameters_b: null,
          quantization: "",
          size_gb: null,
        },
      };
    });
  });

  /**
   * Computed: isApplyEnabled - true when all NEW entries have complete spec
   * For entries to be applyable:
   * 1. importText must be non-empty
   * 2. All entries with status='NEW' must have spec filled (parameters_b, quantization, size_gb)
   */
  const isApplyEnabled = computed<boolean>(() => {
    if (!importText.value.trim()) {
      return false;
    }

    // All entries must be parsed, and all NEW entries must have specFilled
    return (
      parsedEntries.value.length > 0 &&
      parsedEntries.value.every((entry) => {
        if (entry.status === "NEW") {
          return entry.specFilled;
        }
        return true; // OVERWRITE entries don't need spec
      })
    );
  });

  /**
   * Apply import: merge parsed entries into current entries
   * - NEW entries: add complete Entry with user-filled spec
   * - OVERWRITE entries: update only scores, preserve all other fields
   */
  function applyImport(mutableEntries: Ref<Entry[]>): void {
    const current = mutableEntries.value;
    const today = getTodaysDate();

    // Create a map of existing entries by model for quick lookup
    const existingMap = new Map(current.map((e, i) => [e.model, i]));

    // Apply each parsed entry
    const merged = [...current];

    for (const parsed of parsedEntries.value) {
      const existingIdx = existingMap.get(parsed.model);

      if (existingIdx !== undefined) {
        // OVERWRITE: only update scores
        merged[existingIdx] = {
          ...merged[existingIdx],
          scores: parsed.scores,
        };
      } else {
        // NEW: create complete entry with user-filled spec
        const form = specForms.value[parsed.model];
        merged.push({
          model: parsed.model,
          date: today,
          spec: {
            parameters_b: form.parameters_b ? parseFloat(form.parameters_b) : null,
            quantization: form.quantization,
            size_gb: form.size_gb ? parseFloat(form.size_gb) : null,
          },
          abilities: {
            thinking: false,
            mtp: false,
          },
          tiers: {
            opus: false,
            sonnet: false,
            haiku: false,
          },
          deprecated: false,
          scores: parsed.scores,
        });
      }
    }

    // Update the mutable entries
    mutableEntries.value = merged;

    // Clear the modal state
    closeModal();
  }

  /**
   * Open the import modal
   */
  function openModal(): void {
    isModalOpen.value = true;
  }

  /**
   * Close the import modal and reset state
   */
  function closeModal(): void {
    isModalOpen.value = false;
    importText.value = "";
    specForms.value = {};
  }

  return {
    // State refs
    isModalOpen,
    importText,
    specForms,

    // Computed properties
    parsedEntries,
    isApplyEnabled,

    // Methods
    openModal,
    closeModal,
    applyImport,
    enrichParsedEntries,
  };
}
