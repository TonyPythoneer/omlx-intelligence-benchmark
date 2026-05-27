import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { parseImportInput, mergeImport } from '../app/lib/import.mjs';

/**
 * Extract a field from GitHub Issue body by visible label heading.
 * GitHub Issue Form renders:
 * ### Device
 * m1-max-64GB-32c
 * ### Benchmark stdout
 * Model: ...
 *
 * @param {string} body - Raw Issue body
 * @param {string} label - Visible heading label (e.g., 'Device', 'Benchmark stdout')
 * @returns {string|undefined} Field value (trimmed)
 */
function extractField(body, label) {
  const pattern = new RegExp(`### ${label}\\s*\\n([\\s\\S]*?)(?=###|$)`, 'i');
  const match = body.match(pattern);
  return match ? match[1].trim() : undefined;
}

/**
 * Main function: apply benchmark import
 * @param {number} issueNumber - GitHub Issue number
 * @param {string} issueBody - Raw Issue body
 * @param {string} today - Today's date (YYYY-MM-DD)
 * @returns {{success: boolean, device?: string, entriesApplied?: number, error?: string}}
 */
export async function applyImport(issueNumber, issueBody, today = new Date().toISOString().split('T')[0]) {
  try {
    const device = extractField(issueBody, 'Device');
    const benchmark_stdout = extractField(issueBody, 'Benchmark stdout');

    if (!device || !benchmark_stdout) {
      return { success: false, error: 'Missing Device or Benchmark stdout field in Issue' };
    }

    const settingsPath = path.resolve('app/settings.json');
    const settingsRaw = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsRaw);

    if (!settings.devices || !settings.devices[device]) {
      return { success: false, error: `Unknown device: '${device}'` };
    }

    const detected = parseImportInput(benchmark_stdout);
    if (detected.length === 0) {
      return { success: false, error: 'No models detected in benchmark output' };
    }

    const dataPath = path.resolve(`app/data/${device}.json`);
    let currentData = [];
    try {
      const dataRaw = await fs.readFile(dataPath, 'utf8');
      currentData = JSON.parse(dataRaw);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        return { success: false, error: `Error reading data file: ${e.message}` };
      }
    }

    const newData = mergeImport(currentData, detected, today);

    await fs.writeFile(dataPath, JSON.stringify(newData, null, 2) + '\n', 'utf8');

    const branchName = `import/issue-${issueNumber}`;
    try {
      execSync(`git config user.name "github-actions[bot]"`, { stdio: 'inherit' });
      execSync(`git config user.email "github-actions[bot]@users.noreply.github.com"`, { stdio: 'inherit' });
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      execSync(`git add app/data/${device}.json`, { stdio: 'inherit' });
      execSync(`git commit -m "data: auto-import benchmark results for ${device}"`, { stdio: 'inherit' });
      execSync(`git push origin ${branchName}`, { stdio: 'inherit' });
    } catch (e) {
      return { success: false, error: `Git operation failed: ${e.message}` };
    }

    return {
      success: true,
      device,
      entriesApplied: detected.length
    };
  } catch (e) {
    return { success: false, error: `Unexpected error: ${e.message}` };
  }
}

// CLI entry point
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueBody = process.env.ISSUE_BODY;

  if (!issueNumber || !issueBody) {
    console.error('Usage: ISSUE_NUMBER=<n> ISSUE_BODY=<body> node apply-import.mjs');
    process.exit(1);
  }

  applyImport(issueNumber, issueBody).then(result => {
    if (!result.success) {
      console.error(`[ERROR] ${result.error}`);
      process.exit(1);
    }
    console.log(`[SUCCESS] Imported ${result.entriesApplied} entries for device ${result.device}`);
  }).catch(e => {
    console.error(`[FATAL] ${e.message}`);
    process.exit(1);
  });
}
