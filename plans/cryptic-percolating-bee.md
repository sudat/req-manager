# code-simplify: 共通化・簡素化 計画

難易度: ★★☆
根拠: 6 files, ~170 lines削減, 5 components/hooks連携
リスク: 抽象化で公開インターフェース変更 → 呼び出し元を全数確認が必要

---

## 判断背景

Fetch hooks（use-system-functions, use-business-tasks 等）は見た目に類似するが、
各hookのpre-fetch validation（null/undefined/空文字分岐）が個別に異なるため、
今回は「共通化しない」と判断。YAGNI原則。

以下5項目は「実際のコード比較で確認した」清潔な抽象化対象。

---

## 実施項目（実行順）

### Item 1: `useSettingsManager<T>` — 設定管理Hookの共通化 (DRY)

**対象の重複:**
- `hooks/use-project-settings.ts` (113行)
- `hooks/use-llm-settings.ts` (113行)
- 2つのファイルが唯一の変数（import元関数名・型名）以外で95%+ identical

**作成ファイル:**
- `hooks/use-settings-manager.ts` (新規)

**設計:**
```typescript
// hooks/use-settings-manager.ts
type SettingsFns<T> = {
  fetch: (projectId: string) => Promise<{ data: T | null; error: string | null }>;
  save: (projectId: string, settings: T) => Promise<{ error: string | null }>;
  defaultValue: T;
};

export function useSettingsManager<T>(projectId: string | null, fns: SettingsFns<T>) {
  // 既存の loading / saving / error / success / settings state + fetch/save/reset/update
}
```

**変更ファイル:**
- `hooks/use-project-settings.ts` → `useSettingsManager<ProjectInvestigationSettings>` を呼び出すだけのラッパーに縮小
- `hooks/use-llm-settings.ts`    → `useSettingsManager<ProjectLlmSettings>`    を呼び出すだけのラッパーに縮小

**削減量:** 約80行

---

### Item 2: `useSetSelection<T>` — Set型選択パターンの共通化 (DRY)

**対象の重複:**
- `hooks/use-acceptance-selection.ts` L31-48: toggleSelect + toggleSelectAll
- `hooks/use-link-batch-operations.ts` L37-58: handleToggleSelect + handleToggleSelectAll
- Set の add/delete + 全選択/全解除 が逐一同じコード

**作成ファイル:**
- `hooks/use-set-selection.ts` (新規)

**設計:**
```typescript
// hooks/use-set-selection.ts
export function useSetSelection<T>(items: T[], getId: (item: T) => string) {
  // selectedIds: Set<string>
  // toggleSelect(id)
  // toggleSelectAll()
  // clearSelection()
  // isAllSelected: boolean
}
```

**変更ファイル:**
- `hooks/use-acceptance-selection.ts` → `useSetSelection` を内部で利用し、Set操作は削除
- `hooks/use-link-batch-operations.ts` → `useSetSelection` を内部で利用し、Set操作は削除
  - 注: `use-link-batch-operations` の `toggleSelectAll` は `suspectLinks` をフィルタリングしてから全選択するため、`items` には `suspectLinks` を渡す

**削減量:** 約25行

---

### Item 3: `resource-lists.tsx` セルレンダラー関数の抽出 (DRY)

**対象の重複:**
`config/resource-lists.tsx` 内で以下4つのセルパターンが4+箇所に繰り返される:

| パターン | 出現箇所 |
|---------|---------|
| IDバッジ (`<Badge variant="outline" className="font-mono text-[12px] border-slate-200 bg-slate-50 ...">`) | businessColumns[0], systemDomainColumns[0], systemFunctionColumns[0] |
| 名前テキスト (`<span className="text-[14px] font-medium text-slate-900">`) | businessColumns[1], systemDomainColumns[1], conceptColumns[1], systemFunctionColumns[1], businessTaskColumns[1] |
| サマリーテキスト (`<div className="max-w-[300px] truncate text-[13px] text-slate-600" title={stripMarkdown(...)}>`) | businessColumns[2], systemFunctionColumns[4], businessTaskColumns[2] |
| カウント表示 (`<span className="font-mono text-[16px] font-semibold ...">N<span>件</span>`) | businessColumns[3,4], systemDomainColumns[3], conceptColumns[4] |

**変更ファイル:**
- `config/resource-lists.tsx` — 上記4つの共通関数を同ファイルの冒頭に抽出し、各カラム定義で利用に変更

```typescript
// 抽出する共通関数
function renderIdBadge(value: string): React.ReactNode { ... }
function renderName(value: string): React.ReactNode { ... }
function renderSummary(value: string): React.ReactNode { ... }
function renderCount(count: number): React.ReactNode { ... }
```

**削減量:** 約40行

---

### Item 4: `chunk-handlers.ts` の conceptCandidates 転送抽出 + console.log除去

**対象の重複:**
`app/api/chat/lib/chunk-handlers.ts` の `handleToolResult` 関数内:
- L199-202 (bt_draft) と L222-225 (br_draft) で同じ `conceptCandidates` 転送ロジック
- console.log が8本散在（デバッグ残り）

**変更ファイル:**
- `app/api/chat/lib/chunk-handlers.ts`

```typescript
// 抽出する共通関数
function sendConceptCandidatesIfPresent(
  output: { conceptCandidates?: ConceptCandidate[] },
  ctx: ChunkContext
): void {
  if (output?.conceptCandidates && output.conceptCandidates.length > 0) {
    ctx.sendData({ event: 'concept_candidates', candidates: output.conceptCandidates });
  }
}
```

**削減量:** 約8行 + console.log 8本除去

---

### Item 5: `yaml.ts` の `safeYamlStringify` 抽出 (DRY)

**対象の重複:**
`lib/utils/yaml.ts` の以下3つの build関数で同じ末尾パターンが繰り返される:
- `buildYamlKeySourceList` L142-146
- `buildYamlProcessSteps` L166-171
- `buildYamlIdList` L200-204

共通部分:
```typescript
if (prepared.length === 0) return "";
try { return stringify(prepared, YAML_PARSE_OPTIONS).trim(); }
catch (_e) { return JSON.stringify(prepared, null, 2); }
```

**変更ファイル:**
- `lib/utils/yaml.ts` — 共通関数 `safeYamlStringify` を抽出し、3箇所で利用

```typescript
function safeYamlStringify(items: unknown[]): string {
  if (items.length === 0) return "";
  try { return stringify(items, YAML_PARSE_OPTIONS).trim(); }
  catch { return JSON.stringify(items, null, 2); }
}
```

**削減量:** 約12行

---

## 合計削減量

| Item | 削減行数 |
|------|---------|
| 1: useSettingsManager | ~80行 |
| 2: useSetSelection | ~25行 |
| 3: resource-lists セルレンダラー | ~40行 |
| 4: chunk-handlers conceptCandidates | ~8行 + 8本console.log |
| 5: yaml safeYamlStringify | ~12行 |
| **合計** | **~165行 + 8本console.log** |

---

## 実行順の根拠

1→2→3→4→5 の順で実行。各Itemは相互に独立しているため、順序は柔軟だが、
Item 1が最も削減量が大きく確認も簡単なため最初にやる。

---

## 検証方法

1. 各Item実施後に `bun run dev` で起動確認（コンパイルエラーがないか）
2. 設定画面（Item 1: `/settings` ページ）で読み込み・保存・リセットが動く確認
3. チェック・リンク画面（Item 2: チケット関連ページ）で選択・全選択が動く確認
4. リスト画面（Item 3: 業務一覧・システム領域一覧等）でセル表示が崩れていないか確認
5. AIチャット（Item 4）で要件ドラフト生成が正常に動く確認
6. TypeScript型チェック: `bunx tsc --noEmit`

---

## 適用原則

- **DRY**: 同じコードの繰り返しを共通化
- **YAGNI**: Fetch hooks の共通化は今回行わない（各hookの分岐が異なる）
- **KISS**: 抽象化は「呼び出し元がシンプルになる」範囲に限定
