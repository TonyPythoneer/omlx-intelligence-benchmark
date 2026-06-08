import { describe, it, expect } from "vite-plus/test";
import { parseImportInput, mergeImport } from "./import.mjs";

describe("parseImportInput", () => {
  it("parses fixed-width table with model and benchmarks", () => {
    const input = `Model: gpt-oss-20b-RotorQuant-MLX-8bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 80.0%        24      30     492.9     Yes
TRUTHFULQA           80.0%        24      30     138.8     Yes`;
    const result = parseImportInput(input);

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe("gpt-oss-20b-RotorQuant-MLX-8bit");
    expect(result[0].scores.MMLU).toEqual({
      accuracy: 80.0,
      samples: 30,
      time_s: 492.9,
    });
    expect(result[0].scores.TRUTHFULQA).toEqual({
      accuracy: 80.0,
      samples: 30,
      time_s: 138.8,
    });
  });

  it("parses multiple model blocks", () => {
    const input = `Model: Llama-2-7B
MMLU                 46.2%        14      30     100.0     No
Model: Llama-2-13B
MMLU                 55.8%        17      30     150.0     Yes`;
    const result = parseImportInput(input);

    expect(result).toHaveLength(2);
    expect(result[0].model).toBe("Llama-2-7B");
    expect(result[0].scores.MMLU.accuracy).toBe(46.2);
    expect(result[1].model).toBe("Llama-2-13B");
    expect(result[1].scores.MMLU.accuracy).toBe(55.8);
  });

  it("skips model blocks with no benchmark rows", () => {
    const input = `Model: NoScores
SomeRandomText
Model: WithScores
MMLU                 50.0%        15      30     200.0     No`;
    const result = parseImportInput(input);

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe("WithScores");
  });

  it("returns empty array on zero models", () => {
    const input = `Some random text
without any models`;
    const result = parseImportInput(input);
    expect(result).toEqual([]);
  });

  it("handles empty input", () => {
    const result = parseImportInput("");
    expect(result).toEqual([]);
  });
});

describe("mergeImport", () => {
  it("pushes NEW entry with template defaults", () => {
    const current = [];
    const detected = [
      {
        model: "NewModel",
        scores: {
          MMLU: { accuracy: 50, samples: 30, time_s: 100 },
        },
      },
    ];
    const result = mergeImport(current, detected, "2026-05-28");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      model: "NewModel",
      date: "2026-05-28",
      spec: { parameters_b: null, quantization: "", size_gb: null },
      deprecated: false,
      starred: false,
      scores: {
        MMLU: { accuracy: 50, samples: 30, time_s: 100 },
      },
    });
  });

  it("handles multiple NEW entries", () => {
    const current = [];
    const detected = [
      { model: "Model-A", scores: { MMLU: { accuracy: 50, samples: 30, time_s: 100 } } },
      { model: "Model-B", scores: { MMLU: { accuracy: 60, samples: 30, time_s: 150 } } },
    ];
    const result = mergeImport(current, detected, "2026-05-28");

    expect(result).toHaveLength(2);
    expect(result[0].model).toBe("Model-A");
    expect(result[1].model).toBe("Model-B");
  });

  it("OVERWRITE: updates scores only, preserves all other fields", () => {
    const current = [
      {
        model: "ExistingModel",
        date: "2026-05-25",
        spec: { parameters_b: 35, quantization: "4bit", size_gb: 18 },
        deprecated: false,
        starred: true,
        abilities: { thinking: true, mtp: false },
        tiers: { opus: true, sonnet: false, haiku: false },
        scores: { MMLU: { accuracy: 40, samples: 30, time_s: 100 } },
      },
    ];
    const detected = [
      {
        model: "ExistingModel",
        scores: {
          MMLU: { accuracy: 55, samples: 30, time_s: 120 },
          TRUTHFULQA: { accuracy: 48, samples: 30, time_s: 80 },
        },
      },
    ];
    const result = mergeImport(current, detected, "2026-05-28");

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe("ExistingModel");
    expect(result[0].date).toBe("2026-05-25");
    expect(result[0].spec).toEqual({ parameters_b: 35, quantization: "4bit", size_gb: 18 });
    expect(result[0].deprecated).toBe(false);
    expect(result[0].starred).toBe(true);
    expect(result[0].abilities).toEqual({ thinking: true, mtp: false });
    expect(result[0].tiers).toEqual({ opus: true, sonnet: false, haiku: false });
    expect(result[0].scores).toEqual({
      MMLU: { accuracy: 55, samples: 30, time_s: 120 },
      TRUTHFULQA: { accuracy: 48, samples: 30, time_s: 80 },
    });
  });

  it("handles mixed NEW and OVERWRITE in single batch", () => {
    const current = [
      {
        model: "Existing",
        date: "2026-05-25",
        spec: { parameters_b: 30, quantization: "8bit", size_gb: 10 },
        deprecated: false,
        starred: false,
        scores: { MMLU: { accuracy: 40, samples: 30, time_s: 100 } },
      },
    ];
    const detected = [
      { model: "Existing", scores: { MMLU: { accuracy: 50, samples: 30, time_s: 120 } } },
      { model: "New", scores: { MMLU: { accuracy: 60, samples: 30, time_s: 150 } } },
    ];
    const result = mergeImport(current, detected, "2026-05-28");

    expect(result).toHaveLength(2);
    expect(result[0].model).toBe("Existing");
    expect(result[0].date).toBe("2026-05-25");
    expect(result[0].scores.MMLU.accuracy).toBe(50);
    expect(result[1].model).toBe("New");
    expect(result[1].date).toBe("2026-05-28");
  });
});
