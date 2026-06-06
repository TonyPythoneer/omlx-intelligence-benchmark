<template>
  <div id="app-root">
    <div v-if="settingsLoading" class="loading-state">Loading settings...</div>
    <div v-else-if="settingsError" class="error-state">Error: {{ settingsError }}</div>
    <div v-else>
      <header class="app-header">
        <h1>oMLX Intelligence Benchmark</h1>
        <div class="header-controls">
          <button
            v-if="isLocalhost"
            class="btn btn-import"
            @click="openModal"
          >+ Import</button>
          <button
            v-if="isLocalhost"
            class="btn btn-label"
            @click="toggleLabelingMode(mutableEntries)"
          >{{ isLabelingMode ? '✓ Done' : '✏ Label' }}</button>
          <button
            v-if="isLocalhost && showExportButton"
            class="btn btn-export"
            @click="isExportModalOpen = true"
          >Export Data</button>
          <DeviceSelector :devices="devices" v-model:modelValue="selectedDevice" />
        </div>
      </header>

      <div v-if="dataLoading" class="loading-state">Loading data...</div>
      <div v-if="dataError" class="error-state">Data error: {{ dataError }}</div>

      <FilterBar
        :modelSearch="modelSearch"
        @update:modelSearch="modelSearch = $event"
        :tierFilter="tierFilter"
        @update:tierFilter="tierFilter = $event"
        :metricsFilter="metricsFilter"
        @update:metricsFilter="metricsFilter = $event"
        :paramsMinIdx="paramsMinIdx"
        @update:paramsMinIdx="paramsMinIdx = $event"
        :paramsMaxIdx="paramsMaxIdx"
        @update:paramsMaxIdx="paramsMaxIdx = $event"
        :parametersBreakpoints="parametersBreakpoints"
        :showDeprecated="showDeprecated"
        @update:showDeprecated="showDeprecated = $event"
      />

      <BenchmarkTable
        :entries="filteredEntries"
        :visibleBenchmarks="visibleBenchmarks"
        :isLabelingMode="isLabelingMode"
        :labelEdits="labelEdits"
        :validationErrors="validationErrors"
        @update:labelEdit="(modelName, field, value) => updateLabelEdit(modelName, field, value)"
      />

      <!-- Import Modal -->
      <ImportModal
        :isOpen="isModalOpen"
        :importText="importText"
        :parsedEntries="enrichedParsedEntries"
        :isApplyEnabled="isApplyEnabled"
        :specForms="specForms"
        @close="closeModal"
        @apply="applyImport"
        @update:importText="importText = $event"
        @update:specForms="specForms = $event"
      />

      <!-- Export Modal -->
      <ExportModal
        :isOpen="isExportModalOpen"
        :entries="mutableEntries"
        :selectedDevice="selectedDevice || 'benchmark'"
        @close="isExportModalOpen = false"
      />
      <footer class="app-footer">created by TonyPythoneer</footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Entry } from './types/benchmark';
import BenchmarkTable from './components/BenchmarkTable.vue';
import FilterBar from './components/FilterBar.vue';
import DeviceSelector from './components/DeviceSelector.vue';
import ImportModal from './components/ImportModal.vue';
import ExportModal from './components/ExportModal.vue';
import { useSettings } from './composables/useSettings';
import { useBenchmarkData } from './composables/useBenchmarkData';
import { useFilters } from './composables/useFilters';
import { useImport } from './composables/useImport';
import { useLabeling } from './composables/useLabeling';

const { settings, defaultDevice, devices, parametersBreakpoints, isLoading: settingsLoading, error: settingsError } = useSettings();
const selectedDevice = ref<string | null>(null);
const { entries, isLoading: dataLoading, error: dataError } = useBenchmarkData(selectedDevice);

// Mutable entries ref: created from fetched entries, used for in-memory modifications
const mutableEntries = ref<Entry[]>([]);
watch(entries, (newEntries) => {
  // Deep copy to ensure independence from fetched data
  mutableEntries.value = JSON.parse(JSON.stringify(newEntries));
}, { immediate: true });

// Labeling mode composable
const {
  isLabelingMode,
  isDirty,
  labelEdits,
  validationErrors,
  hasValidationErrors,
  toggleLabelingMode,
  updateLabelEdit,
  commitLabelEdits,
  setDirty
} = useLabeling(mutableEntries);

// Export modal state
const isExportModalOpen = ref<boolean>(false);

// Hostname guard: only show Import button on localhost/127.0.0.1
const isLocalhost = computed<boolean>(() => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
});

// Export button visibility: appears when isDirty or isLabelingMode, but only when no validation errors
const showExportButton = computed<boolean>(() => {
  return (isDirty.value || isLabelingMode.value) && !hasValidationErrors.value;
});

// useFilters now works with mutableEntries instead of entries
const {
  filteredEntries,
  visibleBenchmarks,
  modelSearch,
  tierFilter,
  metricsFilter,
  paramsMinIdx,
  paramsMaxIdx,
  showDeprecated
} = useFilters(mutableEntries, settings);

// Import modal state and functions
const {
  isModalOpen,
  importText,
  parsedEntries: rawParsedEntries,
  specForms,
  isApplyEnabled,
  openModal,
  closeModal,
  applyImport: performApplyImport,
  enrichParsedEntries
} = useImport();

// Enrich parsed entries with NEW/OVERWRITE status based on current mutableEntries
const enrichedParsedEntries = computed(() => {
  return enrichParsedEntries(rawParsedEntries.value, mutableEntries.value);
});

// Wrapper for applyImport that passes mutableEntries
function applyImport() {
  performApplyImport(mutableEntries);
  // Mark as dirty when import is applied
  setDirty();
}

watch(defaultDevice, (device) => {
  if (device) {
    selectedDevice.value = device;
  }
});
</script>

<style scoped>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8fafc;
  color: #0f172a;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app-root {
  padding: 40px 48px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
}

h1 {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #0f172a 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-state {
  font-size: 16px;
  color: #64748b;
  margin-top: 8px;
}

.error-state {
  font-size: 16px;
  color: #dc2626;
  background: #fee2e2;
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 8px;
}

.btn {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-import {
  background: #3b82f6;
  color: white;
}
.btn-import:hover { background: #2563eb; }

.btn-label {
  background: #8b5cf6;
  color: white;
}
.btn-label:hover { background: #7c3aed; }

.btn-export {
  background: #10b981;
  color: white;
}
.btn-export:hover { background: #059669; }

.app-footer {
  text-align: center;
  margin-top: 32px;
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>
