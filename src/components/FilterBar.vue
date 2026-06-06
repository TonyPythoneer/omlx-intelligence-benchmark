<template>
  <UiCard class="mb-6 px-4 py-3">
    <div class="flex flex-wrap items-center gap-x-5 gap-y-3">

      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <UiInput
          type="text"
          placeholder="Search models..."
          :value="modelSearch"
          @input="$emit('update:modelSearch', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Tier -->
      <div class="flex items-center gap-2">
        <UiLabel>Tier</UiLabel>
        <div class="inline-flex border border-border rounded-md overflow-hidden bg-background">
          <button
            v-for="opt in tierOptions"
            :key="opt.value"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="tierFilter === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
            @click="$emit('update:tierFilter', opt.value)"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Metrics -->
      <div class="flex items-center gap-2">
        <UiLabel>Metrics</UiLabel>
        <div class="inline-flex border border-border rounded-md overflow-hidden bg-background">
          <button
            v-for="opt in metricsOptions"
            :key="opt.value"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="metricsFilter === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
            @click="$emit('update:metricsFilter', opt.value)"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Params Slider -->
      <div class="flex items-center gap-2">
        <UiLabel>Params</UiLabel>
        <div class="flex items-center gap-2 min-w-[200px]">
          <span class="text-xs text-muted-foreground font-medium min-w-[32px] text-center">{{ paramsLabelAt(paramsMinIdxLocal) }}</span>
          <div class="relative flex-1 h-5 flex items-center">
            <input
              id="params-min"
              type="range"
              :min="0"
              :max="parametersBreakpoints.length"
              step="1"
              :value="paramsMinIdxLocal"
              @input="paramsMinIdxLocal = parseInt(($event.target as HTMLInputElement).value, 10)"
              class="slider-thumb absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-border [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:-mt-1.5"
            />
            <input
              id="params-max"
              type="range"
              :min="0"
              :max="parametersBreakpoints.length"
              step="1"
              :value="paramsMaxIdxLocal"
              @input="paramsMaxIdxLocal = parseInt(($event.target as HTMLInputElement).value, 10)"
              class="slider-thumb absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-border [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:-mt-1.5"
            />
          </div>
          <span class="text-xs text-muted-foreground font-medium min-w-[32px] text-center">{{ paramsLabelAt(paramsMaxIdxLocal) }}</span>
        </div>
      </div>

      <!-- Show Deprecated -->
      <div class="flex items-center gap-2">
        <input
          id="show-deprecated"
          type="checkbox"
          :checked="showDeprecated"
          @change="$emit('update:showDeprecated', ($event.target as HTMLInputElement).checked)"
          class="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer"
        />
        <UiLabel for="show-deprecated" class="normal-case cursor-pointer font-medium text-sm text-foreground tracking-normal">Show Deprecated</UiLabel>
      </div>

    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import UiCard from './ui/card.vue';
import UiInput from './ui/input.vue';
import UiLabel from './ui/label.vue';

const emit = defineEmits<{
  'update:modelSearch': [value: string];
  'update:tierFilter': [value: 'all' | 'opus' | 'sonnet' | 'haiku'];
  'update:metricsFilter': [value: 'all' | 'basic' | 'advanced'];
  'update:paramsMinIdx': [value: number];
  'update:paramsMaxIdx': [value: number];
  'update:showDeprecated': [value: boolean];
}>();

const props = defineProps<{
  modelSearch: string;
  tierFilter: 'all' | 'opus' | 'sonnet' | 'haiku';
  metricsFilter: 'all' | 'basic' | 'advanced';
  paramsMinIdx: number;
  paramsMaxIdx: number;
  parametersBreakpoints: number[];
  showDeprecated: boolean;
}>();

const tierOptions = [
  { label: 'All', value: 'all' as const },
  { label: 'Opus', value: 'opus' as const },
  { label: 'Sonnet', value: 'sonnet' as const },
  { label: 'Haiku', value: 'haiku' as const },
];

const metricsOptions = [
  { label: 'All', value: 'all' as const },
  { label: 'Basic', value: 'basic' as const },
  { label: 'Advanced', value: 'advanced' as const },
];

const paramsMinIdxLocal = ref<number>(0);
const paramsMaxIdxLocal = ref<number>(0);

function paramsLabelAt(idx: number): string {
  if (idx >= props.parametersBreakpoints.length) return 'Inf';
  return `${props.parametersBreakpoints[idx]}B`;
}

watch([paramsMinIdxLocal, paramsMaxIdxLocal], ([min, max]) => {
  if (min > max) {
    paramsMinIdxLocal.value = max;
    paramsMaxIdxLocal.value = min;
    emit('update:paramsMinIdx', max);
    emit('update:paramsMaxIdx', min);
  } else {
    emit('update:paramsMinIdx', min);
    emit('update:paramsMaxIdx', max);
  }
});

watch(() => props.paramsMinIdx, (v) => { paramsMinIdxLocal.value = v; }, { immediate: true });
watch(() => props.paramsMaxIdx, (v) => { paramsMaxIdxLocal.value = v; }, { immediate: true });
</script>
