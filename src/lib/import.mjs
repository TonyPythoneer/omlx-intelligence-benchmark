/**
 * Parse benchmark stdout to extract model entries.
 * Input: fixed-width table format (see app/index.html lines 1160-1184)
 *
 * Example input:
 * Model: gpt-oss-20b-RotorQuant-MLX-8bit
 * Benchmark         Accuracy   Correct   Total   Time(s)   Think
 * MMLU                 80.0%        24      30     492.9     Yes
 * TRUTHFULQA           80.0%        24      30     138.8     Yes
 *
 * @param {string} text - Raw benchmark stdout
 * @returns {Array<{model: string, scores: Object}>} Detected entries with scores
 */
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
    scoreRe.lastIndex = 0;

    let m;
    while ((m = scoreRe.exec(block)) !== null) {
      const [, bench, accuracy, samples, time_s] = m;
      scores[bench] = {
        accuracy: parseFloat(accuracy),
        samples: parseInt(samples, 10),
        time_s: parseFloat(time_s),
      };
    }

    if (Object.keys(scores).length > 0) {
      results.push({ model: modelName, scores });
    }
  }

  return results;
}

/**
 * Merge detected entries into current data array.
 * NEW entries: pushed with template defaults (see CLAUDE.md).
 * OVERWRITE entries: only scores updated; ALL other fields (date, spec, deprecated, starred, abilities, tiers) preserved.
 *
 * @param {Array} currentData - Existing data entries
 * @param {Array} detected - Newly detected entries from parseImportInput
 * @param {string} today - Today's date (YYYY-MM-DD)
 * @returns {Array} Merged data array
 */
export function mergeImport(currentData, detected, today) {
  const nextData = currentData.map((e) => ({ ...e }));
  const byModel = new Map(nextData.map((e, i) => [e.model, i]));

  for (const d of detected) {
    if (byModel.has(d.model)) {
      // OVERWRITE: only update scores
      const idx = byModel.get(d.model);
      nextData[idx] = { ...nextData[idx], scores: d.scores };
    } else {
      // NEW: push with template defaults
      nextData.push({
        model: d.model,
        date: today,
        spec: { parameters_b: null, quantization: "", size_gb: null },
        deprecated: false,
        starred: false,
        scores: d.scores,
      });
    }
  }

  return nextData;
}
