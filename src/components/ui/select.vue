<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
} from "reka-ui";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-vue-next";

interface Props {
  modelValue?: string;
  disabled?: boolean;
  placeholder?: string;
  class?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <SelectRoot
    :model-value="props.modelValue"
    :disabled="props.disabled"
    @update:model-value="emit('update:modelValue', ($event as string) ?? '')"
  >
    <SelectTrigger
      :class="
        cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background pl-3 pr-2.5 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground',
          props.class,
        )
      "
    >
      <SelectValue :placeholder="props.placeholder ?? ''" />
      <SelectIcon as-child>
        <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        :class="
          cn(
            'relative z-50 min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md',
          )
        "
      >
        <SelectViewport class="max-h-[300px] p-1">
          <slot />
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
