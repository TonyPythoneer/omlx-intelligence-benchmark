<template>
  <UiDialog :open="isOpen" title="Export Data" class="max-w-3xl" @close="$emit('close')">
    <div class="px-6 pt-4 pb-2 flex flex-col gap-3">
      <pre
        class="flex-1 rounded-md border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed overflow-y-auto max-h-[400px] select-text whitespace-pre-wrap break-words text-foreground"
        >{{ jsonText }}</pre
      >
      <Transition name="fade">
        <span
          v-if="copySuccess"
          class="text-xs text-emerald-700 bg-emerald-50 rounded px-3 py-1.5 self-start"
          >Copied to clipboard!</span
        >
      </Transition>
    </div>

    <template #footer>
      <UiButton variant="outline" size="sm" @click="copyToClipboard">Copy to Clipboard</UiButton>
      <UiButton size="sm" @click="saveToFile">Save to File</UiButton>
      <UiButton variant="ghost" size="sm" @click="$emit('close')">Close</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Entry } from "../types/benchmark";
import UiDialog from "./ui/dialog.vue";
import UiButton from "./ui/button.vue";

interface Props {
  isOpen: boolean;
  entries: Entry[];
  selectedDevice?: string;
}

const props = withDefaults(defineProps<Props>(), { isOpen: false, entries: () => [] });
defineEmits<{ close: [] }>();

const copySuccess = ref(false);
const jsonText = computed(() =>
  JSON.stringify(
    // strip `abilities` (never user-edited) and the vestigial `labelling` field
    props.entries.map(({ abilities, labelling, ...rest }) => rest),
    null,
    2,
  ),
);

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(jsonText.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch {
    alert("Failed to copy to clipboard");
  }
}

async function downloadFile() {
  const blob = new Blob([jsonText.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${props.selectedDevice ?? "benchmark"}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function saveToFile() {
  try {
    if ("showSaveFilePicker" in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${props.selectedDevice ?? "benchmark"}.json`,
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonText.value);
      await writable.close();
    } else {
      downloadFile();
    }
  } catch (err: any) {
    if (err.name !== "AbortError") downloadFile();
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
