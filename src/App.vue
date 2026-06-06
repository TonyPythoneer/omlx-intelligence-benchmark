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

      <BenchmarkTable :entries="entries" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BenchmarkTable from './components/BenchmarkTable.vue';
import DeviceSelector from './components/DeviceSelector.vue';
import { useSettings } from './composables/useSettings';
import { useBenchmarkData } from './composables/useBenchmarkData';

const { defaultDevice, devices, isLoading: settingsLoading, error: settingsError } = useSettings();
const selectedDevice = ref<string | null>(null);
const { entries, isLoading: dataLoading, error: dataError } = useBenchmarkData(selectedDevice);

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
</style>
