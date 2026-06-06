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

      // Tier filter
      if (tierFilter.value !== 'all') {
        if (!entry.tiers[tierFilter.value]) {
          return false;
        }
      }

      // Metrics filter - doesn't filter rows, only columns (handled via visibleBenchmarks)
      // So always return true for now

      // Params filter - placeholder for now, always return true
      // Will be implemented in Phase 04-02

      // Deprecated filter - placeholder for now, always return true
      // Will be implemented in Phase 04-02

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
