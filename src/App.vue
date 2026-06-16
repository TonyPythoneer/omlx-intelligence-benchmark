<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-[1600px] px-6 py-10">
      <div v-if="settingsLoading" class="text-sm text-muted-foreground mt-8">
        Loading settings...
      </div>
      <div
        v-else-if="settingsError"
        class="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3 mt-8"
      >
        Error: {{ settingsError }}
      </div>

      <template v-else>
        <!-- Header -->
        <header class="flex items-center justify-between mb-8">
          <h1
            class="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-blue-600 bg-clip-text text-transparent"
          >
            oMLX Intelligence Benchmark
          </h1>
          <div class="flex items-center gap-2">
            <UiButton v-if="isLocalhost" variant="default" size="sm" @click="openModal"
              >+ Import</UiButton
            >
            <UiButton
              v-if="isLocalhost"
              variant="secondary"
              size="sm"
              class="bg-violet-100 text-violet-700 hover:bg-violet-200"
              @click="isLabelingMode ? handleDone() : toggleLabelingMode(mutableEntries)"
              >{{ isLabelingMode ? "✓ Done" : "✏ Label" }}</UiButton
            >
            <UiButton
              v-if="isLocalhost && showExportButton"
              variant="secondary"
              size="sm"
              class="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              @click="isExportModalOpen = true"
              >Export Data</UiButton
            >
            <DeviceSelector :devices="devices" v-model:modelValue="selectedDevice" />
          </div>
        </header>

        <div v-if="dataLoading" class="text-sm text-muted-foreground">Loading data...</div>
        <div
          v-if="dataError"
          class="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3"
        >
          Data error: {{ dataError }}
        </div>

        <FilterBar
          :modelSearch="modelSearch"
          @update:modelSearch="modelSearch = $event"
          :tierFilter="tierFilter"
          @update:tierFilter="tierFilter = $event"
          :showDeprecated="showDeprecated"
          @update:showDeprecated="showDeprecated = $event"
        />

        <BenchmarkTable
          :entries="filteredEntries"
          :visibleBenchmarks="visibleBenchmarks"
          :isLabelingMode="isLabelingMode"
          :labelEdits="labelEdits"
          :validationErrors="validationErrors"
          :fetchingModels="fetchingModels"
          :canFetchSize="isLocalhost"
          @update:labelEdit="(modelName, field, value) => updateLabelEdit(modelName, field, value)"
          @fetchSize="tryFetchSize"
        />

        <ImportModal
          v-if="isModalOpen"
          :isOpen="isModalOpen"
          :importText="importText"
          :parsedEntries="parsedEntries"
          :isApplyEnabled="isApplyEnabled"
          @close="closeModal"
          @apply="applyImport"
          @update:importText="importText = $event"
        />

        <ExportModal
          v-if="isExportModalOpen"
          :isOpen="isExportModalOpen"
          :entries="entriesWithEdits"
          :selectedDevice="selectedDevice || 'benchmark'"
          @close="isExportModalOpen = false"
        />

        <footer class="mt-12 text-center text-xs text-muted-foreground">
          created by TonyPythoneer
        </footer>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent } from "vue";
import type { Entry } from "./types/benchmark";
import BenchmarkTable from "./components/BenchmarkTable.vue";
import FilterBar from "./components/FilterBar.vue";
import DeviceSelector from "./components/DeviceSelector.vue";
// Lazy-loaded: the Import/Export modals (and the reka-ui Dialog they alone use)
// are split into an on-demand chunk so they're off the initial page load.
const ImportModal = defineAsyncComponent(() => import("./components/ImportModal.vue"));
const ExportModal = defineAsyncComponent(() => import("./components/ExportModal.vue"));
import UiButton from "./components/ui/button.vue";
import { useSettings } from "./composables/useSettings";
import { useBenchmarkData } from "./composables/useBenchmarkData";
import { useFilters } from "./composables/useFilters";
import { useImport, fetchModelSize } from "./composables/useImport";
import { useLabeling } from "./composables/useLabeling";

const { defaultDevice, devices, isLoading: settingsLoading, error: settingsError } = useSettings();
const selectedDevice = ref<string | null>(null);
const { entries, isLoading: dataLoading, error: dataError } = useBenchmarkData(selectedDevice);

const mutableEntries = ref<Entry[]>([]);
watch(
  entries,
  (newEntries) => {
    mutableEntries.value = JSON.parse(JSON.stringify(newEntries));
  },
  { immediate: true },
);

const {
  isLabelingMode,
  isDirty,
  labelEdits,
  validationErrors,
  hasValidationErrors,
  toggleLabelingMode,
  updateLabelEdit,
  setDirty,
  entriesWithEdits,
  commitLabelEdits,
} = useLabeling(mutableEntries);

function handleDone() {
  commitLabelEdits(mutableEntries);
  setDirty();
}

const isExportModalOpen = ref<boolean>(false);

const isLocalhost = computed<boolean>(() => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
});

const showExportButton = computed<boolean>(
  () => (isDirty.value || isLabelingMode.value) && !hasValidationErrors.value,
);

const { filteredEntries, visibleBenchmarks, modelSearch, tierFilter, showDeprecated } =
  useFilters(mutableEntries);

const {
  isModalOpen,
  importText,
  parsedEntries,
  isApplyEnabled,
  openModal,
  closeModal,
  applyImport: performApplyImport,
} = useImport(mutableEntries);

function applyImport() {
  performApplyImport(mutableEntries);
  setDirty();
}

const fetchingModels = ref<string[]>([]);

async function tryFetchSize(model: string) {
  if (fetchingModels.value.includes(model)) return;
  fetchingModels.value = [...fetchingModels.value, model];
  try {
    const size = await fetchModelSize(model);
    if (size !== null) {
      const idx = mutableEntries.value.findIndex((e) => e.model === model);
      if (idx !== -1) {
        const updated = [...mutableEntries.value];
        updated[idx] = { ...updated[idx], spec: { ...updated[idx].spec, size_gb: size } };
        mutableEntries.value = updated;
        setDirty();
      }
    }
  } finally {
    fetchingModels.value = fetchingModels.value.filter((m) => m !== model);
  }
}

watch(defaultDevice, (device) => {
  if (device) selectedDevice.value = device;
});
</script>
