<template>
  <div id="app-root">
    <h1>oMLX Intelligence Benchmark</h1>
    <div v-if="isLoading" class="loading-state">Loading settings...</div>
    <div v-else-if="error" class="error-state">Error: {{ error }}</div>
    <div v-else>
      <!-- DeviceSelector will go here; selectedDevice will be bound to it -->
      <BenchmarkTable />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BenchmarkTable from './components/BenchmarkTable.vue';
import { useSettings } from './composables/useSettings';

const { settings, defaultDevice, isLoading, error } = useSettings();
const selectedDevice = ref<string | null>(null);

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
</style>
