<template>
  <table class="benchmark-table">
    <thead>
      <!-- Row 1: Group headers (Model | Spec | Score) -->
      <tr class="group-row">
        <th>Model</th>
        <th colspan="3" class="group-start">Spec</th>
        <th :colspan="ALL_BENCHMARKS.length * 2" class="group-start">Score</th>
      </tr>
      <!-- Row 2: Subgroup headers (benchmark names) -->
      <tr class="group-row subgroup-row">
        <th></th>
        <th class="group-start"></th>
        <th></th>
        <th></th>
        <th v-for="benchmark in ALL_BENCHMARKS" :key="benchmark" :colspan="2" class="group-start">{{ benchmark }}</th>
      </tr>
      <!-- Row 3: Leaf headers (sortable) -->
      <tr class="leaf-row">
        <th class="no-sort">Model</th>
        <th data-col="spec.parameters_b" class="group-start">Params</th>
        <th data-col="spec.quantization">Quant</th>
        <th data-col="spec.size_gb">Size</th>
        <template v-for="benchmark in ALL_BENCHMARKS" :key="benchmark">
          <th :data-col="`scores.${benchmark}.accuracy`" class="group-start">🎯</th>
          <th :data-col="`scores.${benchmark}.time_s`">⏲</th>
        </template>
      </tr>
    </thead>
    <tbody>
      <tr v-if="entries.length === 0">
        <td :colspan="4 + ALL_BENCHMARKS.length * 2">No entries loaded</td>
      </tr>
      <tr v-for="entry in entries" :key="entry.model">
        <td>{{ entry.model }}</td>
        <td>{{ entry.spec.parameters_b }}</td>
        <td>{{ entry.spec.quantization }}</td>
        <td>{{ entry.spec.size_gb }}</td>
        <template v-for="benchmark in ALL_BENCHMARKS" :key="benchmark">
          <td>
            <span v-if="entry.scores[benchmark]?.accuracy" :class="scoreColorClass(entry.scores[benchmark].accuracy)">
              {{ formattedAccuracy(entry.scores[benchmark].accuracy) }}%
            </span>
            <span v-else>–</span>
          </td>
          <td>{{ entry.scores[benchmark]?.time_s ?? '–' }}</td>
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { type Entry } from '../types/benchmark';

defineProps<{
  entries: Entry[];
}>();

// All benchmark keys in display order
const ALL_BENCHMARKS = ['MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH'];

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

.no-sort {
  cursor: default;
}
</style>
