<template>
  <table class="benchmark-table">
    <thead>
      <!-- Row 1: Group headers (Model | Spec | Score) -->
      <tr class="group-row">
        <th>Model</th>
        <th colspan="3" class="group-start">Spec</th>
        <th :colspan="visibleBenchmarksInOrder.length * 2" class="group-start">Score</th>
      </tr>
      <!-- Row 2: Subgroup headers (benchmark names) -->
      <tr class="group-row subgroup-row">
        <th></th>
        <th class="group-start"></th>
        <th></th>
        <th></th>
        <th v-for="benchmark in visibleBenchmarksInOrder" :key="benchmark" :colspan="2" class="group-start">{{ benchmark }}</th>
      </tr>
      <!-- Row 3: Leaf headers (sortable) -->
      <tr class="leaf-row">
        <th class="no-sort">Model</th>
        <th
          data-col="spec.parameters_b"
          class="group-start"
          :class="{ 'sort-asc': sortIndicator('spec.parameters_b') === 'asc', 'sort-desc': sortIndicator('spec.parameters_b') === 'desc' }"
          @click="onSort('spec.parameters_b')"
        >Params</th>
        <th
          data-col="spec.quantization"
          :class="{ 'sort-asc': sortIndicator('spec.quantization') === 'asc', 'sort-desc': sortIndicator('spec.quantization') === 'desc' }"
          @click="onSort('spec.quantization')"
        >Quant</th>
        <th
          data-col="spec.size_gb"
          :class="{ 'sort-asc': sortIndicator('spec.size_gb') === 'asc', 'sort-desc': sortIndicator('spec.size_gb') === 'desc' }"
          @click="onSort('spec.size_gb')"
        >Size</th>
        <template v-for="benchmark in visibleBenchmarksInOrder" :key="benchmark">
          <th
            :data-col="`scores.${benchmark}.accuracy`"
            class="group-start"
            :class="{ 'sort-asc': sortIndicator(`scores.${benchmark}.accuracy`) === 'asc', 'sort-desc': sortIndicator(`scores.${benchmark}.accuracy`) === 'desc' }"
            @click="onSort(`scores.${benchmark}.accuracy`)"
          >🎯</th>
          <th
            :data-col="`scores.${benchmark}.time_s`"
            :class="{ 'sort-asc': sortIndicator(`scores.${benchmark}.time_s`) === 'asc', 'sort-desc': sortIndicator(`scores.${benchmark}.time_s`) === 'desc' }"
            @click="onSort(`scores.${benchmark}.time_s`)"
          >⏲</th>
        </template>
      </tr>
    </thead>
    <tbody>
      <tr v-if="entries.length === 0">
        <td :colspan="4 + visibleBenchmarksInOrder.length * 2">No entries loaded</td>
      </tr>
      <template v-for="entry in sortedEntries" :key="entry.model">
        <!-- Normal row display -->
        <tr v-if="!isLabelingMode">
          <td class="model-name">
            <span class="model-actions">
              <button @click="copyModelName(entry.model)" class="model-action-btn" title="Copy model name">📋</button>
              <button @click="searchHuggingFace(entry.model)" class="model-action-btn" title="Search on HuggingFace">🤗</button>
            </span>
            <span class="model-name-text">{{ entry.model }}</span>
          </td>
          <td>{{ entry.spec.parameters_b }}</td>
          <td>{{ entry.spec.quantization }}</td>
          <td>{{ entry.spec.size_gb }}</td>
          <template v-for="benchmark in visibleBenchmarksInOrder" :key="benchmark">
            <td>
              <span v-if="entry.scores[benchmark]?.accuracy" :class="scoreColorClass(entry.scores[benchmark].accuracy)">
                {{ formattedAccuracy(entry.scores[benchmark].accuracy) }}%
              </span>
              <span v-else>–</span>
            </td>
            <td>{{ entry.scores[benchmark]?.time_s ?? '–' }}</td>
          </template>
        </tr>

        <!-- Labeling mode row with edit controls -->
        <tr v-if="isLabelingMode" class="labeling-row">
          <td class="model-name">
            <span class="model-name-text">{{ entry.model }}</span>
          </td>
          <td :colspan="3 + visibleBenchmarksInOrder.length * 2" class="labeling-controls-cell">
            <div class="labeling-controls">
              <div class="control-section">
                <label>Spec</label>
                <div class="control-group">
                  <div class="control-field">
                    <label>Parameters (B)</label>
                    <input
                      type="number"
                      :value="labelEdits?.[entry.model]?.parameters_b ?? ''"
                      @input="emit('update:labelEdit', entry.model, 'parameters_b', $event.target.value)"
                      class="control-input"
                      :class="{ 'input-error': validationErrors?.[entry.model]?.parameters_b }"
                    />
                    <div v-if="validationErrors?.[entry.model]?.parameters_b" class="error-message">
                      {{ validationErrors[entry.model].parameters_b.join(', ') }}
                    </div>
                  </div>

                  <div class="control-field">
                    <label>Quantization</label>
                    <input
                      type="text"
                      :value="labelEdits?.[entry.model]?.quantization ?? ''"
                      @input="emit('update:labelEdit', entry.model, 'quantization', $event.target.value)"
                      class="control-input"
                      :class="{ 'input-error': validationErrors?.[entry.model]?.quantization }"
                    />
                  </div>

                  <div class="control-field">
                    <label>Size (GB)</label>
                    <input
                      type="number"
                      :value="labelEdits?.[entry.model]?.size_gb ?? ''"
                      @input="emit('update:labelEdit', entry.model, 'size_gb', $event.target.value)"
                      class="control-input"
                      :class="{ 'input-error': validationErrors?.[entry.model]?.size_gb }"
                    />
                    <div v-if="validationErrors?.[entry.model]?.size_gb" class="error-message">
                      {{ validationErrors[entry.model].size_gb.join(', ') }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="control-section">
                <label>Abilities</label>
                <div class="control-group checkbox-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="labelEdits?.[entry.model]?.thinking ?? false"
                      @change="emit('update:labelEdit', entry.model, 'thinking', $event.target.checked)"
                    />
                    Thinking
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="labelEdits?.[entry.model]?.mtp ?? false"
                      @change="emit('update:labelEdit', entry.model, 'mtp', $event.target.checked)"
                    />
                    MTP
                  </label>
                </div>
              </div>

              <div class="control-section">
                <label>Other</label>
                <div class="control-group checkbox-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="labelEdits?.[entry.model]?.deprecated ?? false"
                      @change="emit('update:labelEdit', entry.model, 'deprecated', $event.target.checked)"
                    />
                    Deprecated
                  </label>
                </div>
              </div>

              <div class="control-section">
                <label>Tiers</label>
                <div class="control-group checkbox-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="labelEdits?.[entry.model]?.tier_opus ?? false"
                      @change="emit('update:labelEdit', entry.model, 'tier_opus', $event.target.checked)"
                    />
                    Opus
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="labelEdits?.[entry.model]?.tier_sonnet ?? false"
                      @change="emit('update:labelEdit', entry.model, 'tier_sonnet', $event.target.checked)"
                    />
                    Sonnet
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="labelEdits?.[entry.model]?.tier_haiku ?? false"
                      @change="emit('update:labelEdit', entry.model, 'tier_haiku', $event.target.checked)"
                    />
                    Haiku
                  </label>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';
import { type Entry } from '../types/benchmark';

// Get visible benchmarks prop with default fallback
const props = defineProps<{
  entries: Entry[];
  visibleBenchmarks?: string[];
  isLabelingMode?: boolean;
  labelEdits?: Record<string, any>;
  validationErrors?: Record<string, Record<string, string[]>>;
}>();

// Define emits for label edit updates
const emit = defineEmits<{
  'update:labelEdit': [modelName: string, field: string, value: any];
}>();

// All benchmark keys in display order
const ALL_BENCHMARKS = ['MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH'];

/**
 * Computed property that returns only visible benchmarks in order
 */
const visibleBenchmarksInOrder = computed(() => {
  const visible = props.visibleBenchmarks ?? ALL_BENCHMARKS;
  return ALL_BENCHMARKS.filter(b => visible.includes(b));
});

// Sorting state
const sortCol: Ref<string> = ref('date');
const sortDir: Ref<1 | -1> = ref(-1); // -1 = DESC, 1 = ASC

/**
 * Helper function to extract sortable values from entries
 */
function getSortValue(entry: Entry, col: string): any {
  if (col === 'date') {
    return new Date(entry.date).getTime();
  }
  if (col === 'spec.parameters_b') {
    return entry.spec.parameters_b;
  }
  if (col === 'spec.quantization') {
    return entry.spec.quantization;
  }
  if (col === 'spec.size_gb') {
    return entry.spec.size_gb;
  }
  if (col.startsWith('scores.')) {
    const parts = col.split('.');
    const bench = parts[1];
    const key = parts[2];
    const score = entry.scores[bench];
    return score ? score[key] : null;
  }
  return null;
}

/**
 * Computed property that returns a sorted copy of entries
 */
const sortedEntries = computed(() => {
  const sorted = [...props.entries].sort((a, b) => {
    const av = getSortValue(a, sortCol.value);
    const bv = getSortValue(b, sortCol.value);

    // Null values always go to end
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    // String comparisons
    if (typeof av === 'string') {
      return sortDir.value * av.localeCompare(bv);
    }

    // Number comparisons
    return sortDir.value * (av - bv);
  });
  return sorted;
});

/**
 * Get sort indicator for a column
 */
function sortIndicator(col: string): 'asc' | 'desc' | '' {
  if (sortCol.value !== col) return '';
  return sortDir.value === 1 ? 'asc' : 'desc';
}

/**
 * Handle sort column click
 */
function onSort(col: string): void {
  if (col === 'model') return; // Model column is not sortable

  if (sortCol.value === col) {
    // Toggle sort direction
    sortDir.value = sortDir.value === 1 ? -1 : 1;
  } else {
    // Change sort column and reset to ASC
    sortCol.value = col;
    sortDir.value = 1;
  }
}

/**
 * Copy model name to clipboard
 */
function copyModelName(modelName: string): void {
  navigator.clipboard.writeText(modelName);
}

/**
 * Search HuggingFace for the model
 */
function searchHuggingFace(modelName: string): void {
  window.open(
    `https://huggingface.co/models?search=${encodeURIComponent(modelName)}`,
    '_blank',
    'noopener'
  );
}

/**
 * Helper function to determine color class for a score
 */
function scoreColorClass(accuracy: number | undefined): string {
  if (!accuracy) return '';
  if (accuracy >= 90) return 'score-high';
  if (accuracy >= 80) return 'score-mid';
  return 'score-low';
}

/**
 * Format accuracy to one decimal place
 */
function formattedAccuracy(accuracy: number): string {
  return accuracy.toFixed(1);
}
</script>

<style scoped>
.benchmark-table {
  border-collapse: collapse;
  width: 100%;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

thead {
  background: #f1f5f9;
}

th {
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  user-select: none;
}

th.no-sort {
  cursor: default;
}

th.sort-asc,
th.sort-desc {
  color: #2563eb;
  background: #eff6ff;
}

th.sort-asc::after {
  content: ' ↑';
  color: #2563eb;
}

th.sort-desc::after {
  content: ' ↓';
  color: #2563eb;
}

th.group-start {
  border-left: 2px solid #cbd5e1;
}

td {
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  text-align: left;
  color: #475569;
}

tbody tr:hover {
  background: #f8fafc;
}

.score-high {
  color: #059669;
  font-weight: 600;
}

.score-mid {
  color: #d97706;
  font-weight: 500;
}

.score-low {
  color: #dc2626;
  font-weight: 500;
}

.model-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-actions {
  display: inline-flex;
  gap: 6px;
}

.model-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  color: #cbd5e1;
  padding: 0;
  line-height: 1;
  transition: color 0.15s ease;
}

.model-action-btn:hover {
  color: #475569;
}

.model-name-text {
  word-break: break-all;
}

/* Labeling mode styles */
.labeling-row {
  background: #f0f9ff;
  border-top: 2px solid #0ea5e9;
}

.labeling-controls-cell {
  padding: 12px 0 !important;
  background: #f0f9ff !important;
}

.labeling-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 12px 16px;
  background: #f0f9ff;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-section > label {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #1e293b;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group.checkbox-group {
  flex-direction: row;
  flex-wrap: wrap;
}

.control-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-field > label {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

.control-input {
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.control-input:focus {
  outline: none;
  border-color: #0ea5e9;
  background: white;
}

.control-input.input-error {
  border-color: #dc2626;
  background: #fef2f2;
}

.control-input.input-error:focus {
  border-color: #dc2626;
}

.error-message {
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  user-select: none;
  padding: 6px;
  border-radius: 3px;
  transition: background 0.15s ease;
}

.checkbox-label:hover {
  background: #e0f2fe;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}
</style>
