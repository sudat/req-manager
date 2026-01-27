# 受入条件（AC）一括登録実装計画

## 概要
全システム要件（51件）のうち、ACが未登録の45件に対して、カテゴリ別のGWT形式受入条件を正本テーブル（`acceptance_criteria`）へ一括登録する。

## ユーザー確認事項
- ✅ AC生成件数: 1要件につき**1件**（既存テンプレート通り）
- ✅ 既存ACの扱い: **スキップして対象外**（既にACがある6件は処理しない）

## 対象範囲

### AC未登録のシステム要件（45件）
| ID | タイトル | カテゴリ |
|----|----------|----------|
| SR-GL-001 | ランダムなテスト伝票作成 | function |
| SR-TASK-001-002 | 与信枠変更承認プロセス | non_functional |
| SR-TASK-002-001 | 売掛金自動計上バッチ処理 | function |
| SR-TASK-003-002 | 電子請求書送信 | function |
| SR-TASK-003-003 | 税率別内訳集計 | function |
| ...（他35件） | | |

### スキップ対象（既にACがある6件）
SR-TASK-001-001, SR-TASK-003-001, SR-TASK-004-002, SR-TASK-005-001,
SR-TASK-009-001, SR-TASK-010-001, SR-TASK-011-001, SR-TASK-014-001,
SR-TASK-015-001, SR-TASK-017-001, SR-TASK-018-001, SR-TASK-019-001

## 実装方針

### アーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│ scripts/db/populate-acceptance-criteria.ts (新規)            │
├─────────────────────────────────────────────────────────────┤
│ 1. 全システム要件取得（listSystemRequirements）              │
│ 2. 既存AC確認（listAcceptanceCriteriaBySystemRequirementIds）│
│ 3. AC未登録の要件を抽出                                      │
│ 4. カテゴリ別GWT生成（generateAcceptanceCriteriaForRequirement）│
│ 5. acceptance_criteriaテーブルへ一括INSERT                   │
│    （createAcceptanceCriteria → 正本テーブル登録）           │
└─────────────────────────────────────────────────────────────┘
```

### 既存関数の活用
| 関数 | 場所 | 用途 |
|------|------|------|
| `listSystemRequirements` | `lib/data/system-requirements.ts` | システム要件一覧取得 |
| `listAcceptanceCriteriaBySystemRequirementIds` | `lib/data/acceptance-criteria.ts` | 既存AC確認 |
| `generateAcceptanceCriteriaForRequirement` | `lib/utils/system-functions/generate-acceptance-criteria.ts` | GWT形式AC生成 |
| `createAcceptanceCriteria` | `lib/data/acceptance-criteria.ts` | 正本テーブルへ一括INSERT |

### GWTテンプレート（カテゴリ別）
| カテゴリ | Given | When | Then |
|----------|-------|------|------|
| function | 処理対象データが存在し、システムが利用可能な状態である | 処理を実行する | 正常に完了し、期待される結果が得られる |
| data | 入力データが整合性を持ち、処理可能な形式である | データ処理・変換を実行する | 出力データが正しく生成され、整合性が保たれている |
| non_functional | 想定される負荷・環境条件が整っている | 性能測定を実行する | 指定された性能指標を満たしている |
| exception | 異常な状態・エラー条件が発生している | 通常の処理を実行する | エラーが適切に検出され、エラーメッセージが表示される |

## 実装手順

### Phase 1: スクリプト作成
**ファイル**: `scripts/db/populate-acceptance-criteria.ts`（新規）

**関数構造**:
```typescript
// CLI引数パース
function parseArgs(): { mode, category, targetTask, limit }

// 対象要件を収集
async function collectTargetRequirements(): Promise<SystemRequirement[]>

// 既存ACがある要件を除外
async function filterWithoutAC(requirements): Promise<SystemRequirement[]>

// AC生成（カテゴリ別GWT）
function generateAC(requirement): AcceptanceCriterionCreateInput

// 一括INSERT
async function insertAllAC(inputs): Promise<{ success, error }>

// 結果表示
function displayResults(summary, mode): void

// エントリーポイント
async function main()
```

### Phase 2: projectIdの解決
```typescript
// system_requirementsテーブルからproject_idを取得
const { data: rows } = await supabase
  .from("system_requirements")
  .select("id, project_id");

const projectIdMap = new Map(rows.map(r => [r.id, r.project_id]));
```

### Phase 3: 安全対策
1. **Dry-runモード**: デフォルト動作
2. **重複チェック**: 既存ACがある要件はスキップ
3. **確認プロンプト**: `--execute` 時に `y/N` 確認
4. **エラーハンドリング**: 1件ずつ処理してエラーを記録

## 使用方法

```bash
# Dry-run（デフォルト）- 全45件をプレビュー
bun scripts/db/populate-acceptance-criteria.ts --dry-run

# 特定カテゴリのみ
bun scripts/db/populate-acceptance-criteria.ts --category=function --dry-run

# テスト用（5件に制限）
bun scripts/db/populate-acceptance-criteria.ts --limit=5 --execute

# 本番実行（45件一括登録）
bun scripts/db/populate-acceptance-criteria.ts --execute
```

## 生成されるACの例
```
ID: AC-SR-TASK-003-002-001
Description: 電子請求書送信が正常に完了すること
Given: 処理対象データが存在し、システムが利用可能な状態である
When: 処理を実行する
Then: 正常に完了し、期待される結果が得られる
Verification Method: 手動テスト
```

## Critical Files

| ファイル | 操作 | 内容 |
|---------|------|------|
| `scripts/db/populate-acceptance-criteria.ts` | 新規作成 | メインスクリプト |
| `lib/data/acceptance-criteria.ts` | 利用 | `createAcceptanceCriteria`, `listAcceptanceCriteriaBySystemRequirementIds` |
| `lib/utils/system-functions/generate-acceptance-criteria.ts` | 利用 | `generateAcceptanceCriteriaForRequirement` |
| `lib/data/system-requirements.ts` | 利用 | `listSystemRequirements` |

## 検証方法

### 1. Dry-runでプレビュー
```bash
bun scripts/db/populate-acceptance-criteria.ts --dry-run
```
→ 45件の生成されるAC内容を確認

### 2. テスト実行（5件）
```bash
bun scripts/db/populate-acceptance-criteria.ts --limit=5 --execute
```

### 3. DB確認（Supabase MCP）
```sql
SELECT COUNT(*) FROM acceptance_criteria;
-- → 6件 → 11件に増えていることを確認

SELECT sr.id, sr.title, COUNT(ac.id)
FROM system_requirements sr
LEFT JOIN acceptance_criteria ac ON sr.id = ac.system_requirement_id
GROUP BY sr.id, sr.title
ORDER BY sr.id
LIMIT 15;
```

### 4. フロントエンドで表示確認
```
http://localhost:3002/system-domains/AR/SRF-001
```
→ システム要件カードにACが表示されていることを確認

## 成功基準
- [ ] 45件のシステム要件にACが登録される
- [ ] 各要件のカテゴリに応じたGWT形式で生成されている
- [ ] 既存の6件は変更されていない
- [ ] フロントエンドで正しく表示される
