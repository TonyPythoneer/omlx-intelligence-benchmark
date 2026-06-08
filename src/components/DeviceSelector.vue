<template>
  <UiSelect
    :modelValue="modelValue"
    placeholder="— Select Device —"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <UiSelectItem v-for="(meta, key) in devices" :key="key" :value="key">
      {{ key }}: {{ meta.family }} {{ meta.variant }} ({{ meta.memory }}, {{ meta.gpus }} GPUs)
    </UiSelectItem>
  </UiSelect>
</template>

<script setup lang="ts">
import type { DeviceMeta } from "../composables/useSettings";
import UiSelect from "./ui/select.vue";
import UiSelectItem from "./ui/select-item.vue";

defineProps<{
  devices: Record<string, DeviceMeta>;
  modelValue: string;
}>();

defineEmits<{ "update:modelValue": [value: string] }>();
</script>
