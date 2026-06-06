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
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelSearch: string;
  tierFilter: 'all' | 'opus' | 'sonnet' | 'haiku';
  metricsFilter: 'all' | 'basic' | 'advanced';
}>();

defineEmits<{
  'update:modelSearch': [value: string];
  'update:tierFilter': [value: 'all' | 'opus' | 'sonnet' | 'haiku'];
  'update:metricsFilter': [value: 'all' | 'basic' | 'advanced'];
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
</style>
