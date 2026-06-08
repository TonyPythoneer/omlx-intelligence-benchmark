<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
  for?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <label
    :for="props.for"
    :class="cn('text-xs font-bold text-muted-foreground uppercase tracking-widest', props.class)"
  >
    <slot />
  </label>
</template>
