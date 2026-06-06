<template>
  <Teleport to="body" v-if="isOpen">
    <div class="modal-overlay" @click.self="onClose">
      <div class="modal-dialog">
        <h2 class="modal-title">Import Benchmark Results</h2>

        <textarea
          v-model="importTextLocal"
          class="import-textarea"
          placeholder="Paste benchmark runner stdout here..."
        ></textarea>

        <!-- Parsed entries list -->
        <div v-if="parsedEntries.length > 0" class="parsed-entries">
          <div v-for="(entry, idx) in parsedEntries" :key="`${entry.model}-${idx}`" class="entry-card">
            <!-- Status badge and model name -->
            <div class="entry-header">
              <span :class="['badge', entry.status === 'NEW' ? 'badge-new' : 'badge-overwrite']">
                {{ entry.status }}
              </span>
              <span class="model-name">{{ entry.model }}</span>
            </div>

            <!-- Spec form for NEW entries only -->
            <div v-if="entry.status === 'NEW'" class="spec-form">
              <input
                type="number"
                :model-value="specForms[entry.model]?.parameters_b || ''"
                @input="updateSpecForm(entry.model, 'parameters_b', $event)"
                placeholder="Params (B)"
                class="spec-input"
              />
              <input
                type="text"
                :model-value="specForms[entry.model]?.quantization || ''"
                @input="updateSpecForm(entry.model, 'quantization', $event)"
                placeholder="Quantization"
                class="spec-input"
              />
              <input
                type="number"
                step="0.1"
                :model-value="specForms[entry.model]?.size_gb || ''"
                @input="updateSpecForm(entry.model, 'size_gb', $event)"
                placeholder="Size (GB)"
                class="spec-input"
              />
            </div>
          </div>
        </div>

        <!-- Empty state message -->
        <div v-else-if="importTextLocal.trim()" class="no-entries-message">
          No entries found in the pasted text.
        </div>

        <!-- Action buttons -->
        <div class="modal-actions">
          <button class="btn btn-cancel" @click="onClose">Cancel</button>
          <button :disabled="!isApplyEnabled" class="btn btn-apply" @click="handleApply">Apply</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface ParsedResult {
  model: string;
  scores: Record<string, any>;
  status: 'NEW' | 'OVERWRITE';
  specFilled: boolean;
  spec: {
    parameters_b: number | null;
    quantization: string;
    size_gb: number | null;
  };
}

interface Props {
  isOpen: boolean;
  importText: string;
  parsedEntries: ParsedResult[];
  isApplyEnabled: boolean;
  specForms: Record<string, { parameters_b: string; quantization: string; size_gb: string }>;
}

interface Emits {
  (e: 'close'): void;
  (e: 'apply'): void;
  (e: 'update:importText', value: string): void;
  (e: 'update:specForms', value: Record<string, any>): void;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  importText: '',
  parsedEntries: () => [],
  isApplyEnabled: false,
  specForms: () => ({}),
});

const emit = defineEmits<Emits>();

const importTextLocal = ref(props.importText);
watch(() => props.importText, v => { importTextLocal.value = v; });
watch(importTextLocal, v => { emit('update:importText', v); });

function updateSpecForm(model: string, field: 'parameters_b' | 'quantization' | 'size_gb', event: Event) {
  const target = event.target as HTMLInputElement;
  const updated = {
    ...props.specForms,
    [model]: {
      ...props.specForms[model],
      [field]: target.value,
    },
  };
  emit('update:specForms', updated);
}

function onClose() {
  emit('close');
}

function handleApply() {
  emit('apply');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.67);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #0f172a;
}

.import-textarea {
  width: 100%;
  height: 180px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: none;
  margin-bottom: 16px;
}

.import-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.parsed-entries {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  margin-bottom: 16px;
  background: #f8fafc;
}

.entry-card {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.entry-card:last-child {
  border-bottom: none;
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-new {
  background: #dcfce7;
  color: #166534;
}

.badge-overwrite {
  background: #dbeafe;
  color: #1e40af;
}

.model-name {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #0f172a;
  flex: 1;
}

.spec-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.spec-input {
  flex: 1;
  min-width: 80px;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  font-family: system-ui;
}

.spec-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.no-entries-message {
  padding: 12px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-cancel:hover {
  background: #cbd5e1;
}

.btn-apply {
  background: #3b82f6;
  color: white;
}

.btn-apply:hover:not(:disabled) {
  background: #2563eb;
}

.btn-apply:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}
</style>
