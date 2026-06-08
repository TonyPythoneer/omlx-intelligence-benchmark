<template>
  <div class="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-muted/50">
          <!-- Row 1: Group headers -->
          <tr class="border-b border-border">
            <th class="px-4 py-3 text-left font-semibold text-foreground">Model</th>
            <th colspan="3" class="px-4 py-3 text-left font-semibold text-foreground border-l-2 border-primary/30">Spec</th>
            <th v-if="!isLabelingMode" :colspan="visibleBenchmarksInOrder.length * 2" class="px-4 py-3 text-left font-semibold text-foreground border-l-2 border-primary/30">Score</th>
            <template v-else>
              <th class="px-4 py-3 text-left font-semibold text-foreground border-l-2 border-primary/30">Deprecated</th>
              <th colspan="3" class="px-4 py-3 text-left font-semibold text-foreground border-l-2 border-primary/30">Tiers</th>
            </template>
          </tr>
          <!-- Row 2: Subgroup headers -->
          <tr class="border-b border-border">
            <th class="px-4 py-2"></th>
            <th class="px-4 py-2 border-l-2 border-primary/30"></th>
            <th class="px-4 py-2"></th>
            <th class="px-4 py-2"></th>
            <template v-if="!isLabelingMode">
              <th
                v-for="benchmark in visibleBenchmarksInOrder"
                :key="benchmark"
                colspan="2"
                class="px-4 py-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-l-2 border-primary/20"
              >{{ benchmark }}</th>
            </template>
            <template v-else>
              <th class="px-4 py-2 h-8 border-l-2 border-primary/20"></th>
              <th class="px-4 py-2 h-8 border-l-2 border-primary/20"></th>
              <th class="px-4 py-2 h-8 border-l-2 border-primary/20"></th>
              <th class="px-4 py-2 h-8 border-l-2 border-primary/20"></th>
            </template>
          </tr>
          <!-- Row 3: Leaf headers (sortable) -->
          <tr class="border-b-2 border-border">
            <th class="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-left cursor-default whitespace-nowrap">Model</th>
            <th
              v-for="col in specCols"
              :key="col.key"
              class="px-4 py-2.5 text-xs font-semibold text-left cursor-pointer whitespace-nowrap select-none transition-colors hover:bg-primary/5"
              :class="[
                col.key === 'spec.parameters_b' ? 'border-l-2 border-primary/30' : '',
                sortCol === col.key ? 'text-primary bg-primary/5' : 'text-muted-foreground'
              ]"
              @click="onSort(col.key)"
            >
              {{ col.label }}
              <span v-if="sortCol === col.key" class="ml-0.5">{{ sortDir === 1 ? '↑' : '↓' }}</span>
            </th>
            <template v-if="!isLabelingMode">
              <template v-for="benchmark in visibleBenchmarksInOrder" :key="benchmark">
                <th
                  class="px-3 py-2.5 text-xs font-semibold cursor-pointer select-none transition-colors hover:bg-primary/5 border-l-2 border-primary/20"
                  :class="sortCol === `scores.${benchmark}.accuracy` ? 'text-primary bg-primary/5' : 'text-muted-foreground'"
                  @click="onSort(`scores.${benchmark}.accuracy`)"
                >🎯<span v-if="sortCol === `scores.${benchmark}.accuracy`" class="ml-0.5">{{ sortDir === 1 ? '↑' : '↓' }}</span></th>
                <th
                  class="px-3 py-2.5 text-xs font-semibold cursor-pointer select-none transition-colors hover:bg-primary/5"
                  :class="sortCol === `scores.${benchmark}.time_s` ? 'text-primary bg-primary/5' : 'text-muted-foreground'"
                  @click="onSort(`scores.${benchmark}.time_s`)"
                >⏲<span v-if="sortCol === `scores.${benchmark}.time_s`" class="ml-0.5">{{ sortDir === 1 ? '↑' : '↓' }}</span></th>
              </template>
            </template>
            <template v-else>
              <th class="px-3 py-2.5 text-xs font-semibold text-muted-foreground text-center cursor-default whitespace-nowrap border-l-2 border-primary/20">Deprecated</th>
              <th class="px-3 py-2.5 text-xs font-semibold text-violet-700 text-center cursor-default whitespace-nowrap border-l-2 border-primary/20">Opus</th>
              <th class="px-3 py-2.5 text-xs font-semibold text-blue-700 text-center cursor-default whitespace-nowrap border-l-2 border-primary/20">Sonnet</th>
              <th class="px-3 py-2.5 text-xs font-semibold text-emerald-700 text-center cursor-default whitespace-nowrap border-l-2 border-primary/20">Haiku</th>
            </template>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-if="entries.length === 0">
            <td :colspan="isLabelingMode ? 8 : 4 + visibleBenchmarksInOrder.length * 2" class="px-4 py-8 text-center text-muted-foreground text-sm">No entries loaded</td>
          </tr>
          <template v-for="entry in sortedEntries" :key="entry.model">
            <!-- Normal row -->
            <tr v-if="!isLabelingMode" class="hover:bg-muted/30 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-1.5">
                  <button @click="copyModelName(entry.model)" class="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-base leading-none" title="Copy model name">📋</button>
                  <button @click="searchHuggingFace(entry.model)" class="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-base leading-none" title="Search on HuggingFace">🤗</button>
                  <span class="text-foreground font-medium text-xs break-all">{{ entry.model }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap border-l-2 border-primary/20">{{ formatParams(entry.spec.parameters_b) }}</td>
              <td class="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{{ entry.spec.quantization || '–' }}</td>
              <td class="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{{ formatSize(entry.spec.size_gb) }}</td>
              <template v-for="benchmark in visibleBenchmarksInOrder" :key="benchmark">
                <td class="px-3 py-3 text-center border-l-2 border-primary/20">
                  <span
                    v-if="entry.scores[benchmark]?.accuracy"
                    :class="scoreBadgeClass(entry.scores[benchmark].accuracy)"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                  >{{ formattedAccuracy(entry.scores[benchmark].accuracy) }}%</span>
                  <span v-else class="text-muted-foreground/50 text-xs">–</span>
                </td>
                <td class="px-3 py-3 text-center text-xs text-muted-foreground">{{ formatTime(entry.scores[benchmark]?.time_s) }}</td>
              </template>
            </tr>

            <!-- Labeling mode row: inline per-column editors (swaps Score group for Deprecated + Tiers) -->
            <tr v-if="isLabelingMode" class="hover:bg-muted/30 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-1.5">
                  <button @click="copyModelName(entry.model)" class="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-base leading-none" title="Copy model name">📋</button>
                  <button @click="searchHuggingFace(entry.model)" class="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-base leading-none" title="Search on HuggingFace">🤗</button>
                  <span class="text-foreground font-medium text-xs break-all">{{ entry.model }}</span>
                </div>
              </td>
              <!-- Params -->
              <td class="px-3 py-2 whitespace-nowrap border-l-2 border-primary/20">
                <input
                  type="number"
                  :value="labelEdits?.[entry.model]?.parameters_b ?? ''"
                  @input="emit('update:labelEdit', entry.model, 'parameters_b', ($event.target as HTMLInputElement).value)"
                  class="h-7 w-20 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  :class="validationErrors?.[entry.model]?.parameters_b ? 'border-destructive bg-destructive/5' : 'border-input bg-background'"
                />
                <p v-if="validationErrors?.[entry.model]?.parameters_b" class="text-xs text-destructive mt-0.5">{{ validationErrors[entry.model].parameters_b.join(', ') }}</p>
              </td>
              <!-- Quant -->
              <td class="px-3 py-2 whitespace-nowrap">
                <input
                  type="text"
                  :value="labelEdits?.[entry.model]?.quantization ?? ''"
                  @input="emit('update:labelEdit', entry.model, 'quantization', ($event.target as HTMLInputElement).value)"
                  class="h-7 w-24 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </td>
              <!-- Size -->
              <td class="px-3 py-2 whitespace-nowrap">
                <input
                  type="number"
                  :value="labelEdits?.[entry.model]?.size_gb ?? ''"
                  @input="emit('update:labelEdit', entry.model, 'size_gb', ($event.target as HTMLInputElement).value)"
                  class="h-7 w-20 rounded border px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  :class="validationErrors?.[entry.model]?.size_gb ? 'border-destructive bg-destructive/5' : 'border-input bg-background'"
                />
                <p v-if="validationErrors?.[entry.model]?.size_gb" class="text-xs text-destructive mt-0.5">{{ validationErrors[entry.model].size_gb.join(', ') }}</p>
              </td>
              <!-- Deprecated -->
              <td class="px-3 py-2 text-center border-l-2 border-primary/20">
                <input
                  type="checkbox"
                  :checked="labelEdits?.[entry.model]?.deprecated ?? false"
                  @change="emit('update:labelEdit', entry.model, 'deprecated', ($event.target as HTMLInputElement).checked)"
                  class="accent-primary h-4 w-4 align-middle"
                />
              </td>
              <!-- Opus -->
              <td class="px-3 py-2 text-center border-l-2 border-primary/20">
                <input
                  type="checkbox"
                  :checked="labelEdits?.[entry.model]?.tier_opus ?? false"
                  @change="emit('update:labelEdit', entry.model, 'tier_opus', ($event.target as HTMLInputElement).checked)"
                  class="accent-violet-600 h-4 w-4 align-middle"
                />
              </td>
              <!-- Sonnet -->
              <td class="px-3 py-2 text-center border-l-2 border-primary/20">
                <input
                  type="checkbox"
                  :checked="labelEdits?.[entry.model]?.tier_sonnet ?? false"
                  @change="emit('update:labelEdit', entry.model, 'tier_sonnet', ($event.target as HTMLInputElement).checked)"
                  class="accent-blue-600 h-4 w-4 align-middle"
                />
              </td>
              <!-- Haiku -->
              <td class="px-3 py-2 text-center border-l-2 border-primary/20">
                <input
                  type="checkbox"
                  :checked="labelEdits?.[entry.model]?.tier_haiku ?? false"
                  @change="emit('update:labelEdit', entry.model, 'tier_haiku', ($event.target as HTMLInputElement).checked)"
                  class="accent-emerald-600 h-4 w-4 align-middle"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';
import { type Entry } from '../types/benchmark';

const props = defineProps<{
  entries: Entry[];
  visibleBenchmarks?: string[];
  isLabelingMode?: boolean;
  labelEdits?: Record<string, any>;
  validationErrors?: Record<string, Record<string, string[]>>;
}>();

const emit = defineEmits<{
  'update:labelEdit': [modelName: string, field: string, value: any];
}>();

const ALL_BENCHMARKS = ['MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH'];

const specCols = [
  { key: 'spec.parameters_b', label: 'Params' },
  { key: 'spec.quantization', label: 'Quant' },
  { key: 'spec.size_gb', label: 'Size' },
];

const visibleBenchmarksInOrder = computed(() => {
  const visible = props.visibleBenchmarks ?? ALL_BENCHMARKS;
  return ALL_BENCHMARKS.filter(b => visible.includes(b));
});

const sortCol: Ref<string> = ref('date');
const sortDir: Ref<1 | -1> = ref(-1);

function getSortValue(entry: Entry, col: string): any {
  if (col === 'date') return new Date(entry.date).getTime();
  if (col === 'spec.parameters_b') return entry.spec.parameters_b;
  if (col === 'spec.quantization') return entry.spec.quantization;
  if (col === 'spec.size_gb') return entry.spec.size_gb;
  if (col.startsWith('scores.')) {
    const [, bench, key] = col.split('.');
    return entry.scores[bench]?.[key] ?? null;
  }
  return null;
}

const sortedEntries = computed(() =>
  [...props.entries].sort((a, b) => {
    const av = getSortValue(a, sortCol.value);
    const bv = getSortValue(b, sortCol.value);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === 'string') return sortDir.value * av.localeCompare(bv);
    return sortDir.value * (av - bv);
  })
);

function onSort(col: string): void {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 1 ? -1 : 1;
  } else {
    sortCol.value = col;
    sortDir.value = 1;
  }
}

function copyModelName(modelName: string): void {
  navigator.clipboard.writeText(modelName);
}

function searchHuggingFace(modelName: string): void {
  window.open(`https://huggingface.co/models?search=${encodeURIComponent(modelName)}`, '_blank', 'noopener');
}

function scoreBadgeClass(accuracy: number | undefined): string {
  if (!accuracy) return '';
  if (accuracy >= 90) return 'bg-green-100 text-green-700';
  if (accuracy >= 80) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-700';
}

function formattedAccuracy(accuracy: number): string {
  return accuracy.toFixed(1);
}

function formatTime(time_s: number | null | undefined): string {
  if (time_s == null) return '–';
  const secs = Math.round(time_s);
  return secs < 60 ? `${secs}s` : `${Math.round(secs / 60)}m`;
}

function formatParams(val: number | null | undefined): string {
  return val != null ? `${val}B` : '–';
}

function formatSize(val: number | null | undefined): string {
  return val != null ? `${val.toFixed(2)} GB` : '–';
}
</script>
