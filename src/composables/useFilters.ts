import { ref, computed, Ref } from 'vue';
import { type Entry } from '../types/benchmark';
import { type Settings } from './useSettings';

/**
 * CATEGORIES mapping - Maps category names to their benchmark keys
 * Used internally for filtering benchmark visibility
 */
const CATEGORIES = {
  'Knowledge': ['MMLU'],
  'Commonsense & Reasoning': ['TRUTHFULQA'],
  'Coding': ['HUMANEVAL', 'MBPP', 'LIVECODEBENCH'],
};

const BASIC_CATEGORIES = ['Knowledge', 'Commonsense & Reasoning'];
const ADVANCED_CATEGORIES = ['Coding'];

/**
 * useFilters composable - Manage all filter state and compute filtered/visible data
 *
 * @param entries - Ref to array of benchmark entries
 * @param settings - Ref to settings object with parametersBreakpoints
 * @returns Object with filter refs, computed properties, and derived filter values
 */
export function useFilters(entries: Ref<Entry[]>, settings: Ref<Settings | null>) {
  // Filter state refs
  const modelSearch = ref<string>('');
  const tierFilter = ref<'all' | 'opus' | 'sonnet' | 'haiku'>('all');
  const metricsFilter = ref<'all' | 'basic' | 'advanced'>('all');
  const paramsMinIdx = ref<number>(0);
  const paramsMaxIdx = ref<number>(4);
  const showDeprecated = ref<boolean>(false);

  /**
   * Computed: visibleBenchmarks - Returns array of benchmark keys to display
   * based on metricsFilter selection
   */
  const visibleBenchmarks = computed(() => {
    const allBenchmarks = ['MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH'];

    switch (metricsFilter.value) {
      case 'basic':
        // Only show benchmarks from BASIC_CATEGORIES
        return BASIC_CATEGORIES.flatMap(cat => CATEGORIES[cat as keyof typeof CATEGORIES] || []);
      case 'advanced':
        // Only show benchmarks from ADVANCED_CATEGORIES
        return ADVANCED_CATEGORIES.flatMap(cat => CATEGORIES[cat as keyof typeof CATEGORIES] || []);
      case 'all':
      default:
        return allBenchmarks;
    }
  });

  /**
   * Helper: paramsValueAt - Convert slider index to parameter value
   * Returns the breakpoint value at the given index, or Infinity if index is at/beyond the length
   */
  function paramsValueAt(idx: number, breakpoints: number[]): number | Infinity {
    return idx >= breakpoints.length ? Infinity : breakpoints[idx];
  }

  /**
   * Helper: paramsMatch - Check if entry matches the params filter
   * Entries with null parameters_b always pass; others must be within [minIdx, maxIdx] range
   */
  function paramsMatch(
    entry: Entry,
    minIdx: number,
    maxIdx: number,
    breakpoints: number[]
  ): boolean {
    const p = entry.spec.parameters_b;
    if (p == null) return true; // null values pass the filter
    const lo = paramsValueAt(minIdx, breakpoints);
    const hi = paramsValueAt(maxIdx, breakpoints);
    return p >= lo && p <= hi;
  }

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
    return entries.value.filter(entry => {
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
      if (tierFilter.value !== 'all') {
        if (!entry.tiers[tierFilter.value]) {
          return false;
        }
      }

      // Params filter
      const bp = settings.value?.parametersBreakpoints || [];
      if (!paramsMatch(entry, paramsMinIdx.value, paramsMaxIdx.value, bp)) {
        return false;
      }

      // Metrics filter - doesn't filter rows, only columns (handled via visibleBenchmarks)
      // All rows pass; columns are hidden via visibleBenchmarks in BenchmarkTable

      return true;
    });
  });

  return {
    // Filter state refs
    modelSearch,
    tierFilter,
    metricsFilter,
    paramsMinIdx,
    paramsMaxIdx,
    showDeprecated,

    // Computed properties
    visibleBenchmarks,
    filteredEntries,
  };
}
