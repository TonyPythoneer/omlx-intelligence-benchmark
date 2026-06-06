<template>
  <select :value="modelValue" @change="handleChange" class="device-selector">
    <option value="">-- Select Device --</option>
    <option v-for="(meta, key) in devices" :key="key" :value="key">
      {{ key }}: {{ meta.family }} {{ meta.variant }} ({{ meta.memory }}, {{ meta.gpus }} GPUs)
    </option>
  </select>
</template>

<script setup lang="ts">
import { type DeviceMeta } from '../composables/useSettings';

defineProps<{
  devices: Record<string, DeviceMeta>;
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
}
</script>

<style scoped>
.device-selector {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  color: #1e293b;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: pointer;
  transition: border-color 0.2s;
}

.device-selector:hover {
  border-color: #cbd5e1;
}

.device-selector:focus {
  outline: none;
  border-color: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1);
}
</style>
