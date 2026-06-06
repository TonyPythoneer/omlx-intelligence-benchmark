<template>
  <div id="app-root">
    <h1>oMLX Intelligence Benchmark</h1>
    <div v-if="settingsLoading" class="loading-state">Loading settings...</div>
    <div v-else-if="settingsError" class="error-state">Error: {{ settingsError }}</div>
    <div v-else>
      <div class="device-section">
        <label>Device:</label>
        <DeviceSelector :devices="devices" v-model:modelValue="selectedDevice" />
      </div>

      <div v-if="dataLoading" class="loading-state">Loading data...</div>
      <div v-if="dataError" class="error-state">Data error: {{ dataError }}</div>

      <!-- Toolbar with Import button -->
      <div class="toolbar">
        <button
          v-if="isLocalhost"
          class="btn btn-import"
          @click="openModal"
        >
          + Import
        </button>
      </div>

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

      <BenchmarkTable :entries="filteredEntries" :visibleBenchmarks="visibleBenchmarks" />

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
import { useSettings } from './composables/useSettings';
import { useBenchmarkData } from './composables/useBenchmarkData';
import { useFilters } from './composables/useFilters';
import { useImport } from './composables/useImport';

const { settings, defaultDevice, devices, parametersBreakpoints, isLoading: settingsLoading, error: settingsError } = useSettings();
const selectedDevice = ref<string | null>(null);
const { entries, isLoading: dataLoading, error: dataError } = useBenchmarkData(selectedDevice);

// Mutable entries ref: created from fetched entries, used for in-memory modifications
const mutableEntries = ref<Entry[]>([]);
watch(entries, (newEntries) => {
  // Deep copy to ensure independence from fetched data
  mutableEntries.value = JSON.parse(JSON.stringify(newEntries));
}, { immediate: true });

// Hostname guard: only show Import button on localhost/127.0.0.1
const isLocalhost = computed<boolean>(() => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
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

h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
}

p {
  font-size: 14px;
  color: #64748b;
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

.device-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.device-section label {
  font-weight: 600;
  color: #1e293b;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-import {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-import:hover {
  background: #2563eb;
}

.btn-import:active {
  background: #1d4ed8;
}
</style>
