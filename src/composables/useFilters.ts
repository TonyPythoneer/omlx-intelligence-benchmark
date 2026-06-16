import { ref, computed, type Ref } from "vue";
import { type Entry } from "../types/benchmark";

/**
 * CATEGORIES mapping - Maps category names to their benchmark keys
 * Used internally for filtering benchmark visibility
 */
const CATEGORIES = {
  Knowledge: ["MMLU"],
  "Commonsense & Reasoning": ["TRUTHFULQA"],
  Coding: ["HUMANEVAL", "MBPP", "LIVECODEBENCH"],
};

const BASIC_CATEGORIES = ["Knowledge", "Commonsense & Reasoning"];
const ADVANCED_CATEGORIES = ["Coding"];

export function useFilters(entries: Ref<Entry[]>) {
  const modelSearch = ref<string>("");
  const tierFilter = ref<"all" | "opus" | "sonnet" | "haiku">("all");
  const metricsFilter = ref<"all" | "basic" | "advanced">("all");
  const showDeprecated = ref<boolean>(false);

  /**
   * Computed: visibleBenchmarks - Returns array of benchmark keys to display
   * based on metricsFilter selection
   */
  const visibleBenchmarks = computed(() => {
    const allBenchmarks = ["MMLU", "TRUTHFULQA", "HUMANEVAL", "MBPP", "LIVECODEBENCH"];

    switch (metricsFilter.value) {
      case "basic":
        // Only show benchmarks from BASIC_CATEGORIES
        return BASIC_CATEGORIES.flatMap((cat) => CATEGORIES[cat as keyof typeof CATEGORIES] || []);
      case "advanced":
        // Only show benchmarks from ADVANCED_CATEGORIES
        return ADVANCED_CATEGORIES.flatMap(
          (cat) => CATEGORIES[cat as keyof typeof CATEGORIES] || [],
        );
      case "all":
      default:
        return allBenchmarks;
    }
  });

  /**
   * Helper: deprecatedMatch - Check if entry matches the deprecated filter
   * If showDeprecated is true, all entries pass
   * Otherwise, only non-deprecated entries pass
   */
  function deprecatedMatch(entry: Entry, showDeprecated: boolean): boolean {
    if (showDeprecated) return true;
    return !entry.deprecated;
  }

  /**
   * Computed: filteredEntries - Returns filtered array of entries based on all active filters
   * Applies filters with AND logic: must pass ALL filters to be included
   */
  const filteredEntries = computed(() => {
    return entries.value.filter((entry) => {
      // Model search filter
      if (modelSearch.value.length > 0) {
        const searchLower = modelSearch.value.toLowerCase();
        if (!entry.model.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Deprecated filter (apply early to skip hidden rows)
      if (!deprecatedMatch(entry, showDeprecated.value)) {
        return false;
      }

      // Tier filter
      if (tierFilter.value !== "all") {
        if (!entry.tiers[tierFilter.value]) {
          return false;
        }
      }

      // Metrics filter - doesn't filter rows, only columns (handled via visibleBenchmarks)
      // All rows pass; columns are hidden via visibleBenchmarks in BenchmarkTable

      return true;
    });
  });

  return {
    modelSearch,
    tierFilter,
    metricsFilter,
    showDeprecated,
    visibleBenchmarks,
    filteredEntries,
  };
}
