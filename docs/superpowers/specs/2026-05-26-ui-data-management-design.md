# UI 內建資料管理 + 進階篩選

**Date:** 2026-05-26
**Status:** Approved

## 目標

把 `add_data.py` 的功能完整搬進 `app/index.html` 的 UI，讓使用者在瀏覽器內完成貼 stdout → parse → 編輯 → 存檔的流程；同時加入更精細的篩選（搜尋、Params 範圍、Tier、Metrics 分類）以及每行 model 的快捷操作（複製名稱、開 HuggingFace）。

## 限制與原則

- 維持 serverless 靜態頁，無 build step、無外部 JS 套件
- 全部變更收斂在 `app/index.html`（vanilla JS）、`app/settings.json` 兩處
- 刪除 Python 端工具（`add_data.py`、`tests/`、`.github/workflows/ci.yml`）

## 架構總覽

```
app/index.html      — 單頁，含所有 UI、parser、寫檔邏輯
app/settings.json   — 增加 parametersBreakpoints
app/data/*.json     — 資料格式不變
```

刪除：
- `add_data.py`
- `tests/test_add_result.py`
- `.github/workflows/ci.yml`
- `Makefile` 內 `setup` / `test` target
- `CLAUDE.md` 對應段落

## 環境偵測

`window.location.hostname` 為 `localhost` 或 `127.0.0.1` 時視為本機環境，顯示 Import / Save 相關功能；否則隱藏。

## Header 控制列

```
┌──────────────────────────────────────────────────────────────────┐
│ oMLX Intelligence Benchmark                                      │
│                                                                  │
│ 🔍 [search model...]   [+ Import]  [✏ Label]  [⚙]  [device ▾]    │
│ Tier:    [ All | Opus | Sonnet | Haiku ]                         │
│ Metrics: [ All | Basic | Advanced ]    ☐ Show Deprecated         │
│ Params:  [——●═══════════●——]   12B – 60B                         │
└──────────────────────────────────────────────────────────────────┘
```

| 控制元件 | 行為 |
|---|---|
| 搜尋框 | substring，case-insensitive，即時過濾 |
| Tier filter | segmented buttons（單選），預設 All |
| Metrics filter | segmented buttons（單選），預設 All |
| Show Deprecated | checkbox，預設關 |
| Params slider | dual-handle range，刻度由 `settings.json` 讀取 |
| `[+ Import]` | 本機才顯示，開 Import Modal |
| `[✏ Label]` | 切換 labeling 模式 |
| `[⚙]` | 本機才顯示，開 Settings Modal（編輯 breakpoints） |

## `settings.json` 變更

```json
{
  "defaultDevice": "m1-max-64GB-32c",
  "parametersBreakpoints": [0, 12, 24, 60],
  "devices": { ... }
}
```

`parametersBreakpoints` 是嚴格遞增的數字陣列。slider 顯示時，最後一段標為「以上」/「∞」。Settings Modal 提供編輯介面並透過 `showSaveFilePicker()` 寫回 `settings.json`。

## Import Modal

### 入口

Header 上 `[+ Import]` 按鈕（本機才顯示，且風格參照現有 Export Modal）。

### Modal 內容

```
┌─────────────────────────────────────────────────────────┐
│ Import Benchmark Data                              ×    │
├─────────────────────────────────────────────────────────┤
│ Paste benchmark runner output:                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Model: ...                                          │ │
│ │ MMLU 83.3% 30 30 835.1 yes                          │ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ─── Detected models (3) ─────────────────────────────── │
│ [新增]   Qwen3.6-35B-A3B-...           thinking: yes    │
│ [覆蓋]   Qwen3.6-40B-Claude-...        thinking: yes    │
│ [新增]   AnotherModel-...              thinking: no     │
│                                                         │
│ ─── Spec (applied to [新增] entries only) ───────────── │
│ Params: [___]  Quant: [___]  Size: [___]   MTP: [□]    │
│  placeholder 35    4bit       19.50                     │
│                                                         │
│ ⚠ Params required (positive integer)                    │
├─────────────────────────────────────────────────────────┤
│ Target: app/data/m1-max-64GB-32c.json   [Cancel][Save] │
└─────────────────────────────────────────────────────────┘
```

### Parser

把 `add_data.py` 的 `parse_input()` 直譯成 JS：

```js
function parseImportInput(text) {
  // 切割 "Model: ..." 區塊
  // 每個區塊用 score regex 抓: bench, accuracy%, samples, time_s, think
  // 回傳: [{model, thinking, scores: {BENCH: {accuracy, samples, time_s}}}, ...]
}
```

regex 與 Python 版本對齊：
- block split: `/(?=^Model:)/m`
- score: `/^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)/m`

### 多筆 model 處理

- 解析後逐筆顯示，標示 `[新增]` / `[覆蓋]`
- `[覆蓋]` 列：和 `app/data/<device>.json` 比對 `model` 字串完全相等
- `[新增]` 列只在表頭的 spec 欄位（params/quant/size/mtp）填妥時才會被儲存
- 全部都是 `[覆蓋]` 時，spec 欄位 disabled 並顯示提示

### 覆蓋語意

對 `[覆蓋]` 列：
- **只更新** `scores`
- 其餘欄位（`spec`, `abilities`, `tiers`, `deprecated`, `date`）保留原值
- `thinking` 即使 parser 偵測到不一致也不變動（spec 完整性歸 labeling 模式管）

對 `[新增]` 列：
- 套用表頭填的 spec
- `abilities.thinking` 由 parser 推斷
- `abilities.mtp` 由表頭 switch 決定
- `date` = 今天
- `deprecated` = false
- `tiers` = `{opus: false, sonnet: false, haiku: false}`

### Spec 欄位驗證

| 欄位 | 型別 | placeholder | 驗證 |
|---|---|---|---|
| `parameters_b` | number | `35` | 整數 > 0 |
| `quantization` | text | `4bit` | 非空字串 |
| `size_gb` | number | `19.50` | 浮點 > 0；存檔時 round to 2 |
| `mtp` | switch | — | bool |

未通過時欄位紅框 + 下方紅字提示；存在錯誤時 Save 按鈕 disabled。

### Save 行為

```js
async function saveToDataFile(device, data) {
  if ('showSaveFilePicker' in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: `${device}.json`,
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    })
    const writable = await handle.createWritable()
    await writable.write(JSON.stringify(data, null, 2) + '\n')
    await writable.close()
  } else {
    // Safari fallback: 觸發下載
    const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${device}.json`
    a.click()
  }
}
```

存檔成功後關閉 modal、reload `currentData`、show toast。

## Labeling 模式擴充

原本 labeling 顯示：`Model | Deprecated | Opus | Sonnet | Haiku`

擴充後：`Model | Params | Quant | Size | Think | MTP | Deprecated | Opus | Sonnet | Haiku`

| 欄位 | UI | 驗證 |
|---|---|---|
| `parameters_b` | inline number input | 整數 > 0 |
| `quantization` | inline text input | 非空字串 |
| `size_gb` | inline number input | 浮點 > 0 |
| `thinking` | switch | bool |
| `mtp` | switch | bool |
| `deprecated` | switch | bool |
| `tiers.opus/sonnet/haiku` | switch ×3 | bool |

placeholder 同 Import Modal 表格。驗證錯誤時該 cell 紅框；存在錯誤時 Export Data 按鈕 disabled。

Labeling 模式 Export 流程不變（產生完整 JSON 顯示 + 複製到剪貼簿）。

## Model 欄位互動

每行 model 名稱前固定顯示兩個淺灰小 icon（`color: #cbd5e1`，hover 變 `#475569`）：

```
📋 🤗  Qwen3.6-35B-A3B-TurboQuant-MLX-4bit  [DEPRECATED]
```

- `📋`：複製完整 model 名稱到剪貼簿，toast「已複製」
- `🤗`：在新分頁開啟 `https://huggingface.co/models?search=${encodeURIComponent(model)}`

Model 欄位 **取消排序**（移除 `cursor: pointer` + click handler；header 仍顯示「Model」字樣但無 sort 行為）。

## 排序預設

- 初始 sort：`date DESC`（最新在上）
- `sortCol = 'date'`, `sortDir = -1` 初始化
- 點其他欄位 header 切換 sort；點 Model header 不觸發

新增 `'date'` 到 `getSortValue` 處理（`new Date(entry.date).getTime()`）。

## Metrics filter

| 選項 | 顯示 group |
|---|---|
| All | Knowledge + Commonsense & Reasoning + Coding（現況）|
| Basic | Knowledge + Commonsense & Reasoning |
| Advanced | Coding |

實作上維護一個 `visibleBenchmarks` derived state，從 `CATEGORIES` 篩選；`buildHeaders()` 與 `buildRow()` 一律使用此 derived list 而非 `ALL_BENCHMARKS`。

## Params slider

- dual-handle range，刻度節點由 `parametersBreakpoints` 決定
- 顯示文字：`{minLabel} – {maxLabel}`，最後一個 breakpoint 顯示為 `{n}B+`
- 內部以 breakpoint 索引運作（避免 segment 寬度不均產生視覺扭曲）
- filter 條件：`bp[minIdx] <= entry.spec.parameters_b <= (maxIdx === last ? ∞ : bp[maxIdx])`
- 預設 minIdx = 0、maxIdx = last（不過濾）

## Settings Modal

簡單表單編輯 `parametersBreakpoints`：

```
┌─────────────────────────────────────────┐
│ Settings                           ×    │
├─────────────────────────────────────────┤
│ Parameters slider breakpoints:          │
│                                         │
│ [0]  [12]  [24]  [60]  [+ Add]          │
│                       (each removable)  │
│                                         │
│ ⚠ Values must be strictly increasing    │
├─────────────────────────────────────────┤
│                  [Cancel]  [Save]       │
└─────────────────────────────────────────┘
```

Save 用同樣的 `showSaveFilePicker()` 寫回 `app/settings.json`，suggestedName 為 `settings.json`。

## 篩選與排序的整合管線

```
data
  └─> filter by deprecated
  └─> filter by tier
  └─> filter by params range
  └─> filter by search substring
  └─> sort (default: date DESC)
  └─> render with visibleBenchmarks (metrics filter)
```

## 檔案清理清單

- 刪除 `add_data.py`
- 刪除 `tests/test_add_result.py`
- 刪除 `.github/workflows/ci.yml`
- 編輯 `Makefile` 移除 `setup` / `test` target
- 編輯 `CLAUDE.md`：移除 `add_data.py` 相關說明、tests 相關章節、CI 段落；加上 Import Modal / Labeling 擴充 / settings.json 新欄位的說明
- 編輯 `app/data/device.json.template`（若有引用 add_data.py 的注釋則清掉）

## 驗收條件

1. Chrome / Edge 下，能在 UI 內貼 stdout、設定 spec、儲存到 `app/data/<device>.json` 並覆蓋成功
2. 重新 import 同一個 model 時，原本的 `tiers` / `deprecated` 保留，`scores` 被更新
3. Labeling 模式可編輯 abilities + spec + tiers + deprecated，驗證失敗時 Export 按鈕 disabled
4. Params slider 拖動可正確過濾出對應參數範圍的 model
5. Tier / Metrics segmented buttons 切換即時生效
6. 搜尋框輸入字串可以匹配 model 名稱的任意位置
7. 每行的 📋 複製 model 名稱、🤗 開 HuggingFace 搜尋頁
8. Model 欄位不可排序，預設依日期由新到舊
9. 部署到 GitHub Pages 後，Import / Settings 按鈕隱藏
10. Safari 下 Save 自動 fallback 為下載
