<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui';
import { cn } from '@/lib/utils';
import { X } from 'lucide-vue-next';

interface Props {
  open?: boolean;
  title?: string;
  description?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), { open: false });
const emit = defineEmits<{ close: [] }>();

// reka-ui Dialog is controlled via open + update:open. Map any close
// (Escape, outside-click, X button) back to the existing `close` contract.
function onOpenChange(value: boolean) {
  if (!value) emit('close');
}
</script>

<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <DialogContent
        :class="cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-background shadow-2xl border border-border flex flex-col focus:outline-none',
          props.class
        )"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <DialogTitle class="text-lg font-semibold text-foreground">{{ title }}</DialogTitle>
          <DialogDescription class="sr-only">{{ description || title || 'Dialog' }}</DialogDescription>
          <DialogClose
            class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X class="h-4 w-4" />
          </DialogClose>
        </div>
        <!-- Body -->
        <div class="overflow-y-auto flex-1">
          <slot />
        </div>
        <!-- Footer -->
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
