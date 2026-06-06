<template>
  <Teleport to="body" v-if="isOpen">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-dialog export-modal">
        <h2 class="modal-title">Export Data</h2>

        <!-- JSON display area -->
        <pre class="json-preview"><code>{{ jsonText }}</code></pre>

        <!-- Status message area -->
        <span v-if="copySuccess" class="copy-success">Copied to clipboard!</span>

        <!-- Action buttons -->
        <div class="modal-actions">
          <button class="btn btn-primary" @click="copyToClipboard">Copy to Clipboard</button>
          <button class="btn btn-primary" @click="saveToFile">Save to File</button>
          <button class="btn btn-cancel" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Entry } from '../types/benchmark'

interface Props {
  isOpen: boolean
  entries: Entry[]
  selectedDevice?: string
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  entries: () => [],
  selectedDevice: undefined,
})

const emit = defineEmits<Emits>()

const copySuccess = ref(false)

const jsonText = computed(() => JSON.stringify(props.entries, null, 2))

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(jsonText.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Copy failed:', err)
    alert('Failed to copy to clipboard')
  }
}

async function downloadFile() {
  const blob = new Blob([jsonText.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.selectedDevice ?? 'benchmark'}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function saveToFile() {
  try {
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${props.selectedDevice ?? 'benchmark'}.json`,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      })
      const writable = await handle.createWritable()
      await writable.write(jsonText.value)
      await writable.close()
    } else {
      // Safari fallback to download
      downloadFile()
    }
  } catch (err: any) {
    // If user cancels save dialog, fall back to download
    if (err.name !== 'AbortError') {
      console.error('Save failed, falling back to download:', err)
    }
    downloadFile()
  }
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
  max-width: 700px;
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

.json-preview {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #f8fafc;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-y: auto;
  margin-bottom: 12px;
  color: #0f172a;
  user-select: text;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.json-preview code {
  color: #0f172a;
}

.copy-success {
  font-size: 12px;
  color: #166534;
  background: #dcfce7;
  padding: 6px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
  display: inline-block;
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

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:active {
  background: #1d4ed8;
}

.btn-cancel {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-cancel:hover {
  background: #cbd5e1;
}
</style>
