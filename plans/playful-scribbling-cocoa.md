# コアロジックと保存/通知の設計指針明確化

## Context

SF-AR-0001のDDデータを確認したところ、`coreLogic.rules`の`persist`タイプと`sideEffects.dbOperations`の責務が重複しており、どちらにDB操作を書くべきか不明確だった。

議論の結果、以下の設計方針を確定：

1. **coreLogic = 純粋なインメモリ業務ロジック**（外部状態を変更しない）
2. **sideEffects = 外部状態変化の宣言**（DB操作、API呼出し、イベント、ファイル出力）
3. `persist` タイプを削除し、状態遷移の判断は `decide` で表現する
4. sideEffects の日本語ラベルを「副作用」→「保存/通知」に変更
5. sideEffectsには当該DDが直接実行する操作のみ記載（呼出し先DDの操作は含めない）

```
難易度: ★☆☆
根拠: 7 files, ~40 lines changed, 0 components新規作成
リスク: 既存DBデータにpersistルールは存在するがマイグレーション不要（Zodのparse時にエラーになるだけ→互換レイヤーで対応可能）
```

---

## 変更ファイル一覧

| # | ファイル | 変更内容 |
|---|---------|---------|
| 1 | `lib/domain/schemas/core-logic.ts` | `persist`をenumから削除、JSDoc更新 |
| 2 | `tests/unit/schemas/core-logic.test.ts` | `persist`テスト削除、拒否テスト追加、旧フィールド修正 |
| 3 | `tests/unit/schemas/design-document-structured.test.ts` | 既存バグ修正（`"calculation"` → `"derive"`） |
| 4 | `components/system-domains/structured-spec-viewer/CoreLogicViewer.tsx` | `persist`をマッピングから削除 |
| 5 | `components/forms/design-document/DesignDocumentCard.tsx` | `persist`を配列・ラベルから削除 |
| 6 | `docs/PRD.md` | 構造化スキーマセクション更新、設計指針セクション追加 |
| 7 | `CLAUDE.md` | DD構造化データスキーマセクション更新 |
| 8 | `docs/design/database-schema-design.md` | coreLogic JSONBスキーマの旧タイプ値を修正 |

---

## 詳細変更計画

### 1. `lib/domain/schemas/core-logic.ts`

**変更箇所: L3-12**

- JSDocコメントを「CRUDベース」→「純粋な業務ロジック」に更新
- `"persist"` をenumから削除
- `decide` のコメントに「状態遷移の決定を含む」を追記
- 設計意図を説明するJSDocブロックを追加

```typescript
// After:
/**
 * ビジネスルールのタイプ（純粋な業務ロジック）
 *
 * coreLogicはインメモリで完結する純粋なビジネスルールを定義する。
 * 外部状態の変更（DB操作、API呼出し等）はsideEffectsで定義する。
 */
export const businessRuleTypeEnum = z.enum([
  "validate",   // 検証・妥当性チェック
  "read",       // 抽出・参照
  "derive",     // 算出・計算・変換・集計
  "decide",     // 判定・分岐・選択（状態遷移の決定を含む）
]);
```

### 2. `tests/unit/schemas/core-logic.test.ts`

**変更箇所: L17, L35-52**

- L17: `persist` の受入テストを削除
- 新規: `persist` の拒否テストを追加
- L35-52: 旧スキーマフィールド（`formula`, `rounding`, `precision`）→ 現スキーマ（`formulas`, `notes`）に修正

```typescript
// L17: 削除
// expect(() => businessRuleTypeEnum.parse("persist")).not.toThrow();

// 追加:
it("persist は廃止済みのため拒否される", () => {
  expect(() => businessRuleTypeEnum.parse("persist")).toThrow();
});

// L35-52: テストデータを現スキーマに合わせる
const data: BusinessRule = {
  name: "tax_calculation",
  type: "derive",
  description: "消費税を計算する",
  formulas: ["税額 = 税抜金額 × 税率"],
  preconditions: ["税抜金額 > 0", "税率は0.08または0.10"],
  notes: ["軽減税率対象品目は8%を適用"],
};
// アサーションも formulas, notes に修正
```

### 3. `tests/unit/schemas/design-document-structured.test.ts`

**変更箇所: L49**

既存バグ修正。入力 `type: "derive"` に対してアサーションが `"calculation"` になっている。

```typescript
// Before: expect(parsed.coreLogic.rules[1].type).toBe("calculation");
// After:  expect(parsed.coreLogic.rules[1].type).toBe("derive");
```

### 4. `components/system-domains/structured-spec-viewer/CoreLogicViewer.tsx`

**変更箇所: L18, L26**

```typescript
// L18: 削除 → persist: "outline",
// L26: 削除 → persist: "永続化",
```

### 5. `components/forms/design-document/DesignDocumentCard.tsx`

**変更箇所: L121, L129**

```typescript
// L121: 削除 → "persist",
// L129: 削除 → persist: "永続化",
```

### 6. `docs/PRD.md`

**変更箇所: L819-833 + 新規セクション追加**

#### 6a. L819: 構造化スキーマテーブルのコアロジック行を更新

```markdown
<!-- Before -->
| コアロジック | 計算式、判定条件、状態遷移、締め処理等の業務ルール | `lib/domain/schemas/core-logic.ts` |
| 副作用（状態変化） | DB操作/外部API/イベント/ファイル/ログ | `lib/domain/schemas/side-effects.ts` |

<!-- After -->
| コアロジック | 検証・抽出・算出・判定。インメモリで完結する純粋な業務ロジック | `lib/domain/schemas/core-logic.ts` |
| 保存/通知（sideEffects） | 当該DDが直接実行するDB操作/外部API/イベント/ファイル出力 | `lib/domain/schemas/side-effects.ts` |
```

#### 6b. L829-833: 情報フロー説明を更新

```markdown
<!-- Before -->
入力スキーマ → [コアロジック] → 出力スキーマ → 副作用 → 例外 → 非機能

コアロジックは入力から出力への変換処理を記述し、副作用は出力後の状態変化を記述する。

<!-- After -->
入力スキーマ → [コアロジック] → 出力スキーマ → 保存/通知 → 例外 → 非機能

コアロジックは入力から出力への純粋なビジネスロジック（インメモリ処理）を記述する。
保存/通知（sideEffects）は当該DDが直接実行する外部状態変更を記述する。
```

#### 6c. L833の後に新規セクション追加: 「coreLogicと保存/通知(sideEffects)の設計指針」

以下の内容を追加：

- coreLogic vs sideEffects の対比表（性質・実行範囲・UIラベル）
- coreLogicのルールタイプ一覧（validate/read/derive/decide）と各タイプの例
- 設計判断の具体例（「ステータス遷移の判断 → decide」「実際のUPDATE → dbOperations」等）
- sideEffectsのスコープルール（自分が直接実行する操作のみ記載）
- 呼び出しチェーンでの記載例（画面→API→バッチ）

### 7. `CLAUDE.md`

**変更箇所: DD構造化データスキーマセクション**

- コアロジックのスキーマファイル説明に `validate/read/derive/decide` を明記
- `### coreLogic vs sideEffects の区別` サブセクションを追加
  - coreLogic = 純粋なインメモリ業務ロジック
  - sideEffects = 外部状態変更（日本語ラベル: 保存/通知）
  - persist廃止の経緯
  - スコープルール（自DDの直接操作のみ）

### 8. `docs/design/database-schema-design.md`

**変更箇所: L632付近 coreLogic JSONBスキーマ**

旧タイプ値 `validation | calculation | state_transition | decision | aggregation` を
現行値 `validate | read | derive | decide` に修正。

旧フィールド `formula`(string), `rounding`, `precision` を
現行フィールド `formulas`(string[]), `notes`(string[]) に修正。

---

## 実装順序

1. **スキーマ変更**: `core-logic.ts` — persistをenumから削除
2. **テスト更新**: `core-logic.test.ts`, `design-document-structured.test.ts` — テスト修正
3. **UI更新**: `CoreLogicViewer.tsx`, `DesignDocumentCard.tsx` — persist削除
4. **ドキュメント更新**: `PRD.md`, `CLAUDE.md`, `database-schema-design.md`

Step 1-3 はアトミックに実行。Step 4 は並行可能。

---

## 検証方法

### ユニットテスト

```bash
bun test tests/unit/schemas/core-logic.test.ts
bun test tests/unit/schemas/design-document-structured.test.ts
```

### TypeScript型チェック

```bash
bunx tsc --noEmit
```

TypeScript型チェックで `persist` を参照している箇所がないか確認。

### 既存DDデータへの影響確認

```sql
-- Supabase: persistルールを使用しているDDを検索
SELECT id, name, details->'coreLogic'->'rules' as rules
FROM design_documents
WHERE details::text LIKE '%"persist"%';
```

該当データがある場合は `structured-compat.ts` の `parseStructuredDetails` で `persist` → `decide` へのマイグレーションを追加。

### E2E確認

SF-AR-0001の詳細画面 (`/system/AR/SF-AR-0001`) を開いて：
- DDのコアロジックビューアーに「永続化」バッジが表示されないこと
- DD編集フォームのルールタイプ選択肢に「永続化」がないこと

---

## スコープ外（別タスク）

- SF-AR-0001の既存DDサンプルデータ修正（画面DDのsideEffectsからDB操作を除去等）
- `structured-compat.ts` への persist→decide マイグレーション追加（データ確認後に判断）
