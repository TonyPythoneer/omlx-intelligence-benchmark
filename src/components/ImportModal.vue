<template>
  <UiDialog :open="isOpen" title="Import Benchmark Results" @close="onClose">
    <div class="px-6 pt-4 pb-2 flex flex-col gap-4">
      <UiTextarea
        v-model="importTextLocal"
        :rows="8"
        placeholder="Paste benchmark runner stdout here..."
        class="font-mono text-xs resize-none"
      />

      <!-- Parsed entries -->
      <div
        v-if="parsedEntries.length > 0"
        class="rounded-md border border-border bg-muted/30 max-h-[260px] overflow-y-auto divide-y divide-border"
      >
        <div v-for="(entry, idx) in parsedEntries" :key="`${entry.model}-${idx}`" class="px-3 py-3">
          <div class="flex items-center gap-2 mb-2">
            <UiBadge :variant="entry.status === 'NEW' ? 'new' : 'overwrite'">{{
              entry.status
            }}</UiBadge>
            <span class="font-mono text-xs text-foreground flex-1 truncate">{{ entry.model }}</span>
          </div>
          <div v-if="entry.status === 'NEW'" class="flex gap-2 flex-wrap">
            <UiInput
              type="number"
              :value="specForms[entry.model]?.parameters_b || ''"
              @input="updateSpecForm(entry.model, 'parameters_b', $event)"
              placeholder="Params (B)"
              class="flex-1 min-w-[80px] h-7 text-xs"
            />
            <UiInput
              type="text"
              :value="specForms[entry.model]?.quantization || ''"
              @input="updateSpecForm(entry.model, 'quantization', $event)"
              placeholder="Quantization"
              class="flex-1 min-w-[80px] h-7 text-xs"
            />
            <UiInput
              type="number"
              step="0.1"
              :value="specForms[entry.model]?.size_gb || ''"
              @input="updateSpecForm(entry.model, 'size_gb', $event)"
              placeholder="Size (GB)"
              class="flex-1 min-w-[80px] h-7 text-xs"
            />
          </div>
        </div>
      </div>

      <p v-else-if="importTextLocal.trim()" class="text-sm text-center text-muted-foreground py-4">
        No entries found in the pasted text.
      </p>
    </div>

    <template #footer>
      <UiButton variant="outline" size="sm" @click="onClose">Cancel</UiButton>
      <UiButton size="sm" :disabled="!isApplyEnabled" @click="handleApply">Apply</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import UiDialog from "./ui/dialog.vue";
import UiTextarea from "./ui/textarea.vue";
import UiInput from "./ui/input.vue";
import UiBadge from "./ui/badge.vue";
import UiButton from "./ui/button.vue";

interface ParsedResult {
  model: string;
  scores: Record<string, any>;
  status: "NEW" | "OVERWRITE";
  specFilled: boolean;
  spec: { parameters_b: number | null; quantization: string; size_gb: number | null };
}

interface Props {
  isOpen: boolean;
  importText: string;
  parsedEntries: ParsedResult[];
  isApplyEnabled: boolean;
  specForms: Record<string, { parameters_b: string; quantization: string; size_gb: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  importText: "",
  parsedEntries: () => [],
  isApplyEnabled: false,
  specForms: () => ({}),
});

const emit = defineEmits<{
  close: [];
  apply: [];
  "update:importText": [value: string];
  "update:specForms": [value: Record<string, any>];
}>();

const importTextLocal = ref(props.importText);
watch(
  () => props.importText,
  (v) => {
    importTextLocal.value = v;
  },
);
watch(importTextLocal, (v) => {
  emit("update:importText", v);
});

function updateSpecForm(
  model: string,
  field: "parameters_b" | "quantization" | "size_gb",
  event: Event,
) {
  const target = event.target as HTMLInputElement;
  emit("update:specForms", {
    ...props.specForms,
    [model]: { ...props.specForms[model], [field]: target.value },
  });
}

function onClose() {
  emit("close");
}
function handleApply() {
  emit("apply");
}
</script>
