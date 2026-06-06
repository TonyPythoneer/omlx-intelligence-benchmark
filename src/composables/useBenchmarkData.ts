import { ref, watch, Ref } from 'vue';
import { type Entry } from '../types/benchmark';

/**
 * useBenchmarkData composable - Fetch and manage benchmark data for a selected device
 * Watches device ref and fetches /data/{device}.json when device changes
 */
export function useBenchmarkData(device: Ref<string | null>) {
  const entries = ref<Entry[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch benchmark data for a specific device
   */
  async function fetchData(deviceKey: string) {
    if (!deviceKey) {
      entries.value = [];
      return;
    }

    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(`/data/${deviceKey}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Validate response is an array
      if (!Array.isArray(data)) {
        throw new Error('Data is not an array');
      }
      entries.value = data as Entry[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading data';
      error.value = errorMessage;
      entries.value = [];
      console.error('Error loading benchmark data:', errorMessage);
    } finally {
      isLoading.value = false;
    }
  }

  // Guard against SSR context
  if (typeof window !== 'undefined') {
    watch(
      device,
      (newDevice) => {
        if (newDevice) {
          fetchData(newDevice);
        } else {
          entries.value = [];
          error.value = null;
        }
      },
      { immediate: true }
    );
  }

  return {
    entries,
    isLoading,
    error,
  };
}
