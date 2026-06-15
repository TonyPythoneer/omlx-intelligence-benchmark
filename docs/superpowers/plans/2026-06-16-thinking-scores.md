# Thinking / No-Thinking Score Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display thinking and no-thinking benchmark scores as two stacked rows in each score cell, with a legend column to the left of MMLU.

**Architecture:** Add `scores_no_thinking?: Scores` to the Entry type (zero migration — existing `scores` = thinking mode). Update the import parser to route Think=No rows to the new field. Update BenchmarkTable to render two rows per score cell plus a legend column.

**Tech Stack:** Vue 3, TypeScript, Tailwind v4, Vite+ (`vp test` / `vp check`)

---

## File Map

| File | Change |
|---|---|
| `src/types/benchmark.ts` | Add `scores_no_thinking?: Scores` to `Entry` |
| `src/lib/import.test.mjs` | Fix broken test + add new tests for Think routing |
| `src/lib/import.mjs` | Route Think=No → `scores_no_thinking`; update mergeImport |
| `src/composables/useImport.ts` | Update `ParsedResult`, `parsedEntries`, `applyImport` for `scores_no_thinking` |
| `src/composables/useImport.test.ts` | Add test for `scores_no_thinking` passthrough |
| `src/components/BenchmarkTable.vue` | Legend column in header + 2-row score cells in body |

`ExportModal.vue` and all `public/data/*.json` files are **not touched** — existing `scores` is already thinking data; the export destructuring already preserves `scores_no_thinking` via `...rest`.

> **Important:** The app uses `useImport.ts`'s own `applyImport` (not `mergeImport` from `import.mjs`). Both must be updated.

---

### Task 1: Extend the Entry type

**Files:**
- Modify: `src/types/benchmark.ts`

- [ ] **Step 1: Add the optional field**

Open `src/types/benchmark.ts`. The current `Entry` interface ends with:

```typescript
export interface Entry {
  model: string;
  date: string;
  spec: Spec;
  deprecated: boolean;
  tiers: Tiers;
  scores: Scores;
  labelling?: {
    tiers: Tiers;
  };
  abilities?: Abilities;
  starred?: boolean;
}
```

Replace the body so it reads:

```typescript
export interface Entry {
  model: string;
  date: string;
  spec: Spec;
  deprecated: boolean;
  tiers: Tiers;
  scores: Scores;
  scores_no_thinking?: Scores;
  labelling?: {
    tiers: Tiers;
  };
  abilities?: Abilities;
  starred?: boolean;
}
```

- [ ] **Step 2: Type-check**

```bash
vp check
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/benchmark.ts
git commit -m "feat(types): add scores_no_thinking optional field to Entry"
```

---

### Task 2: Fix existing broken test + write failing tests for import routing

The `parseImportInput` change in Task 3 will break an existing test that expects Think=No data in `scores`. Fix it now (before implementation) and add new tests to drive the implementation.

**Files:**
- Modify: `src/lib/import.test.mjs`

- [ ] **Step 1: Fix "parses multiple model blocks" test**

This test has one Think=No row and expects it in `result[0].scores.MMLU` — that will break after our change. Update the expectation to `scores_no_thinking`:

Find the test block starting with `it("parses multiple model blocks"` and replace its entire body:

```js
it("parses multiple model blocks", () => {
  const input = `Model: Llama-2-7B
MMLU                 46.2%        14      30     100.0     No
Model: Llama-2-13B
MMLU                 55.8%        17      30     150.0     Yes`;
  const result = parseImportInput(input);

  expect(result).toHaveLength(2);
  expect(result[0].model).toBe("Llama-2-7B");
  expect(result[0].scores_no_thinking.MMLU.accuracy).toBe(46.2);
  expect(result[1].model).toBe("Llama-2-13B");
  expect(result[1].scores.MMLU.accuracy).toBe(55.8);
});
```

- [ ] **Step 2: Add failing tests for Think routing in parseImportInput**

After the existing `describe("parseImportInput", ...)` block, add a new `describe` block inside it (or add tests at the end of the existing describe), before `describe("mergeImport", ...)`:

```js
it("routes Think=No rows to scores_no_thinking", () => {
  const input = `Model: ModelA
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 80.0%        24      30     492.9     Yes
TRUTHFULQA           75.0%        15      30     138.8     No`;
  const result = parseImportInput(input);

  expect(result).toHaveLength(1);
  expect(result[0].scores.MMLU).toEqual({ accuracy: 80.0, samples: 30, time_s: 492.9 });
  expect(result[0].scores.TRUTHFULQA).toBeUndefined();
  expect(result[0].scores_no_thinking.TRUTHFULQA).toEqual({
    accuracy: 75.0,
    samples: 30,
    time_s: 138.8,
  });
  expect(result[0].scores_no_thinking.MMLU).toBeUndefined();
});

it("sets scores_no_thinking only when Think=No rows exist", () => {
  const input = `Model: ThinkingOnly
MMLU                 83.3%        25      30     849.6     Yes`;
  const result = parseImportInput(input);

  expect(result[0].scores.MMLU.accuracy).toBe(83.3);
  expect(result[0].scores_no_thinking).toBeUndefined();
});
```

- [ ] **Step 3: Add failing tests for mergeImport with scores_no_thinking**

Inside `describe("mergeImport", ...)`, add these two tests:

```js
it("OVERWRITE: replaces scores_no_thinking independently of scores", () => {
  const current = [
    {
      model: "ExistingModel",
      date: "2026-05-25",
      spec: { parameters_b: 35, quantization: "4bit", size_gb: 18 },
      deprecated: false,
      starred: false,
      tiers: { opus: true, sonnet: false, haiku: false },
      scores: { MMLU: { accuracy: 80, samples: 30, time_s: 500 } },
      scores_no_thinking: { MMLU: { accuracy: 70, samples: 30, time_s: 200 } },
    },
  ];
  // Paste a no-thinking run only (Think=No for all rows)
  const detected = [
    {
      model: "ExistingModel",
      scores: {},
      scores_no_thinking: { MMLU: { accuracy: 72, samples: 30, time_s: 180 } },
    },
  ];
  const result = mergeImport(current, detected, "2026-06-16");

  expect(result).toHaveLength(1);
  expect(result[0].scores.MMLU.accuracy).toBe(80); // thinking preserved
  expect(result[0].scores_no_thinking.MMLU.accuracy).toBe(72); // no-thinking updated
  expect(result[0].tiers.opus).toBe(true); // other fields preserved
});

it("NEW: includes scores_no_thinking when detected entry has it", () => {
  const detected = [
    {
      model: "BrandNew",
      scores: { MMLU: { accuracy: 83, samples: 30, time_s: 850 } },
      scores_no_thinking: { MMLU: { accuracy: 75, samples: 30, time_s: 120 } },
    },
  ];
  const result = mergeImport([], detected, "2026-06-16");

  expect(result).toHaveLength(1);
  expect(result[0].scores.MMLU.accuracy).toBe(83);
  expect(result[0].scores_no_thinking.MMLU.accuracy).toBe(75);
});
```

- [ ] **Step 4: Run tests — verify they fail**

```bash
vp test src/lib/import.test.mjs
```

Expected: several FAIL lines including `routes Think=No rows to scores_no_thinking`, `OVERWRITE: replaces scores_no_thinking independently`, `NEW: includes scores_no_thinking`, and the updated `parses multiple model blocks`.

- [ ] **Step 5: Commit the tests**

```bash
git add src/lib/import.test.mjs
git commit -m "test(import): add failing tests for Think=No routing and mergeImport accumulation"
```

---

### Task 3: Implement import parser changes

**Files:**
- Modify: `src/lib/import.mjs`

- [ ] **Step 1: Update parseImportInput to bucket by Think value**

Replace the `parseImportInput` function body. The key change: capture group 5 (`think`) is now used to route the row:

```js
export function parseImportInput(text) {
  const results = [];
  const blocks = text.split(/(?=^Model:)/m);
  const scoreRe = /^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)/gm;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed.startsWith("Model:")) continue;

    const modelName = trimmed
      .split("\n")[0]
      .replace(/^Model:/, "")
      .trim();
    const scores = {};
    const scores_no_thinking = {};
    scoreRe.lastIndex = 0;

    let m;
    while ((m = scoreRe.exec(block)) !== null) {
      const [, bench, accuracy, samples, time_s, think] = m;
      const leaf = {
        accuracy: parseFloat(accuracy),
        samples: parseInt(samples, 10),
        time_s: parseFloat(time_s),
      };
      if (think.toLowerCase() === "no") {
        scores_no_thinking[bench] = leaf;
      } else {
        scores[bench] = leaf;
      }
    }

    if (Object.keys(scores).length > 0 || Object.keys(scores_no_thinking).length > 0) {
      const entry = { model: modelName, scores };
      if (Object.keys(scores_no_thinking).length > 0) {
        entry.scores_no_thinking = scores_no_thinking;
      }
      results.push(entry);
    }
  }

  return results;
}
```

- [ ] **Step 2: Update mergeImport to handle scores_no_thinking independently**

Replace the `mergeImport` function body:

```js
export function mergeImport(currentData, detected, today) {
  const nextData = currentData.map((e) => ({ ...e }));
  const byModel = new Map(nextData.map((e, i) => [e.model, i]));

  for (const d of detected) {
    if (byModel.has(d.model)) {
      // OVERWRITE: only update the score fields present in this run
      const idx = byModel.get(d.model);
      const updates = {};
      if (d.scores && Object.keys(d.scores).length > 0) {
        updates.scores = d.scores;
      }
      if (d.scores_no_thinking && Object.keys(d.scores_no_thinking).length > 0) {
        updates.scores_no_thinking = d.scores_no_thinking;
      }
      nextData[idx] = { ...nextData[idx], ...updates };
    } else {
      // NEW: push with template defaults
      const entry = {
        model: d.model,
        date: today,
        spec: { parameters_b: null, quantization: "", size_gb: null },
        deprecated: false,
        starred: false,
        scores: d.scores,
      };
      if (d.scores_no_thinking && Object.keys(d.scores_no_thinking).length > 0) {
        entry.scores_no_thinking = d.scores_no_thinking;
      }
      nextData.push(entry);
    }
  }

  return nextData;
}
```

- [ ] **Step 3: Run tests — verify they all pass**

```bash
vp test src/lib/import.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 4: Run full test suite to check for regressions**

```bash
vp test
```

Expected: all tests PASS (including `useImport.test.ts` — its `makeBenchmarkText` uses Think=Yes so `entry.scores` still receives the data).

- [ ] **Step 5: Commit**

```bash
git add src/lib/import.mjs
git commit -m "feat(import): route Think=No rows to scores_no_thinking, accumulate independently"
```

---

### Task 4: Update useImport composable for scores_no_thinking

`useImport.ts` has its own `applyImport` that is separate from `mergeImport` in `import.mjs`. It needs the same changes: pass `scores_no_thinking` through `ParsedResult`, and handle it independently in the OVERWRITE and NEW branches.

**Files:**
- Modify: `src/composables/useImport.ts`
- Modify: `src/composables/useImport.test.ts`

- [ ] **Step 1: Write a failing test for scores_no_thinking passthrough**

In `src/composables/useImport.test.ts`, add a new test inside `describe("merge NEW entries")`:

```ts
it("includes scores_no_thinking when import has Think=No rows", () => {
  const currentEntries = ref<Entry[]>([]);
  const { importText, applyImport } = useImport(currentEntries);

  importText.value = `Model: TestModel-7B
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 80.0%        24      30     492.9     Yes
TRUTHFULQA           70.0%        21      30     138.8     No`;
  applyImport(currentEntries);

  expect(currentEntries.value).toHaveLength(1);
  const entry = currentEntries.value[0];
  expect(entry.scores.MMLU).toEqual({ accuracy: 80.0, samples: 30, time_s: 492.9 });
  expect(entry.scores.TRUTHFULQA).toBeUndefined();
  expect(entry.scores_no_thinking?.TRUTHFULQA).toEqual({
    accuracy: 70.0,
    samples: 30,
    time_s: 138.8,
  });
});
```

Also add a test inside `describe("merge OVERWRITE entries")`:

```ts
it("updates scores_no_thinking independently on OVERWRITE", () => {
  const existing = makeEntry("existing-model", {
    scores: { MMLU: { accuracy: 80, samples: 30, time_s: 500 } },
    scores_no_thinking: { MMLU: { accuracy: 70, samples: 30, time_s: 200 } } as Scores,
  });
  const currentEntries = ref<Entry[]>([existing]);
  const { importText, applyImport } = useImport(currentEntries);

  importText.value = `Model: existing-model
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 75.0%        22      30     180.0     No`;
  applyImport(currentEntries);

  expect(currentEntries.value).toHaveLength(1);
  const entry = currentEntries.value[0];
  expect(entry.scores.MMLU.accuracy).toBe(80); // thinking preserved
  expect(entry.scores_no_thinking?.MMLU.accuracy).toBe(75); // no-thinking updated
});
```

Add `import type { Scores } from "../types/benchmark";` to the imports if not already present.

- [ ] **Step 2: Run tests — verify they fail**

```bash
vp test src/composables/useImport.test.ts
```

Expected: 2 new tests FAIL.

- [ ] **Step 3: Update ParsedResult and parsedEntries in useImport.ts**

At the top of `useImport.ts`, update `ParsedResult` to include the new field:

```ts
interface ParsedResult {
  model: string;
  scores: Scores;
  scores_no_thinking?: Scores;
  status: "NEW" | "OVERWRITE";
  spec: {
    parameters_b: number | null;
    quantization: string;
    size_gb: number | null;
  };
  sizeFetching: boolean;
}
```

Update `getRawParsedResults` return type:

```ts
function getRawParsedResults(): Array<{ model: string; scores: Scores; scores_no_thinking?: Scores }> {
  if (!importText.value.trim()) return [];
  try {
    return parseImportInput(importText.value);
  } catch {
    return [];
  }
}
```

Update `parsedEntries` computed to pass through `scores_no_thinking`:

```ts
const parsedEntries = computed<ParsedResult[]>(() => {
  const raw = getRawParsedResults();
  const existingModels = new Set(currentEntries.value.map((e) => e.model));

  return raw.map((result) => {
    const status = existingModels.has(result.model) ? "OVERWRITE" : "NEW";
    return {
      model: result.model,
      scores: result.scores,
      scores_no_thinking: result.scores_no_thinking,
      status,
      spec: {
        parameters_b: null,
        quantization: "",
        size_gb: modelSizes.value[result.model] ?? null,
      },
      sizeFetching: sizeFetching.value[result.model] ?? false,
    };
  });
});
```

- [ ] **Step 4: Update applyImport to handle scores_no_thinking**

Replace the `applyImport` function:

```ts
function applyImport(mutableEntries: Ref<Entry[]>): void {
  const current = mutableEntries.value;
  const today = getTodaysDate();
  const existingMap = new Map(current.map((e, i) => [e.model, i]));
  const merged = [...current];

  for (const parsed of parsedEntries.value) {
    const existingIdx = existingMap.get(parsed.model);
    if (existingIdx !== undefined) {
      const updates: Partial<Entry> = {};
      if (parsed.scores && Object.keys(parsed.scores).length > 0) {
        updates.scores = parsed.scores;
      }
      if (parsed.scores_no_thinking && Object.keys(parsed.scores_no_thinking).length > 0) {
        updates.scores_no_thinking = parsed.scores_no_thinking;
      }
      merged[existingIdx] = { ...merged[existingIdx], ...updates };
    } else {
      const entry: Entry = {
        model: parsed.model,
        date: today,
        spec: parsed.spec,
        abilities: { thinking: false, mtp: false },
        tiers: { opus: false, sonnet: false, haiku: false },
        deprecated: false,
        scores: parsed.scores,
      };
      if (parsed.scores_no_thinking && Object.keys(parsed.scores_no_thinking).length > 0) {
        entry.scores_no_thinking = parsed.scores_no_thinking;
      }
      merged.push(entry);
    }
  }

  mutableEntries.value = merged;
  closeModal();
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
vp test src/composables/useImport.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Run full check**

```bash
vp check && vp test
```

Expected: no errors, all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/composables/useImport.ts src/composables/useImport.test.ts
git commit -m "feat(useImport): pass scores_no_thinking through ParsedResult and applyImport"
```

---

### Task 5: Update BenchmarkTable to show 2-row score cells and legend column

**Files:**
- Modify: `src/components/BenchmarkTable.vue`

#### 5a — Header changes

- [ ] **Step 1: Run full check and tests (baseline)**

```bash
vp check && vp test
```

Expected: all pass before making UI changes.

- [ ] **Step 2: Increase Score group colspan and add legend cell in Row 1**

Find this line (Row 1, Score group header, inside `v-if="!isLabelingMode"`):

```html
<th
  v-if="!isLabelingMode"
  :colspan="visibleBenchmarksInOrder.length * 2"
  class="px-4 py-3 text-left font-semibold text-foreground border-l-2 border-primary/30"
>
  Score
</th>
```

Change the colspan to `visibleBenchmarksInOrder.length * 2 + 1`:

```html
<th
  v-if="!isLabelingMode"
  :colspan="visibleBenchmarksInOrder.length * 2 + 1"
  class="px-4 py-3 text-left font-semibold text-foreground border-l-2 border-primary/30"
>
  Score
</th>
```

- [ ] **Step 3: Add legend cell in Row 2 (subgroup headers)**

Inside the `<template v-if="!isLabelingMode">` block in Row 2, add a legend `<th>` **before** the `v-for` benchmark headers:

```html
<template v-if="!isLabelingMode">
  <th
    class="px-2 py-2 text-center text-sm border-l-2 border-primary/30"
    title="上排 thinking／下排 no thinking"
  >
    💡
  </th>
  <th
    v-for="(benchmark, bi) in visibleBenchmarksInOrder"
    :key="benchmark"
    colspan="2"
    class="px-4 py-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-l-2"
    :class="bi === 0 ? 'border-primary/20' : 'border-primary/20'"
  >
    {{ benchmark }}
  </th>
</template>
```

Note: the first benchmark's border class changes from `border-primary/30` → `border-primary/20` because the legend cell now holds the `border-primary/30` border.

- [ ] **Step 4: Add legend cell in Row 3 (leaf headers)**

Inside the `<template v-if="!isLabelingMode">` block in Row 3, add a legend `<th>` **before** the `v-for` benchmark leaf headers:

```html
<template v-if="!isLabelingMode">
  <th
    class="px-2 py-2.5 text-center text-sm text-muted-foreground cursor-default border-l-2 border-primary/30"
    title="上排 thinking／下排 no thinking"
  >
    <div class="flex flex-col items-center leading-none gap-0.5">
      <span>💡</span>
      <span class="opacity-30">💡</span>
    </div>
  </th>
  <template v-for="(benchmark, bi) in visibleBenchmarksInOrder" :key="benchmark">
    <th
      class="px-3 py-2.5 text-xs font-semibold cursor-pointer select-none transition-colors hover:bg-primary/5 border-l-2"
      :class="[
        bi === 0 ? 'border-primary/20' : 'border-primary/20',
        sortCol === `scores.${benchmark}.accuracy`
          ? 'text-primary bg-primary/5'
          : 'text-muted-foreground',
      ]"
      @click="onSort(`scores.${benchmark}.accuracy`)"
    >
      🎯<span v-if="sortCol === `scores.${benchmark}.accuracy`" class="ml-0.5">{{
        sortDir === 1 ? "↑" : "↓"
      }}</span>
    </th>
    <th
      class="px-3 py-2.5 text-xs font-semibold cursor-pointer select-none transition-colors hover:bg-primary/5"
      :class="
        sortCol === `scores.${benchmark}.time_s`
          ? 'text-primary bg-primary/5'
          : 'text-muted-foreground'
      "
      @click="onSort(`scores.${benchmark}.time_s`)"
    >
      ⏲<span v-if="sortCol === `scores.${benchmark}.time_s`" class="ml-0.5">{{
        sortDir === 1 ? "↑" : "↓"
      }}</span>
    </th>
  </template>
</template>
```

#### 5b — Body changes

- [ ] **Step 5: Add legend `<td>` in normal mode rows**

In the `<tr v-if="!isLabelingMode">` body row, add a legend `<td>` after the Spec `<td>` and before the `<template v-for="(benchmark, bi) in visibleBenchmarksInOrder">`:

```html
<td class="px-2 py-3 text-center border-l-2 border-primary/30">
  <div class="flex flex-col items-center leading-none gap-1">
    <span class="text-sm">💡</span>
    <span class="text-sm opacity-30">💡</span>
  </div>
</td>
```

- [ ] **Step 6: Make accuracy `<td>` show two stacked rows**

Replace the current score cell pair inside `<template v-for="(benchmark, bi) in visibleBenchmarksInOrder">`:

```html
<template v-for="(benchmark, bi) in visibleBenchmarksInOrder" :key="benchmark">
  <td
    class="px-3 py-3 text-center border-l-2"
    :class="bi === 0 ? 'border-primary/20' : 'border-primary/20'"
  >
    <div class="flex flex-col gap-1">
      <!-- thinking row -->
      <span
        v-if="entry.scores[benchmark]?.accuracy != null"
        :class="scoreBadgeClass(entry.scores[benchmark].accuracy)"
        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      >{{ formattedAccuracy(entry.scores[benchmark].accuracy) }}%</span>
      <span v-else class="text-muted-foreground/50 text-xs">–</span>
      <!-- no-thinking row -->
      <span
        v-if="entry.scores_no_thinking?.[benchmark]?.accuracy != null"
        :class="scoreBadgeClass(entry.scores_no_thinking[benchmark].accuracy)"
        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold opacity-50"
      >{{ formattedAccuracy(entry.scores_no_thinking[benchmark].accuracy) }}%</span>
      <span v-else class="text-muted-foreground/30 text-xs">–</span>
    </div>
  </td>
  <td class="px-3 py-3 text-center text-xs text-muted-foreground">
    <div class="flex flex-col gap-1">
      <span>{{ formatTime(entry.scores[benchmark]?.time_s) }}</span>
      <span class="opacity-50">{{ formatTime(entry.scores_no_thinking?.[benchmark]?.time_s) }}</span>
    </div>
  </td>
</template>
```

Note: the first benchmark border class changes from `border-primary/30` → `border-primary/20` (legend cell now holds the /30 border).

- [ ] **Step 7: Fix empty-row colspan**

Find the empty state `<td>`:

```html
:colspan="isLabelingMode ? 6 : 2 + visibleBenchmarksInOrder.length * 2"
```

Change to account for the new legend column:

```html
:colspan="isLabelingMode ? 6 : 3 + visibleBenchmarksInOrder.length * 2"
```

- [ ] **Step 8: Run full checks**

```bash
vp check && vp test
```

Expected: no TypeScript or lint errors, all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/BenchmarkTable.vue
git commit -m "feat(table): show thinking/no-thinking scores as stacked rows with legend column"
```
