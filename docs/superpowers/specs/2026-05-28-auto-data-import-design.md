# 設計規格：自動基準數據導入工作流程

**日期**：2026-05-28  
**狀態**：已批准  
**目標分支**：`main`

---

## 目標與非目標

### 目標
- 所有者可以在 GitHub Issue 中貼上基準測試 stdout，無需終端機操作
- CI 自動將數據合併到 `main`（零手工干預）
- 失敗時大聲失敗（清晰的錯誤訊息，不進行部分應用）
- 成功時自動關閉 Issue 並發佈確認留言

### 非目標
- 貢獻者直接觸發工作流程（他們可以建立 Issue，但所有者必須新增 `approved-import` 標籤以觸發）
- 草稿 PR 後援（失敗時直接失敗）
- 基於標籤配置的自動化（手工設定一次）
- JSON Schema-only 驗證（`vp test` 執行完整驗證）

---

## 架構圖

```
GitHub Issue (表單) ──▶ auto-data-import.yml
                        ├─ 所有者檢查
                        ├─ apply-import.mjs 執行解析
                        │    ├─ parseImportInput（與瀏覽器共用）
                        │    └─ mergeImport（NEW / OVERWRITE 邏輯）
                        ├─ 提交至 import/issue-<N>
                        └─ gh pr create + gh pr merge --auto

PR 開啟 ──▶ validate-data.yml（必需檢查）
             ├─ vp test（JSON Schema + 邏輯驗證）
             └─ green ──▶ 自動合併

PR 合併 ──▶ post-merge-notify.yml
           ├─ gh issue comment "已合併至 #<PR>"
           └─ gh issue close
```

---

## 元件設計

### `.github/ISSUE_TEMPLATE/auto-data-import.yml`

**目的**：定義數據導入 Issue 表單（dropdown + textarea）。

**功能**：
- 頂部 `markdown` 區塊解釋自動觸發政策（所有者專用；貢獻者建立 Issue 但等待批准）
- Field 1：Device 下拉（選項**靜態列出** `app/settings.json` 中現存的所有設備鍵；更新設備時需手動更新表單）—— **必需**
- Field 2：Benchmark stdout textarea，`render: text` 自動代碼塊化 —— **必需**；包含代表性 stdout 格式的佔位符

**契約**：
- 所有者和貢獻者都可以建立 Issue
- Issue body 的 YAML frontmatter 包含 `device` 和 `benchmark_stdout` 欄位
- CI 讀取 Issue body，提取這兩個欄位

### `.github/workflows/auto-data-import.yml`

**目的**：監聽 Issue 事件，決定何時執行導入。

**觸發器**：
1. `on: issues: types: [opened]` + `if: github.event.issue.user.login == github.repository_owner`
2. `on: issues: types: [labeled]` + `if: github.event.label.name == 'approved-import'`

**步驟**（兩個觸發器都執行相同 `import` job）：
1. 簽出代碼
2. 執行 `node scripts/apply-import.mjs` 傳入 `${{ github.event.issue.number }}` 和 `${{ github.event.issue.body }}`
3. 如果 `apply-import.mjs` 失敗（exit 1）：bot 發佈評論，工作流程停止（Issue 保持開啟）
4. 如果成功：建立分支 `import/issue-<N>`、提交、執行 `gh pr create`
5. 啟用 auto-merge：`gh pr merge --auto --squash --delete-branch`

**權限**：
- `contents: write`（提交、分支建立）
- `pull-requests: write`（PR 建立、auto-merge）
- `issues: write`（評論）

### `.github/workflows/validate-data.yml`

**目的**：對觸及 `app/data/**` 的 PR 執行必需檢查。

**觸發器**：`on: pull_request` + `paths: ['app/data/**']`

**步驟**：
1. 簽出代碼
2. `npm install`（或 `vp install`）
3. `vp test`（執行所有 `app/lib/**/*.test.mjs` 包括 JSON 模式驗證）
4. 如果失敗，檢查會標記為紅色

**成功**：此檢查綠色是 auto-merge 的必要條件。

### `.github/workflows/post-merge-notify.yml`

**目的**：在導入 PR 合併後，評論原始 Issue 並關閉它。

**觸發器**：
- `on: pull_request: types: [closed]`
- `if: github.event.pull_request.merged == true && startsWith(github.event.pull_request.head.ref, 'import/issue-')`

**步驟**：
1. 從 branch 名稱 `import/issue-<N>` 解析 Issue 編號
2. `gh issue comment <N> "Merged in #<PR_NUMBER>"`
3. `gh issue close <N>`

**限制**：`GITHUB_TOKEN` 無法偽造此操作 —— 只有 CI 可以執行。

### `scripts/apply-import.mjs`

**目的**：CI Node.js 指令碼；讀取 Issue body，解析基準測試 stdout，寫入數據文件。

**簽名**：
```javascript
export async function applyImport(issueNumber, issueBody, today = '2026-05-28') {
  // 返回 { success, device, entriesApplied, error? }
}
```

**邏輯**：
1. 從 Issue YAML 解析 `device` 和 `benchmark_stdout`
2. 驗證 `device` 存在於 `app/settings.json` 中
3. 呼叫 `parseImportInput(benchmark_stdout)` 得到檢測到的條目陣列
4. 返回 `{ success: false, error: "..." }` 如果解析零條目或設備不存在
5. 讀取 `app/data/<device>.json`（如果缺失，使用空陣列）
6. 呼叫 `mergeImport(currentData, detected, today)` 得到新陣列
7. 將新陣列寫入 `app/data/<device>.json`
8. 建立分支 `import/issue-<issueNumber>`、提交、推送
9. 返回 `{ success: true, device, entriesApplied }`

**錯誤轉義**：
- 解析失敗、設備不存在、合併衝突 → `{ success: false, error: "..." }` → 工作流程發佈評論並 `exit 1`

### `app/lib/import.mjs`

**目的**：從 `app/index.html` 提取的純 ES 模組；瀏覽器和 CI 共用。

**導出**：
- `parseImportInput(text)` — 解析基準測試 stdout，返回 `{ model, scores }` 條目陣列
  - 以 `(?=^Model:)` 切塊；每個塊第一行取 model 名稱
  - 逐行用 regex `/^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)/gm` 解析固定寬度表格
  - 每個 score 是物件 `{ accuracy: float, samples: int, time_s: float }`（非純數字）
  - 沒有任何 score 行的塊會被跳過；零模型輸入返回 `[]`

- `mergeImport(currentData, detected, today)` — 應用檢測到的條目
  - 對於每個檢測到的條目：
    - 按 `model` 名稱查詢現有條目
    - **NEW**（未找到）：推送 `{ model, date: today, spec: { parameters_b: null, quantization: '', size_gb: null }, deprecated: false, starred: false, scores }`（無 `abilities` / `tiers`，這些於 Labeling Mode 補上）
    - **OVERWRITE**（已找到）：僅更新 `scores`；保留所有其他欄位（date / spec / deprecated / starred / abilities / tiers）
  - 返回新陣列

**契約**：
- 無 DOM 依賴（純邏輯）
- 接收字串 / 陣列，返回陣列
- 由 `app/index.html` 透過 `<script type="module">` 載入並分配至全域變數，以便現有內聯 onclick 處理程序繼續工作

### `app/lib/import.test.mjs`

**目的**：Vitest 測試覆蓋解析和合併。

**覆蓋**：
- 標準 stdout（用戶範例）
- 多個 `Model:` 區塊
- 缺失的基準測試
- NEW vs OVERWRITE 合併行為
- 空/無效輸入
- JSON 模式驗證（所有 `app/data/*.json` 檔案符合所需結構）

**運行**：`vp test`

---

## Issue 表單架構（完整 YAML）

```yaml
name: Auto Data Import
description: |
  Paste benchmark stdout to trigger automatic data merge to main.
  
  ⚠️ **Owner Only (Auto-Trigger)**  
  When you (repository owner) create this issue, the workflow automatically runs.
  
  **Contributors**: you can create this issue, but auto-trigger requires owner approval.
  To approve, the owner adds the `approved-import` label to manually trigger the workflow.
  
  Edit the issue body to retry; re-add the label.

body:
  - type: dropdown
    id: device
    attributes:
      label: Device
      description: Target device for benchmark data
      options:
        - m1-max-64GB-32c
    validations:
      required: true
      
  - type: textarea
    id: benchmark_stdout
    attributes:
      label: Benchmark stdout
      description: Paste complete benchmark runner output
      placeholder: |
        Model: Llama-2-7B
        MMLU: 46.2
        TRUTHFULQA: 42.1
        Model: Llama-2-13B
        MMLU: 55.8
        TRUTHFULQA: 48.3
      render: text
    validations:
      required: true
```

---

## 失敗處理矩陣

| 錯誤類別 | 檢測時點 | 用戶可見行為 | 工作流程 |
|---------|----------|-----------|--------|
| **解析零模型** | `apply-import.mjs` | Issue 評論："未檢測到基準測試" | exit 1，Issue 保持開啟 |
| **設備未知** | `apply-import.mjs` | Issue 評論："不存在的設備 '<device>'" | exit 1，Issue 保持開啟 |
| **合併衝突** | `apply-import.mjs` git 操作 | Issue 評論："無法應用導入（合併衝突）" | exit 1，Issue 保持開啟 |
| **JSON 驗證失敗** | `validate-data.yml` | PR 檢查紅色，auto-merge 阻止 | PR 保持開啟；用戶編輯 Issue、重新推送 |
| **邏輯驗證失敗** | `validate-data.yml` / `vp test` | PR 檢查紅色，auto-merge 阻止 | 同上 |

**用戶恢復流程**（所有情況）：
1. 編輯 Issue body（更正設備、修復 stdout）
2. 所有者重新新增 `approved-import` 標籤（貢獻者 Issue）或 Issue 已由所有者建立（自動重試）
3. 工作流程重新執行

---

## 必需設定步驟

### 1. 標籤建立（所有者一次性）

```bash
gh label create approved-import \
  --description "Owner-approved: trigger auto-data-import workflow" \
  --color "0E8A16"
```

### 2. 倉庫設定

- **允許 auto-merge**：Settings → Pull Requests → "Allow auto-merge"（啟用）
- **GitHub Actions 權限**：Settings → Actions → General
  - Workflow permissions：`Read and write permissions`
  - Allow GitHub Actions to create and approve pull requests：✓（啟用）

### 3. 分支保護規則（如果已設定）

- 新增 `validate-data.yml` 至必需檢查清單（如果目前有分支保護規則）

---

## 測試策略

### `vp test` 涵蓋

- **Vitest 單元測試** (`app/lib/import.test.mjs`)：
  - 解析邏輯（stdout → 模型陣列）
  - 合併邏輯（NEW / OVERWRITE）
  - 邊界案例（空輸入、缺失欄位）
  
- **JSON Schema 驗證** (Vitest 外掛)：
  - 所有 `app/data/*.json` 檔案符合資料格式結構
  - 檢查必需欄位、類型

### CI 中的整合測試

- `auto-data-import.yml` 在實際 Issue 上執行（需要測試 Issue 或手工驗證）

---

## 文件更新清單

### `CLAUDE.md`
將舊行 "Keep `app/index.html` serverless: no external JS, no build step, no bundler." 更新為：

```markdown
- Keep `app/index.html` serverless. Dev server via `vp dev`, tests via `vp test`. 
  **Do not run `vp build`** — the site is serverless by design.
```

### `docs/readme/pages/development.md`
將 `make serve` 更新為包含 `vp dev` 和 `vp test` 的說明（保留 `make serve` 作為委派）。

---

## YAGNI 註記

我們明確選擇**不**建立：

1. **草稿 PR 後援**：失敗時直接失敗；Issue 保持開啟，使用者重試。無自動草稿。
2. **JSON Schema-only 檢查**：`vp test` 執行完整驗證（不只是 Schema）。
3. **基於標籤配置的自動化**：`approved-import` 標籤在 repo 設定中手工建立一次；無 ConfigAsCode。
4. **貢獻者自動觸發**：貢獻者可以建立 Issue，但等待所有者批准（防止未預期的 main 變更）。

---

## 檔案佈局（最終）

```
.github/
├── workflows/
│   ├── auto-data-import.yml      # Issue → PR → auto-merge
│   ├── validate-data.yml          # PR 必需檢查 (vp test)
│   └── post-merge-notify.yml      # 評論 + 關閉 Issue
└── ISSUE_TEMPLATE/
    └── auto-data-import.yml       # Issue 表單

scripts/
└── apply-import.mjs               # CI 指令碼：解析 + 寫入

app/
├── index.html                     # 載入 ./lib/import.mjs
└── lib/
    ├── import.mjs                 # 解析 + 合併（共用）
    └── import.test.mjs            # Vitest 測試

vite.config.ts                     # root=app, port=8080, test config
package.json                       # vite-plus devDep
.gitignore                         # add node_modules/
Makefile                           # serve → vp dev
CLAUDE.md                          # 已更新
docs/readme/pages/development.md   # 已更新
```

---

## 實作注意事項

- **分支命名**：`import/issue-<N>` 確保 post-merge-notify 可以識別
- **Squash 合併**：auto-merge 使用 `--squash` 保持 main 乾淨
- **日期**：`mergeImport` 接收 `today` 參數（CI 中為執行日期）
- **錯誤訊息**：Issue 評論使用簡潔、可操作的文本（例如："不存在的設備 'foo'"）

