# update-docs 実行計画

## 概要

Phase 4.5（構造化スキーマ）および Phase 5（変更管理と連携）の実装完了状態をPRD.mdおよび関連ドキュメントに反映する。

**作成日**: 2026-02-11
**依頼**: 「現在の仕様的にupdateすべき箇所があればupdateして」

---

## 1. 更新対象ドキュメント一覧

| ドキュメント | 更新内容 | 優先度 |
|-------------|---------|--------|
| `docs/PRD.md` | Phase 4.5 / Phase 5 のチェックリスト更新、参照修正 | 高 |
| `docs/checklists/active/2026-02-05-structured-io-schema.md` | **新規作成**（Phase 4.5 完了記録） | 高 |
| `docs/checklists/active/2026-01-28-phase4-ai-features.md` | Phase 4完了状態更新 | 中 |
| `docs/design/database-schema-design.md` | Phase 4.5関連の更新 | 中 |
| `docs/control_plane.md` | 実装完了状態の追記 | 低 |

---

## 2. 各ドキュメントの更新内容詳細

### 2.1 `docs/PRD.md`

#### 更新箇所1: Phase 4.5 チェックリスト（行3330-3345）

**現状:**
```markdown
- [ ] 4.5-8. UI/フォーム更新（FieldEditor、タイプ別フォーム、統合セクション）
- [ ] 4.5-9. データ移行・互換性レイヤー
- [ ] 4.5-10. DBスキーマ変更（structured_input/output JSONBカラム）
```

**更新後:**
```markdown
- [x] 4.5-8. UI/フォーム更新（FieldEditor、タイプ別フォーム、統合セクション）
- [x] 4.5-9. データ移行・互換性レイヤー
- [x] 4.5-10. DBスキーマ変更（structured_input/output JSONBカラム）
```

**根拠:**
- UIエディター実装完了: `components/forms/design-document/editors/` 以下12ファイル
- ビューアー実装完了: `components/system-domains/structured-spec-viewer/` 以下13ファイル
- 互換性レイヤー実装完了: `lib/utils/design-documents/structured-compat.ts`
- DBスキーマ変更完了: `supabase/migrations/20260205153000_structured_io_schema.sql`

#### 更新箇所2: Phase 5 チェックリスト（行3351-3360）

**現状:**
```markdown
- [ ] 5-6. CR詳細画面（影響調査結果表示、疑義リンク一覧）— 部分実装済み
- [ ] 5-8. MCP Server 実装（get_product_requirement, search_requirements等）
- [ ] 5-9. 改修指示パッケージ生成機能
- [ ] 5-10. 設計決定ログ記録機能
```

**更新後:**
```markdown
- [x] 5-6. CR詳細画面（影響調査結果表示、疑義リンク一覧）
- [ ] 5-8. MCP Server 実装（get_product_requirement, search_requirements等）— 将来実装
- [ ] 5-9. 改修指示パッケージ生成機能 — 将来実装
- [ ] 5-10. 設計決定ログ記録機能 — 将来実装
```

**根拠:**
- CR詳細画面実装完了: `app/(with-sidebar)/tickets/[id]/page.tsx` に統合完了
- 5-8/5-9/5-10 は将来実装として明示

#### 更新箇所3: 参照ファイルの修正（行3334）

**現状:**
```markdown
詳細なチェックリストは `docs/checklists/active/2026-02-05-structured-io-schema.md` を正本とする。
```

**問題:**
- 参照先のファイルが存在しない

**解決策:**
- `docs/checklists/active/2026-02-05-structured-io-schema.md` を新規作成
- ファイル作成後に参照が有効になる

---

### 2.2 `docs/checklists/active/2026-02-05-structured-io-schema.md`（新規作成）

#### ファイル構成

```markdown
# Phase 4.5: 構造化スキーマ - 完了記録

> 開始日: 2026-02-05
> 完了日: 2026-02-11
> スコープ: DDの入出力定義をテキスト自由記述から構造化Zodスキーマに移行

---

## 実装完了項目

### 1. スキーマ定義（4.5-1 〜 4.5-6）

- [x] フィールド定義スキーマ（lib/domain/schemas/fields.ts）
- [x] タイプ別I/Oスキーマ（lib/domain/schemas/io-schemas.ts）
- [x] 副作用スキーマ（lib/domain/schemas/side-effects.ts）
- [x] 例外スキーマ（lib/domain/schemas/exceptions.ts）
- [x] 非機能要件スキーマ（lib/domain/schemas/non-functional.ts）
- [x] DD統合スキーマ（lib/domain/schemas/design-document-structured.ts）

### 2. テスト（4.5-7）

- [x] io-schemas.test.ts
- [x] core-logic.test.ts
- [x] design-document-structured.test.ts
- [x] side-effects.test.ts
- [x] exceptions.test.ts
- [x] non-functional.test.ts
- [x] model-detail.test.ts

### 3. UIエディター（4.5-8）

- [x] StructuredSpecEditor（統合エディター）
- [x] SideEffectsEditor
- [x] CoreLogicEditor
- [x] ExceptionsEditor
- [x] NonFunctionalEditor
- [x] InputSchemaEditor（api/screen/batch/job別）
- [x] OutputSchemaEditor（api/screen/batch/job別）
- [x] ModelEntityEditor
- [x] FieldEditor

### 4. ビューアー（4.5-8 一部）

- [x] SideEffectsViewer
- [x] CoreLogicViewer
- [x] ExceptionsViewer
- [x] NonFunctionalViewer
- [x] InputSchemaViewer
- [x] OutputSchemaViewer
- [x] ModelDetailViewer
- [x] FieldsViewer

### 5. 画面統合（4.5-8 一部）

- [x] /system/[id]/[srfId]/edit/design-documents/page.tsx
- [x] DesignDocumentSection（表示側）
- [x] DesignDocumentCard（一覧カード）

### 6. 互換性レイヤー（4.5-9）

- [x] structured-compat.ts（旧形式→新形式の変換）
- [x] Zodバリデーションとパース

### 7. DBスキーマ（4.5-10）

- [x] 20260205153000_structured_io_schema.sql
- [x] design_documents.details カラムのJSONB構造

---

## 検証項目

- [x] TSC (--noEmit) → エラーなし
- [x] テスト全件パス
- [x] 画面からの入力・表示が正常に動作
```

---

### 2.3 `docs/checklists/active/2026-01-28-phase4-ai-features.md`

#### 更新内容

**完了条件（M4相当）の更新（行336-345）:**

**現状:**
```markdown
- [ ] AIチャットUIで自然文を入力し、BT草案が生成される
- [ ] 草案をプレビューし、確定すると正本に登録される
- [ ] SF/SR/ACの一括生成が動作する
- [ ] 概念候補が提案され、承認/却下/保留ができる
- [ ] critic_checkで品質チェック結果が表示される
```

**更新後:**
```markdown
- [x] AIチャットUIで自然文を入力し、BT草案が生成される（2026-02-02確認済み）
- [x] 草案をプレビューし、確定すると正本に登録される（2026-02-02確認済み）
- [x] SF/SR/ACの一括生成が動作する（2026-02-02確認済み）
- [x] 概念候補が提案され、承認/却下/保留ができる（2026-02-02確認済み）
- [x] critic_checkで品質チェック結果が表示される（2026-02-02確認済み）
```

---

### 2.4 `docs/design/database-schema-design.md`

#### 更新内容

**変更履歴の追加（既存のテーブル末尾）:**

```markdown
| 日付 | 変更内容 |
|------|----------|
| 2026-02-05 | design_documents.details をStructuredDesignDocumentSpec構造化 |
| 2026-02-05 | Phase 4.5: 構造化I/Oスキーマ導入（fields, io-schemas, side-effects, exceptions, non-functional, core-logic, model-detail, design-document-structured） |
```

---

### 2.5 `docs/control_plane.md`

#### 更新内容（オプション）

実装完了状態を追記するセクションを追加：

```markdown
## 実装完了状態

- [x] 2026-02-11: Phase 4.5 完了
  - スキーマ定義: lib/domain/schemas/ 以下7ファイル
  - UIエディター: components/forms/design-document/editors/ 以下12ファイル
  - ビューアー: components/system-domains/structured-spec-viewer/ 以下13ファイル
  - 互換性レイヤー: lib/utils/design-documents/structured-compat.ts
```

---

## 3. 検証手順

### 3.1 更新前の確認

1. 現在のチェックリスト状態をキャプチャ
2. Git diff で変更内容を確認

### 3.2 更新後の検証

1. **リンク切れチェック**
   ```bash
   grep -r "2026-02-05-structured-io-schema.md" docs/
   ```
   → 参照元が新規作成ファイルを正しく指していることを確認

2. **チェックリスト整合性チェック**
   - PRD.md の Phase 4.5 チェックリストが全て [x] になっている
   - 新規作成ファイルの内容とPRD.mdが一致している

3. **Markdownリンクチェック**
   - PRD.md 内の参照が全て有効であることを確認

---

## 4. 将来実装として明示する項目

### Phase 5 未実装項目

以下の項目は「将来実装」として明示し、チェックリストから除外する理由:

| 項目 | 理由 |
|------|------|
| 5-8. MCP Server | SDK型基盤の選定と設計が必要。別途プロジェクト |
| 5-9. 改修指示パッケージ | コーディングエージェント連携設計完了後 |
| 5-10. 設計決定ログ | アクティビティログ設計完了後 |

### ドキュメント上の扱い

PRD.md では以下の形式で記載:
```markdown
- [ ] 5-8. MCP Server 実装（将来実装）
- [ ] 5-9. 改修指示パッケージ生成機能（将来実装）
- [ ] 5-10. 設計決定ログ記録機能（将来実装）
```

---

## 5. 実行順序

```
1. docs/checklists/active/2026-02-05-structured-io-schema.md を新規作成
   ↓
2. docs/PRD.md の Phase 4.5 チェックリストを更新（全て[x]）
   ↓
3. docs/PRD.md の Phase 5 チェックリストを更新（5-6を[x]、他は「将来実装」注釈）
   ↓
4. docs/checklists/active/2026-01-28-phase4-ai-features.md の完了条件を更新
   ↓
5. docs/design/database-schema-design.md の変更履歴を更新
   ↓
6. （オプション）docs/control_plane.md に実装完了状態を追記
```

---

## 6. まとめ

### 主な変更点

1. **Phase 4.5 完了記録**: 新規チェックリストファイル作成
2. **PRD.md 参照修正**: 存在しないファイル参照を解消
3. **Phase 4.5 チェックリスト完了**: 全項目を [x] に更新
4. **Phase 5 部分完了**: 5-6を完了、他は将来実装として明示
5. **Phase 4 完了条件更新**: M4完了を明記

### 更新後の状態

- PRD.md のチェックリストが実装状態と一致
- 参照ファイルが全て実在する
- 将来実装項目が明確に区別されている
