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
        <div
          v-for="(entry, idx) in parsedEntries"
          :key="`${entry.model}-${idx}`"
          class="px-3 py-2.5"
        >
          <div class="flex items-center gap-2">
            <UiBadge :variant="entry.status === 'NEW' ? 'new' : 'overwrite'">{{
              entry.status
            }}</UiBadge>
            <span class="font-mono text-xs text-foreground flex-1 truncate">{{ entry.model }}</span>
          </div>
          <div v-if="entry.status === 'NEW'" class="mt-1 ml-0.5 text-xs text-muted-foreground">
            <span v-if="entry.sizeFetching" class="italic opacity-60">fetching size…</span>
            <span v-else-if="entry.spec.size_gb != null">{{ entry.spec.size_gb }} GB</span>
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
import UiBadge from "./ui/badge.vue";
import UiButton from "./ui/button.vue";

interface ParsedResult {
  model: string;
  scores: Record<string, unknown>;
  status: "NEW" | "OVERWRITE";
  spec: { parameters_b: number | null; quantization: string; size_gb: number | null };
  sizeFetching: boolean;
}

interface Props {
  isOpen: boolean;
  importText: string;
  parsedEntries: ParsedResult[];
  isApplyEnabled: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  importText: "",
  parsedEntries: () => [],
  isApplyEnabled: false,
});

const emit = defineEmits<{
  close: [];
  apply: [];
  "update:importText": [value: string];
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

function onClose() {
  emit("close");
}
function handleApply() {
  emit("apply");
}
</script>
