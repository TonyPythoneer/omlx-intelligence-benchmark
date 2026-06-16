import { ref, computed, type Ref } from "vue";
import { type Entry } from "../types/benchmark";

export function useFilters(entries: Ref<Entry[]>) {
  const modelSearch = ref<string>("");
  const tierFilter = ref<"all" | "opus" | "sonnet" | "haiku">("all");
  const showDeprecated = ref<boolean>(false);

  const visibleBenchmarks = ["MMLU", "TRUTHFULQA", "HUMANEVAL", "MBPP", "LIVECODEBENCH"];

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

      return true;
    });
  });

  return {
    modelSearch,
    tierFilter,
    showDeprecated,
    visibleBenchmarks,
    filteredEntries,
  };
}
