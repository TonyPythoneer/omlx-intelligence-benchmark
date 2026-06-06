<script setup lang="ts">
import { cn } from '@/lib/utils';
import { X } from 'lucide-vue-next';

interface Props {
  open?: boolean;
  title?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), { open: false });
defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="$emit('close')"
        />
        <!-- Panel -->
        <div
          :class="cn(
            'relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-background shadow-2xl border border-border flex flex-col',
            props.class
          )"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 class="text-lg font-semibold text-foreground">{{ title }}</h2>
            <button
              @click="$emit('close')"
              class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <!-- Body -->
          <div class="overflow-y-auto flex-1">
            <slot />
          </div>
          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.15s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
