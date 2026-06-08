<script setup lang="ts">
import { SelectItem, SelectItemText, SelectItemIndicator } from "reka-ui";
import { cn } from "@/lib/utils";
import { Check } from "lucide-vue-next";

interface Props {
  value: string;
  disabled?: boolean;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <SelectItem
    :value="props.value"
    :disabled="props.disabled"
    :class="
      cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <span class="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
