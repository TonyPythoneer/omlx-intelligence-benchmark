window.BENCHMARK_DATA = [
  {
    "model": "Qwen3.6-35B-A3B-TurboQuant-MLX-4bit",
    "date": "2026-05-25",
    "spec": { "parameters_b": 35, "quantization": "4bit", "size_gb": 19.5 },
    "abilities": { "thinking": true, "mtp": false },
    "scores": {
      "MMLU":          { "accuracy": 83.3, "samples": 30, "time_s": 835.1 },
      "TRUTHFULQA":    { "accuracy": 90.0, "samples": 30, "time_s": 406.5 },
      "HUMANEVAL":     { "accuracy": 93.3, "samples": 30, "time_s": 1117.7 },
      "MBPP":          { "accuracy": 90.0, "samples": 30, "time_s": 1275.5 },
      "LIVECODEBENCH": { "accuracy": 60.0, "samples": 30, "time_s": 5767.2 }
    }
  },
  {
    "model": "Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-MLX-oQ4-MTP",
    "date": "2026-05-25",
    "spec": { "parameters_b": 35, "quantization": "Q4", "size_gb": 19.5 },
    "abilities": { "thinking": true, "mtp": true },
    "scores": {
      "MMLU":          { "accuracy": 83.3, "samples": 30, "time_s": 399.2 },
      "TRUTHFULQA":    { "accuracy": 96.7, "samples": 30, "time_s": 89.7 },
      "HUMANEVAL":     { "accuracy": 86.7, "samples": 30, "time_s": 657.4 },
      "MBPP":          { "accuracy": 80.0, "samples": 30, "time_s": 617.3 },
      "LIVECODEBENCH": { "accuracy": 26.7, "samples": 30, "time_s": 4325.2 }
    }
  },
  {
    "model": "Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking-8bit",
    "date": "2026-05-25",
    "spec": { "parameters_b": 40, "quantization": "8bit", "size_gb": 43.0 },
    "abilities": { "thinking": true, "mtp": false },
    "scores": {
      "MMLU":          { "accuracy": 86.7, "samples": 30, "time_s": 2792.8 },
      "TRUTHFULQA":    { "accuracy": 90.0, "samples": 30, "time_s": 2646.3 },
      "HUMANEVAL":     { "accuracy": 93.3, "samples": 30, "time_s": 2718.0 },
      "MBPP":          { "accuracy": 90.0, "samples": 30, "time_s": 4975.5 },
      "LIVECODEBENCH": { "accuracy": 40.0, "samples": 30, "time_s": 31038.6 }
    }
  },
  {
    "model": "Qwopus3.6-27B-v2-MLX-4bit",
    "date": "2026-05-25",
    "spec": { "parameters_b": 27, "quantization": "4bit", "size_gb": 14.0 },
    "abilities": { "thinking": true, "mtp": false },
    "scores": {
      "MMLU":       { "accuracy": 83.3, "samples": 30, "time_s": 2398.2 },
      "TRUTHFULQA": { "accuracy": 93.3, "samples": 30, "time_s": 1613.0 }
    }
  }
]
