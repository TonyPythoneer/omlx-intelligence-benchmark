<script setup lang="ts">
import { type HTMLAttributes, useAttrs } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
  placeholder?: string;
  type?: string;
  value?: string | number;
  disabled?: boolean;
}

defineProps<Props>();
defineEmits<{ input: [event: Event]; change: [event: Event] }>();

const attrs = useAttrs();
</script>

<template>
  <input
    v-bind="attrs"
    :class="
      cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
  />
</template>
