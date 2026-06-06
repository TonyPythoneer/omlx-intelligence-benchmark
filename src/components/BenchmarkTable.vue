<template>
  <table class="benchmark-table">
    <thead>
      <tr>
        <th>Model</th>
        <th>Date</th>
        <th>Parameters (B)</th>
        <th>Quantization</th>
        <th>Size (GB)</th>
        <th>Opus</th>
        <th>Sonnet</th>
        <th>Haiku</th>
        <th>MMLU Accuracy</th>
        <th>MMLU Time (s)</th>
        <th>TRUTHFULQA Accuracy</th>
        <th>HUMANEVAL Accuracy</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="entries.length === 0">
        <td colspan="12">No entries loaded</td>
      </tr>
      <tr v-for="entry in entries" :key="entry.model">
        <td>{{ entry.model }}</td>
        <td>{{ entry.date }}</td>
        <td>{{ entry.spec.parameters_b }}</td>
        <td>{{ entry.spec.quantization }}</td>
        <td>{{ entry.spec.size_gb }}</td>
        <td>{{ entry.tiers.opus ? '✓' : '–' }}</td>
        <td>{{ entry.tiers.sonnet ? '✓' : '–' }}</td>
        <td>{{ entry.tiers.haiku ? '✓' : '–' }}</td>
        <td>{{ entry.scores.MMLU?.accuracy ?? '–' }}</td>
        <td>{{ entry.scores.MMLU?.time_s ?? '–' }}</td>
        <td>{{ entry.scores.TRUTHFULQA?.accuracy ?? '–' }}</td>
        <td>{{ entry.scores.HUMANEVAL?.accuracy ?? '–' }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { type Entry } from '../types/benchmark';

defineProps<{
  entries: Entry[];
}>();
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

td {
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  text-align: left;
  color: #475569;
}

tbody tr:hover {
  background: #f8fafc;
}
</style>
