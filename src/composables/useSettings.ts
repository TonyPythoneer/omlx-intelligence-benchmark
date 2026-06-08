import { ref, computed, onMounted, type Ref } from "vue";

/**
 * Device metadata structure
 */
export interface DeviceMeta {
  family: string;
  variant: string;
  memory: string;
  gpus: number;
}

/**
 * Settings structure loaded from /settings.json
 */
export interface Settings {
  defaultDevice: string;
  parametersBreakpoints: number[];
  devices: Record<string, DeviceMeta>;
}

/**
 * useSettings composable - Load and manage benchmark settings
 * Fetches /settings.json on component mount and provides reactive state
 */
export function useSettings() {
  const settings = ref<Settings | null>(null);
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const defaultDevice = computed(() => settings.value?.defaultDevice || null);
  const parametersBreakpoints = computed(() => settings.value?.parametersBreakpoints || []);
  const devices = computed(() => settings.value?.devices || {});

  onMounted(async () => {
    // Guard against SSR context
    if (typeof window === "undefined") {
      isLoading.value = false;
      return;
    }

    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(`${import.meta.env.BASE_URL}settings.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      settings.value = data as Settings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error loading settings";
      error.value = errorMessage;
      console.error("Error loading settings:", errorMessage);
      settings.value = null;
    } finally {
      isLoading.value = false;
    }
  });

  return {
    settings: settings as Ref<Settings | null>,
    defaultDevice: defaultDevice as Ref<string | null>,
    parametersBreakpoints: parametersBreakpoints as Ref<number[]>,
    devices: devices as Ref<Record<string, DeviceMeta>>,
    isLoading,
    error,
  };
}
