# DD拡張: コアロジック追加 + modelタイプ論理エンティティ対応

## Context

現在のDD（Design Document）構造化スキーマには2つの課題がある:

1. **コアロジック欠落**: 入力スキーマ（トリガー）→ 出力スキーマ（結果）の間に「何をするか」の処理ロジックを記述する構造がない。PRDでは `core_logic`（計算式、判定条件、状態遷移、締め処理等の業務ルール）として定義済みだが、構造化スキーマに未実装
2. **modelタイプの空洞化**: DD種別 `model`（データモデル）の typeDetail が事実上空（entity/tableは「entryPointsで代替」として削除済み）。論理エンティティ（属性、関連、状態遷移）を構造的に定義できない

この拡張により、DDの情報フローが完成する:
```
入力スキーマ → [コアロジック★NEW] → 出力スキーマ → 副作用 → 例外 → 非機能
```

---

## 決定事項（ユーザー合意済み）

| 項目 | 決定 |
|------|------|
| テーブル定義の粒度 | 論理エンティティ（ER図相当）。物理DDLではない |
| テーブルのSF帰属 | 1つのSFにオーナーとして所属。他SFは `sideEffects.dbOperations` で参照 |
| コアロジックの構造化 | 構造化セクションとしてスキーマに追加（フリーテキストではない） |
| 入出力スキーマ統合 | 統合しない。分離を維持し、間にコアロジックを挟む |

---

## 難易度

```
難易度: ★★☆
根拠: 5 new + 8 modified files, ~600 lines, schema/compat/viewer/editor/AI
リスク: DesignDocumentCard.tsx（1390行）の肥大化
```

---

## Phase 1: スキーマ定義

### 1-1. `lib/domain/schemas/core-logic.ts` を新規作成

PRD `core_logic` 定義（L780-790）に準拠したスキーマ:

```typescript
// businessRuleSchema
{
  name: string          // ルール識別名（例: tax_calculation）
  type: enum            // "validation" | "calculation" | "state_transition" | "decision" | "aggregation"
  description: string   // ルール説明
  formula?: string      // 計算式（例: "税額 = 税抜金額 × 税率"）
  preconditions?: string[]  // 前提条件リスト
  rounding?: string     // 端数処理（例: "切り捨て"）
  precision?: string    // 精度（例: "1円単位"）
  notes?: string        // 補足事項
}

// coreLogicSchema
{
  summary?: string              // 全体概要
  rules: businessRuleSchema[]   // default: []
}
```

- `sideEffectSchema`（`side-effects.ts`）のパターンに倣う
- 全フィールドに `.describe()` 付与

### 1-2. `lib/domain/schemas/design-document-structured.ts` を修正

**a) `coreLogic` フィールド追加** — `outputFields` の前、`inputFields` の後に配置:
```typescript
coreLogic: coreLogicSchema.default({ rules: [] }).describe("..."),
```
- `.default({ rules: [] })` で後方互換性を確保（既存データにcoreLogicがなくてもパース成功）

**b) `model` typeDetail 拡張**:
```typescript
z.object({
  ioType: z.literal("model"),
  entityName?: string,
  entityDescription?: string,
  attributes?: modelAttributeSchema[],    // name, type, primaryKey?, nullable?, description?, constraints?, enumValues?
  relationships?: modelRelationshipSchema[],  // target, type(1:1/1:N/N:1/N:M), description?
  stateTransitions?: stateTransitionSchema[],  // from, to[], condition?
})
```
- 全フィールド optional（既存の空modelデータとの互換性）
- `modelAttributeSchema` は `fieldSchema` とは別定義（PK/Nullable等のモデル固有属性があるため）

**c) `createEmptyStructuredDesignDocumentSpec` に追加**:
```typescript
spec.coreLogic = { rules: [] };
```

### 1-3. テスト追加

- `tests/unit/schemas/core-logic.test.ts` 新規: ルール定義のパース検証
- `tests/unit/schemas/design-document-structured.test.ts` 追記: coreLogic付きフルスペック、model typeDetail拡張データのパース

---

## Phase 2: 互換性レイヤー

### 2-1. `lib/utils/design-documents/structured-compat.ts` を修正

- `syncStructuredSpecToDdType`: coreLogic を DD種別切替時も**保持**する（現状 typeDetail は reset されるが coreLogic はリセット不要）
- `parseStructuredDetails`: 変更不要（zodの `.default()` が自動処理）

### 2-2. テスト追記

- `tests/unit/utils/design-document-structured-compat.test.ts`: coreLogic付きデータの parse/sync テスト

---

## Phase 3: Viewer UI

### 3-1. `components/system-domains/structured-spec-viewer/CoreLogicViewer.tsx` 新規

- ルール種別ごとのバッジ（validation=青, calculation=緑, state_transition=紫, decision=橙, aggregation=黄）
- formula/preconditions/rounding/precision の条件表示
- `SideEffectsViewer.tsx` のレイアウトパターンを踏襲

### 3-2. model typeDetail 表示強化

- `index.tsx` で model ioType 時に entityName/attributes/relationships/stateTransitions を表示
- 属性はテーブル形式（名前/型/PK/Nullable/説明）
- 状態遷移は矢印表記（from → to）

### 3-3. `components/system-domains/structured-spec-viewer/index.tsx` を修正

セクション順序を更新:
```
1. エントリポイント
2. 入力スキーマ
3. 入力項目
4. コアロジック ★NEW
5. 出力スキーマ
6. 出力項目
7. 副作用
8. 例外
9. 非機能
```

---

## Phase 4: Editor UI

### 4-1. `components/forms/design-document/DesignDocumentCard.tsx` を修正

- 入力項目セクションと出力スキーマセクションの間に `coreLogic` 編集セクションを追加
  - ルールの追加/削除/編集
  - name, type (select), description, formula, preconditions（改行区切り→配列）
- model ioType 選択時に typeDetail のエンティティ定義UI:
  - entityName, entityDescription
  - attributes の配列エディタ（既存 FieldEditor のパターン参考）
  - relationships の配列エディタ
  - stateTransitions の配列エディタ

---

## Phase 5: AI ツール連携

### 5-1. `lib/mastra/tools/dd-draft.ts` を修正

- プロンプトに coreLogic セクション生成指示を追加
- model タイプの場合に typeDetail のエンティティ定義生成を追加

### 5-2. `lib/mastra/utils/schema-to-prompt.ts`

- スキーマベース自動生成のため基本的に変更不要（スキーマ追加で自動反映）

---

## 変更ファイル一覧

### 新規 (4-5)
| ファイル | 内容 |
|----------|------|
| `lib/domain/schemas/core-logic.ts` | coreLogicスキーマ |
| `components/system-domains/structured-spec-viewer/CoreLogicViewer.tsx` | coreLogicビューア |
| `tests/unit/schemas/core-logic.test.ts` | coreLogicテスト |
| (任意) model viewer が大きければ別ファイル化 | |

### 修正 (7-8)
| ファイル | 変更内容 |
|----------|----------|
| `lib/domain/schemas/design-document-structured.ts` | coreLogic追加, model typeDetail拡張, createEmpty修正 |
| `lib/utils/design-documents/structured-compat.ts` | syncでcoreLogic保持 |
| `components/system-domains/structured-spec-viewer/index.tsx` | CoreLogicViewer追加, model表示強化 |
| `components/forms/design-document/DesignDocumentCard.tsx` | coreLogicエディタ, model typeDetailエディタ |
| `lib/mastra/tools/dd-draft.ts` | プロンプト更新 |
| `tests/unit/schemas/design-document-structured.test.ts` | テスト追加 |
| `tests/unit/utils/design-document-structured-compat.test.ts` | テスト追加 |

---

## 検証方法

1. **Unit テスト**: `bun test tests/unit/schemas/core-logic.test.ts tests/unit/schemas/design-document-structured.test.ts tests/unit/utils/design-document-structured-compat.test.ts`
2. **既存テスト回帰**: `bun test` 全テスト通過確認
3. **E2E（agent-browser）**:
   - 既存DDの表示が壊れていないこと（後方互換性）
   - model DDを作成 → typeDetailにエンティティ情報入力 → 保存 → 詳細画面で表示確認
   - api DDを作成 → coreLogicにルール追加 → 保存 → 詳細画面で表示確認
4. **AI草案生成**: DD草案生成でcoreLogicセクションが含まれることを確認
