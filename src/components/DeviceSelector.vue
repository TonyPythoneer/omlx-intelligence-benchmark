<template>
  <UiSelect :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
    <option value="">— Select Device —</option>
    <option v-for="(meta, key) in devices" :key="key" :value="key">
      {{ key }}: {{ meta.family }} {{ meta.variant }} ({{ meta.memory }}, {{ meta.gpus }} GPUs)
    </option>
  </UiSelect>
</template>

<script setup lang="ts">
import { type DeviceMeta } from '../composables/useSettings';
import UiSelect from './ui/select.vue';

defineProps<{
  devices: Record<string, DeviceMeta>;
  modelValue: string;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
