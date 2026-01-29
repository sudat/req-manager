# 業務タスク編集画面からシステム要件セクションを削除

## 背景

`/business/[id]/[taskId]/edit` 画面に「システム要件」セクションが表示されているが、PRD（`docs/PRD.md`）によると：

- **業務要件（BR）** → 業務タスク（BT）詳細画面で管理
- **システム要件（SR）** → システム機能（SF）詳細画面で管理

業務要件画面にシステム要件を表示する仕様はPRDに存在しない。よって、PRDに沿ってシステム要件セクションを削除する。

## 難易度

```
難易度: ★★☆
根拠: 2 files修正 + 1 file削除, 約40行削除, 保存ロジック修正あり
リスク: 保存ロジック修正漏れによる既存システム要件の意図しない削除
```

## 修正対象ファイル

| ファイル | 修正内容 |
|---------|---------|
| `app/(with-sidebar)/business/[id]/[taskId]/edit/page.tsx` | システム要件関連コード削除 |
| `app/(with-sidebar)/business/[id]/[taskId]/edit/hooks/useTaskSave.ts` | システム要件同期をスキップ |
| `app/(with-sidebar)/business/[id]/[taskId]/system-requirement-card.tsx` | 未使用のため削除 |

## 実装手順

### Step 1: page.tsx からシステム要件関連コードを削除

**削除するコード:**

| 行番号 | 内容 |
|--------|------|
| 8行目 | `import { listSystemRequirementsByTaskId }` |
| 9行目 | `fromSystemRequirement` を import から除去 |
| 103行目 | `listSystemRequirementsByTaskId(taskId, currentProjectId)` を Promise.all から削除 |
| 100行目 | `systemReqResult` を分割代入から削除 |
| 115-117行目 | システム要件エラーログ削除 |
| 121-122行目 | `loadedSystemRequirements` 削除 |
| 136行目 | `systemRequirements: loadedSystemRequirements` → `systemRequirements: []` |
| 169行目 | `...knowledge.systemRequirements` を配列から削除 |
| 187-196行目 | `systemRequirementMap` の useMemo 削除 |
| 207-214行目 | `systemRequirementItems` の useMemo 削除 |
| 263-264行目 | `systemRequirementMap` props 削除 |
| 268-282行目 | システム要件 RequirementListSection 削除 |
| 294行目 | `systemRequirements={systemRequirementItems}` 削除 |
| 297-300行目 | listKey判定を `"businessRequirements"` 固定に変更 |

### Step 2: useTaskSave.ts のシステム要件同期をスキップ

**修正内容:**
- 147-163行目: `syncSystemRequirements` 呼び出しをスキップ
- 182-186行目: システム要件の疑義フラグ設定をスキップ
- 28-58行目の `syncLegacyBusinessRequirementLinks` と60-81行目の `syncSystemRequirementLinks` は削除可能

**注意:** `syncBrSrLinksToRequirementLinks`（166行目）は業務要件からシステム要件へのリンク同期なので、引数を空配列にするか、業務要件側のリンク情報のみで処理するように修正が必要。

### Step 3: 未使用ファイル削除

`app/(with-sidebar)/business/[id]/[taskId]/system-requirement-card.tsx` を削除（どこからもimportされていない）

## 動作確認

### 視覚的確認
1. `/business/BIZ-001/TASK-001/edit` にアクセス
2. 「システム要件」セクションが表示されないことを確認
3. 「業務要件」セクションは正常に表示されることを確認

### 保存動作確認
1. 編集画面で業務要件を変更して保存
2. 詳細画面（`/business/BIZ-001/TASK-001`）で確認
   - 業務要件の変更が反映されていること
   - 関連システム要件が削除されていないこと

### E2Eテスト（Playwright MCP）
- 編集画面にシステム要件セクションが表示されないこと
- 保存後に既存システム要件が保持されていること
