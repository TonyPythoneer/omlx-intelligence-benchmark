<template>
  <UiCard class="mb-6 px-4 py-3">
    <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <UiInput
          type="text"
          placeholder="Search models..."
          :value="modelSearch"
          @input="$emit('update:modelSearch', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Tier -->
      <div class="flex items-center gap-2">
        <UiLabel>Tier</UiLabel>
        <div class="inline-flex border border-border rounded-md overflow-hidden bg-background">
          <button
            v-for="opt in tierOptions"
            :key="opt.value"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="
              tierFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="$emit('update:tierFilter', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Metrics -->
      <div class="flex items-center gap-2">
        <UiLabel>Metrics</UiLabel>
        <div class="inline-flex border border-border rounded-md overflow-hidden bg-background">
          <button
            v-for="opt in metricsOptions"
            :key="opt.value"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="
              metricsFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="$emit('update:metricsFilter', opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Show Deprecated -->
      <div class="flex items-center gap-2">
        <input
          id="show-deprecated"
          type="checkbox"
          :checked="showDeprecated"
          @change="$emit('update:showDeprecated', ($event.target as HTMLInputElement).checked)"
          class="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer"
        />
        <UiLabel
          for="show-deprecated"
          class="normal-case cursor-pointer font-medium text-sm text-foreground tracking-normal"
          >Show Deprecated</UiLabel
        >
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from "./ui/card.vue";
import UiInput from "./ui/input.vue";
import UiLabel from "./ui/label.vue";

defineEmits<{
  "update:modelSearch": [value: string];
  "update:tierFilter": [value: "all" | "opus" | "sonnet" | "haiku"];
  "update:metricsFilter": [value: "all" | "basic" | "advanced"];
  "update:showDeprecated": [value: boolean];
}>();

defineProps<{
  modelSearch: string;
  tierFilter: "all" | "opus" | "sonnet" | "haiku";
  metricsFilter: "all" | "basic" | "advanced";
  showDeprecated: boolean;
}>();

const tierOptions = [
  { label: "All", value: "all" as const },
  { label: "Opus", value: "opus" as const },
  { label: "Sonnet", value: "sonnet" as const },
  { label: "Haiku", value: "haiku" as const },
];

const metricsOptions = [
  { label: "All", value: "all" as const },
  { label: "Basic", value: "basic" as const },
  { label: "Advanced", value: "advanced" as const },
];
</script>
