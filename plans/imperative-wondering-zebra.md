# AR領域 サンプルデータ追加計画

## Context

### 課題
ユーザーがAR領域詳細ページ（`/business/AR`）にアクセスしたところ、業務タスク（BT）と業務要件（BR）のデータが表示されていない。

### 確認された事実
1. Supabaseダッシュボードで確認したところ、`business_tasks`テーブルにAR領域のデータが存在しない
2. 探索エージェントの報告した「6つのBT」は別ソースの情報か誤認
3. `business_domains`テーブルにはAR領域は登録済み

### 目的
AR領域（売掛金管理）のサンプル業務タスクと業務要件データを追加し、画面に表示されるようにする。

---

## 推奨アプローチ

### 既存seedスクリプトの活用
プロジェクトには既にDD用のseedスクリプトがある：
- `scripts/db/seed-dd-sf-ar-0001-003-caller.ts`
- `scripts/db/seed-dd-caller-link.ts`
- `scripts/db/seed-dd-update.ts`

これらのパターンを参考に、BT/BR用のseedスクリプトを作成する。

### 安全な実行フロー
既存スクリプトと同様のフローを採用：
1. `--dry-run` フラグで追加予定データを表示
2. `--execute` フラグで実際にデータ登録
3. 登録後の確認（`RETURNING`句または別途確認）

---

## 実装計画

### ファイル構成

**新規作成ファイル:**
```
scripts/db/
├── seed-bt-ar-tasks.ts        # メインスクリプト（実行ロジック）
└── seed-bt-ar-data.ts         # サンプルデータ定義
```

### 1. サンプルデータ定義 (`seed-bt-ar-data.ts`)

AR領域（売掛金管理）の業務タスクと業務要件を定義：

```typescript
// BT-AR-0001: 売上計上
{
  taskId: "BT-AR-0001",
  name: "売上計上",
  summary: "確定した売上を計上し、売掛金として計上する",
  businessContext: "経理担当が月次で実施",
  processSteps: [
    { when: "締め日翌営業日", who: "経理担当", action: "計上対象の売上を抽出する" },
    { when: "抽出後", who: "経理担当", action: "売上の妥当性を確認し、例外を差し戻す" },
    { when: "確認後", who: "システム", action: "売掛金元帳に計上データを登録する" }
  ],
  input: [
    { name: "確定済み売上データ", source: "受注管理システム", condition: "ステータスが「確定」" }
  ],
  output: [
    { name: "売掛金元帳", destination: "会計システム" }
  ],
  concepts: ["REVENUE_RECOGNITION", "ACCOUNTS_RECEIVABLE"],
  requirements: [
    {
      requirementId: "BR-AR-0001-0001",
      requirement: "売上を自動的に計上できる",
      rationale: "手入力のミスを削減し、処理効率を向上させるため、確定した売上から売掛金を自動的に計上する"
    }
  ]
}

// BT-AR-0002: 請求書発行
{
  taskId: "BT-AR-0002",
  name: "請求書発行",
  summary: "売掛金データに基づき請求書を発行する",
  // ...（同様の構造）
}

// 追加するタスク（5件程度）
// - BT-AR-0003: 入金消込
// - BT-AR-0004: 売掛金元帳照会
// - BT-AR-0005: 未収金管理
// - BT-AR-0006: 売掛金年齢調査
```

### 2. 実行スクリプト (`seed-bt-ar-tasks.ts`)

#### 機能要件
1. **CLI引数処理**: `--dry-run`, `--execute`, `--replace` フラグ対応
2. **Supabase接続**: 環境変数から接続情報を取得
3. **データ登録**:
   - `business_tasks` テーブルへのINSERT
   - `business_requirements` テーブルへのINSERT
4. **エラーハンドリング**: 重複エラー、制約違反への対処
5. **結果確認**: 登録されたデータを表示

#### 主要な処理フロー

```typescript
// 1. 環境設定
const PROJECT_ID = process.env.PROJECT_ID;
const supabase = createClient(/* ... */);

// 2. 既存データ確認（replaceモード時）
if (replace) {
  // 既存BT/BRを削除して再作成
}

// 3. データ登録
for (const task of sampleData) {
  // BT登録
  const { error: btError } = await supabase
    .from("business_tasks")
    .insert({
      id: task.taskId,
      project_id: PROJECT_ID,
      business_area: "AR",
      name: task.name,
      summary: task.summary,
      business_context: task.businessContext,
      process_steps: task.processSteps, // JSONB化
      input: task.input,             // JSONB化
      output: task.output,           // JSONB化
      concepts: task.concepts,
      // ...
    });

  // BR登録（各taskに複数のBRを持たせる可能性）
  for (const req of task.requirements) {
    await supabase
      .from("business_requirements")
      .insert({
        id: req.requirementId,
        project_id: PROJECT_ID,
        business_task_id: task.taskId,
        code: req.code,
        requirement: req.requirement,
        rationale: req.rationale,
        concept_ids: req.conceptIds || [],
        // ...
      });
  }
}

// 4. 結果表示
console.log("==> 登録完了:");
console.log(`  BT: ${insertedCount}件`);
console.log(`  BR: ${insertedReqs}件`);
```

### 3. ID採番の考慮

- BTのID: `BT-AR-0001`, `BT-AR-0002`, ...
- BRのID: `BT-AR-0001-0001`, `BT-AR-0001-0002`, ...
- 既存のID生成ロジック（`lib/data/id.ts`）を活用するか、または固定値を使用

---

## 修正対象ファイル

**新規作成:**
- `scripts/db/seed-bt-ar-tasks.ts`
- `scripts/db/seed-bt-ar-data.ts`

**参照ファイル:**
- `lib/data/id.ts` - ID生成ロジック（必要に応じて使用）
- `lib/domain/entities.ts` - 型定義
- `scripts/db/seed-dd-sf-ar-0001-003-caller.ts` - 参考パターン

---

## 検証方法

### 1. dry-runで確認
```bash
bun scripts/db/seed-bt-ar-tasks.ts
# 追加予定データが表示される（データベースは変更されない）
```

### 2. executeで実行
```bash
bun scripts/db/seed-bt-ar-tasks.ts --execute
# データベースにデータが登録される
```

### 3. 画面で確認
1. `http://localhost:3000/business/AR` にアクセス
2. 以下が表示されることを確認:
   - BT-AR-0001: 売上計上
   - BT-AR-0002: 請求書発行
   - （追加されたBT一覧）
3. 各BTをクリックしてBRが表示されることを確認

### 4. Supabaseダッシュボードで確認
```sql
-- business_tasks テーブル
SELECT id, name, business_area FROM business_tasks WHERE business_area = 'AR';

-- business_requirements テーブル
SELECT id, business_task_id, requirement FROM business_requirements WHERE business_task_id LIKE 'BT-AR-%';
```

---

## 追加検討事項

### 項域名の正規化
- データベースには小文字の`"ar"`で登録されている可能性
- その場合、`business_area = 'AR'`のフィルタでデータが取得できない
- 必要に応じて、大文字変換ロジックを追加

### process_stepsのJSONB化
```typescript
const processStepsJson = JSON.stringify(task.processSteps);
// またはYAML形式:
const processStepsYaml = yaml.dump(task.processSteps);
```

### 概念リンク
- 概念辞書（`concepts`テーブル）に該当する概念が存在するか確認
- 存在しない場合は、概念も同時に登録する検討

---

## 実装優先順位

1. **高**: サンプルデータ定義ファイルの作成（最小限のBT/BR）
2. **高**: 実行スクリプトの実装（基本機能：INSERTのみ）
3. **中**: エラーハンドリングと結果表示の強化
4. **低**: オプション機能（--replace, バルクインポート等）

---

## リスク評価

| リスク | 影響 | 低減策 |
|--------|------|--------|
| ID重複エラー | スクリプト実行失敗 | --replaceフラグで既存データを削除 |
| 制約違反 | データ登録失敗 | スキーマ定義を事前確認 |
| 日本語の文字化け | 表示の不具合 | 文字エンコーディングをUTF-8で統一 |

---

## 参考資料

- PRD: `docs/PRD.md` セクション3.3（業務タスク）、3.4（業務要件）
- DBスキーマ: `docs/design/database-schema-design.md` セクション2.2、2.3
- 既存seedスクリプト: `scripts/db/seed-dd-sf-ar-0001-003-caller.ts`
