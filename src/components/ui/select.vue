<script setup lang="ts">
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-vue-next';

interface Props {
  modelValue?: string;
  class?: string;
  disabled?: boolean;
}

defineProps<Props>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="relative">
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      :class="cn(
        'flex h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        $props.class
      )"
    >
      <slot />
    </select>
    <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  </div>
</template>
