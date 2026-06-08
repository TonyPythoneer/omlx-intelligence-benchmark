<script setup lang="ts">
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from "reka-ui";
import { cn } from "@/lib/utils";

interface Props {
  modelValue: number[];
  min?: number;
  max?: number;
  step?: number;
  minStepsBetweenThumbs?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  minStepsBetweenThumbs: 0,
});

const emit = defineEmits<{
  "update:modelValue": [value: number[]];
}>();
</script>

<template>
  <SliderRoot
    :model-value="props.modelValue"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :min-steps-between-thumbs="props.minStepsBetweenThumbs"
    :class="cn('relative flex w-full touch-none select-none items-center', props.class)"
    @update:model-value="emit('update:modelValue', $event ?? [])"
  >
    <SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border">
      <SliderRange class="absolute h-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, i) in props.modelValue"
      :key="i"
      class="block h-4 w-4 rounded-full border-2 border-white bg-primary shadow ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  </SliderRoot>
</template>
