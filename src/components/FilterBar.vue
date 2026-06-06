<template>
  <div class="filter-bar">
    <!-- Model Search Input -->
    <div class="search-group">
      <input
        type="text"
        placeholder="🔍 Search models..."
        class="search-input"
        :value="modelSearch"
        @input="$emit('update:modelSearch', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Tier Filter Group -->
    <div class="filter-group">
      <span class="filter-label">Tier:</span>
      <div class="segmented-buttons">
        <button
          v-for="option in tierOptions"
          :key="option.value"
          class="segmented-button"
          :class="{ active: tierFilter === option.value }"
          :data-val="option.value"
          @click="$emit('update:tierFilter', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Metrics Filter Group -->
    <div class="filter-group">
      <span class="filter-label">Metrics:</span>
      <div class="segmented-buttons">
        <button
          v-for="option in metricsOptions"
          :key="option.value"
          class="segmented-button"
          :class="{ active: metricsFilter === option.value }"
          :data-val="option.value"
          @click="$emit('update:metricsFilter', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Params Slider Group -->
    <div class="filter-group">
      <span class="filter-label">Params:</span>
      <div class="params-slider-container">
        <span class="params-label-left">{{ paramsLabelAt(paramsMinIdxLocal) }}</span>
        <div class="params-slider-wrapper">
          <input
            id="params-min"
            type="range"
            :min="0"
            :max="parametersBreakpoints.length"
            step="1"
            :value="paramsMinIdxLocal"
            @input="paramsMinIdxLocal = parseInt(($event.target as HTMLInputElement).value, 10)"
          />
          <input
            id="params-max"
            type="range"
            :min="0"
            :max="parametersBreakpoints.length"
            step="1"
            :value="paramsMaxIdxLocal"
            @input="paramsMaxIdxLocal = parseInt(($event.target as HTMLInputElement).value, 10)"
          />
        </div>
        <span class="params-label-right">{{ paramsLabelAt(paramsMaxIdxLocal) }}</span>
      </div>
    </div>

    <!-- Show Deprecated Checkbox -->
    <div class="filter-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="showDeprecated"
          @change="$emit('update:showDeprecated', ($event.target as HTMLInputElement).checked)"
        />
        <span>Show Deprecated</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const emit = defineEmits<{
  'update:modelSearch': [value: string];
  'update:tierFilter': [value: 'all' | 'opus' | 'sonnet' | 'haiku'];
  'update:metricsFilter': [value: 'all' | 'basic' | 'advanced'];
  'update:paramsMinIdx': [value: number];
  'update:paramsMaxIdx': [value: number];
  'update:showDeprecated': [value: boolean];
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

// Local refs for slider inputs (used to detect cross-handle swaps)
const paramsMinIdxLocal = ref<number>(0);
const paramsMaxIdxLocal = ref<number>(0);

// Get props reference for helper functions
const props = defineProps<{
  modelSearch: string;
  tierFilter: 'all' | 'opus' | 'sonnet' | 'haiku';
  metricsFilter: 'all' | 'basic' | 'advanced';
  paramsMinIdx: number;
  paramsMaxIdx: number;
  parametersBreakpoints: number[];
  showDeprecated: boolean;
}>();

// Helper function to convert slider index to parameter value
function paramsValueAt(idx: number): number | Infinity {
  return idx >= props.parametersBreakpoints.length
    ? Infinity
    : props.parametersBreakpoints[idx];
}

// Helper function to convert slider index to label string
function paramsLabelAt(idx: number): string {
  if (idx >= props.parametersBreakpoints.length) {
    return 'Inf';
  }
  return `${props.parametersBreakpoints[idx]}B`;
}

// Watch for cross-handle swap: if min > max, swap them
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

// Sync local refs when props change (initial mount and external updates)
watch(
  () => props.paramsMinIdx,
  (newVal) => {
    paramsMinIdxLocal.value = newVal;
  },
  { immediate: true }
);

watch(
  () => props.paramsMaxIdx,
  (newVal) => {
    paramsMaxIdxLocal.value = newVal;
  },
  { immediate: true }
);
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  white-space: nowrap;
}

.segmented-buttons {
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.segmented-button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.segmented-button:not(:last-child) {
  border-right: 1px solid #d1d5db;
}

.segmented-button:hover:not(.active) {
  background: #f1f5f9;
  color: #1e293b;
}

.segmented-button.active {
  background: #2563eb;
  color: white;
  border-radius: 4px;
}

/* Params Slider Styles */
.params-slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.params-label-left,
.params-label-right {
  font-size: 13px;
  color: #64748b;
  min-width: 32px;
  text-align: center;
  font-weight: 500;
}

.params-slider-wrapper {
  position: relative;
  height: 20px;
  flex: 1;
  display: flex;
  align-items: center;
}

.params-slider-wrapper input[type='range'] {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  height: 20px;
}

.params-slider-wrapper input[type='range']::-webkit-slider-runnable-track {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
}

.params-slider-wrapper input[type='range']::-moz-range-track {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  border: none;
}

.params-slider-wrapper input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #2563eb;
  margin-top: -6px;
}

.params-slider-wrapper input[type='range']::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #2563eb;
}

.params-slider-wrapper input[type='range']:focus {
  outline: none;
}

/* Checkbox Styles */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #475569;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2563eb;
}

.checkbox-label span {
  font-weight: 500;
}
</style>
