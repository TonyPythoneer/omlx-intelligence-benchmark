<script setup lang="ts">
import { cn } from '@/lib/utils';

interface Props {
  class?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  modelValue?: string;
}

defineProps<Props>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <textarea
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    :class="cn(
      'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      $props.class
    )"
  />
</template>
