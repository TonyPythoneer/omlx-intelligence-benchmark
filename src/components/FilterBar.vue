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
            :class="
              tierFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="$emit('update:tierFilter', opt.value)"
          >
            {{ opt.label }}
          </button>
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
            :class="
              metricsFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="$emit('update:metricsFilter', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Params Slider -->
      <div class="flex items-center gap-2">
        <UiLabel>Params</UiLabel>
        <div class="flex items-center gap-2 min-w-[200px]">
          <span class="text-xs text-muted-foreground font-medium min-w-[32px] text-center">{{
            paramsLabelAt(paramsMinIdxLocal)
          }}</span>
          <UiSlider
            v-model="paramsRange"
            :min="0"
            :max="parametersBreakpoints.length"
            :step="1"
            class="flex-1"
          />
          <span class="text-xs text-muted-foreground font-medium min-w-[32px] text-center">{{
            paramsLabelAt(paramsMaxIdxLocal)
          }}</span>
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
        <UiLabel
          for="show-deprecated"
          class="normal-case cursor-pointer font-medium text-sm text-foreground tracking-normal"
          >Show Deprecated</UiLabel
        >
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import UiCard from "./ui/card.vue";
import UiInput from "./ui/input.vue";
import UiLabel from "./ui/label.vue";
import UiSlider from "./ui/slider.vue";

const emit = defineEmits<{
  "update:modelSearch": [value: string];
  "update:tierFilter": [value: "all" | "opus" | "sonnet" | "haiku"];
  "update:metricsFilter": [value: "all" | "basic" | "advanced"];
  "update:paramsMinIdx": [value: number];
  "update:paramsMaxIdx": [value: number];
  "update:showDeprecated": [value: boolean];
}>();

const props = defineProps<{
  modelSearch: string;
  tierFilter: "all" | "opus" | "sonnet" | "haiku";
  metricsFilter: "all" | "basic" | "advanced";
  paramsMinIdx: number;
  paramsMaxIdx: number;
  parametersBreakpoints: number[];
  showDeprecated: boolean;
}>();

const tierOptions = [
  { label: "All", value: "all" as const },
  { label: "Opus", value: "opus" as const },
  { label: "Sonnet", value: "sonnet" as const },
  { label: "Haiku", value: "haiku" as const },
];

const metricsOptions = [
  { label: "All", value: "all" as const },
  { label: "Basic", value: "basic" as const },
  { label: "Advanced", value: "advanced" as const },
];

const paramsMinIdxLocal = ref<number>(0);
const paramsMaxIdxLocal = ref<number>(0);

// Proxy the local refs as a [min, max] array for UiSlider's number[] v-model.
// Routing updates through the locals keeps the existing swap-guard watcher
// (below) as the single source of the update:paramsMinIdx/Max emits.
const paramsRange = computed<number[]>({
  get: () => [paramsMinIdxLocal.value, paramsMaxIdxLocal.value],
  set: ([a, b]) => {
    paramsMinIdxLocal.value = a;
    paramsMaxIdxLocal.value = b;
  },
});

function paramsLabelAt(idx: number): string {
  if (idx >= props.parametersBreakpoints.length) return "Inf";
  return `${props.parametersBreakpoints[idx]}B`;
}

watch([paramsMinIdxLocal, paramsMaxIdxLocal], ([min, max]) => {
  if (min > max) {
    paramsMinIdxLocal.value = max;
    paramsMaxIdxLocal.value = min;
    emit("update:paramsMinIdx", max);
    emit("update:paramsMaxIdx", min);
  } else {
    emit("update:paramsMinIdx", min);
    emit("update:paramsMaxIdx", max);
  }
});

watch(
  () => props.paramsMinIdx,
  (v) => {
    paramsMinIdxLocal.value = v;
  },
  { immediate: true },
);
watch(
  () => props.paramsMaxIdx,
  (v) => {
    paramsMaxIdxLocal.value = v;
  },
  { immediate: true },
);
</script>
