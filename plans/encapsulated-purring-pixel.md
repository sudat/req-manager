# 修正計画: AC表示形式の統一

## 問題の概要

SR-TASK-003-001のAC表示は正しいが、SR-TASK-003-002/009のAC表示が間違っている。

### 根本原因

1. **データソースの違い**:
   - SR-TASK-003-001: 正本テーブル（`acceptance_criteria`）にデータがあり、シンプルなテキスト形式で表示される
   - SR-TASK-003-002/009: 正本テーブルにデータがないため、`acceptance_criteria_json` のデータが表示される

2. **表示形式の違い**:
   - 正しい例（SR-TASK-003-001）: `given_text` = "請求対象データが存在し、顧客情報が登録されている"
   - 間違った例（SR-TASK-003-002）: `givenText` = "description: \"[前提となる状態・データ]\"\npreconditions:\n  - \"...\""

3. **表示コンポーネントの動作**:
   - `AcceptanceCriteriaDisplay.tsx` は `<pre>` タグで表示するため、改行が保持される
   - YAML形式のプレースホルダーがそのまま見えてしまう

### データベースの現在の状態

**正本テーブル (`acceptance_criteria`):**
- SR-TASK-003-001: 3件登録（シンプルなテキスト形式）
- SR-TASK-003-002: 登録なし
- SR-TASK-003-009: 登録なし

**`system_requirements.acceptance_criteria_json`:**
- SR-TASK-003-001: 空配列 `[]`
- SR-TASK-003-002: YAML形式のテンプレートあり
- SR-TASK-003-009: YAML形式のテンプレートあり

---

## 修正方針

### 方針: シンプルなテキスト形式に統一

`givenText`, `whenText`, `thenText` をYAML形式からシンプルなテキスト形式に変更する。

**変更前（YAML形式のプレースホルダー）:**
```
givenText: `description: "[前提となる状態・データ]"
preconditions:
  - "[ユーザーの状態（ログイン済み等）]"
  - "[対象データの状態（存在する等）]"`
```

**変更後（シンプルなテキスト）:**
```
givenText: "請求対象データが存在し、処理可能な状態である"
whenText: "処理を実行する"
thenText: "正常に完了し、期待される結果が得られる"
```

---

## 実装ステップ

### Step 1: AC生成ロジックの修正

**ファイル**: `lib/utils/system-functions/generate-acceptance-criteria.ts`

`templateByCategory()` 関数の出力をYAML形式からシンプルなテキスト形式に変更。

**変更内容:**
```typescript
// 変更前
return {
  givenText: `description: "[前提となる状態・データ]"
preconditions:
  - "[ユーザーの状態（ログイン済み等）]"
  - "[対象データの状態（存在する等）]"`,
  // ...
};

// 変更後
return {
  givenText: "処理対象データが存在し、システムが利用可能な状態である",
  whenText: "処理を実行する",
  thenText: "正常に完了し、期待される結果が得られる",
};
```

### Step 2: データ修正スクリプトの作成

**ファイル**: `scripts/db/fix-acceptance-criteria-format.ts`

既に登録されているAC（40件）の `givenText`, `whenText`, `thenText` をYAML形式からシンプルなテキスト形式に変換するスクリプトを作成。

### Step 3: データベースの更新

スクリプトを実行して、40件のACを一括更新。

---

## カテゴリ別の新しいテンプレート

### function
```typescript
{
  givenText: "処理対象データが存在し、システムが利用可能な状態である",
  whenText: "処理を実行する",
  thenText: "正常に完了し、期待される結果が得られる",
}
```

### data
```typescript
{
  givenText: "入力データが整合性を持ち、処理可能な形式である",
  whenText: "データ処理・変換を実行する",
  thenText: "出力データが正しく生成され、整合性が保たれている",
}
```

### exception
```typescript
{
  givenText: "異常な状態・エラー条件が発生している",
  whenText: "通常の処理を実行する",
  thenText: "エラーが適切に検出され、エラーメッセージが表示される",
}
```

### non_functional
```typescript
{
  givenText: "想定される負荷・環境条件が整っている",
  whenText: "性能測定を実行する",
  thenText: "指定された性能指標を満たしている",
}
```

---

## Critical Files

### 修正するファイル
- `lib/utils/system-functions/generate-acceptance-criteria.ts` - AC生成テンプレート
- `scripts/db/fix-acceptance-criteria-format.ts` - データ修正スクリプト（新規）

### 参照するファイル
- `components/forms/AcceptanceCriteriaDisplay.tsx` - 表示コンポーネント
- `lib/data/acceptance-criteria.ts` - ACデータアクセス
- `lib/data/system-requirements.ts` - マージロジック

---

## 検証方法

1. **スクリプト実行後のデータ確認**:
   ```sql
   SELECT id, title, acceptance_criteria_json
   FROM system_requirements
   WHERE id IN ('SR-TASK-003-002', 'SR-TASK-003-009');
   ```

2. **UI表示確認**:
   - http://localhost:3002/system-domains/AR/SRF-001 にアクセス
   - SR-TASK-003-002/009のACがシンプルなテキストで表示されていることを確認

3. **一貫性確認**:
   - SR-TASK-003-001の表示形式と同じであることを確認

---

## 成功基準

- [ ] SR-TASK-003-002/009のACがYAML形式ではなくシンプルなテキストで表示される
- [ ] SR-TASK-003-001の表示形式と一貫性がある
- [ ] 既存の表示ロジック（`AcceptanceCriteriaDisplay.tsx`）を変更せずに実現できる
