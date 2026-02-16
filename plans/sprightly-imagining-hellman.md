# update-docs 実行計画

## Context

ユーザーから「update-docsをしてほしい」という依頼がありました。DeepExplore調査の結果、Phase 4.5（構造化スキーマ）とPhase 5（変更管理と連携）の実装が進んでいることが判明しましたが、PRD.mdのチェックリストと実装状態に不一致があります。

### 主な課題

1. **参照先ファイル不存在**: PRD.md 3334行で参照している `docs/checklists/active/2026-02-05-structured-io-schema.md` が存在しない
2. **チェックリスト未更新**: Phase 4.5の4.5-8〜4.5-10が未完了([ ])になっているが、実装は完了している
3. **Phase 5未実装項目の明確化**: 5-8/5-9/5-10（MCP Server、改修パッケージ、設計ログ）の扱いを明確にする必要

---

## 更新対象ドキュメント一覧

| ドキュメント | アクション | 優先度 |
|-------------|-----------|--------|
| `docs/checklists/active/2026-02-05-structured-io-schema.md` | **新規作成** | 高 |
| `docs/PRD.md` | チェックリスト更新、参照修正 | 高 |
| `docs/checklists/active/2026-01-28-phase4-ai-features.md` | 完了条件更新 | 中 |
| `docs/design/database-schema-design.md` | 変更履歴更新 | 中 |

---

## 詳細更新内容

### 1. 新規作成: `docs/checklists/active/2026-02-05-structured-io-schema.md`

**目的**: Phase 4.5（構造化スキーマ）の完了記録を作成し、PRD.mdからの参照を有効にする

**内容**:
```markdown
# Phase 4.5: 構造化スキーマ導入チェックリスト

## 概要
DD（Design Document）の入出力定義をテキスト自由記述から構造化Zodスキーマに移行する。

## 完了日
2026-02-11

## チェックリスト

### スキーマ定義
- [x] 4.5-1. フィールド定義スキーマ（`lib/domain/schemas/fields.ts`）
- [x] 4.5-2. タイプ別I/Oスキーマ（`lib/domain/schemas/io-schemas.ts`）
- [x] 4.5-3. 副作用スキーマ（`lib/domain/schemas/side-effects.ts`）
- [x] 4.5-4. 例外スキーマ（`lib/domain/schemas/exceptions.ts`）
- [x] 4.5-5. 非機能要件スキーマ（`lib/domain/schemas/non-functional.ts`）
- [x] 4.5-6. DD統合スキーマ（`lib/domain/schemas/design-document-structured.ts`）

### UI/フォーム
- [x] 4.5-8. UI/フォーム更新
  - FieldEditor.tsx - 汎用フィールドエディター
  - StructuredSpecEditor.tsx - 統合エディター
  - InputSchemaEditor.tsx / OutputSchemaEditor.tsx
  - SideEffectsEditor.tsx
  - CoreLogicEditor.tsx
  - ExceptionsEditor.tsx
  - NonFunctionalEditor.tsx
  - ModelEntityEditor.tsx

### ビューアー
- [x] StructuredSpecViewer.tsx 及び各セクションビューアー（13ファイル）

### データ連携
- [x] 4.5-9. データ移行・互換性レイヤー
  - `lib/utils/design-documents/structured-compat.ts`
  - parseStructuredDetails() / composeStructuredDetails()
  - migrateLegacyFields()

### テスト
- [x] 4.5-7. スキーマ単体テスト（7ファイル）

### DB
- [x] 4.5-10. DBスキーマ変更
  - `20260205153000_structured_io_schema.sql`（COMMENT追加）

## 実装ファイル一覧
- スキーマ: `lib/domain/schemas/*.ts` (8ファイル)
- エディター: `components/forms/design-document/editors/*.tsx` (9ファイル)
- ビューアー: `components/system-domains/structured-spec-viewer/*.tsx` (13ファイル)
- 互換性: `lib/utils/design-documents/structured-compat.ts`
- テスト: `tests/unit/schemas/*.test.ts` (7ファイル)
```

### 2. 更新: `docs/PRD.md`

**Phase 4.5 チェックリスト更新（3324-3345行付近）**:

```diff
- [ ] 4.5-8. UI/フォーム更新（FieldEditor、タイプ別フォーム、統合セクション）
- [ ] 4.5-9. データ移行・互換性レイヤー
- [ ] 4.5-10. DBスキーマ変更（structured_input/output JSONBカラム）
+ [x] 4.5-8. UI/フォーム更新（FieldEditor、タイプ別フォーム、統合セクション）
+ [x] 4.5-9. データ移行・互換性レイヤー
+ [x] 4.5-10. DBスキーマ変更（structured_input/output JSONBカラム）
```

**Phase 5 チェックリスト更新（3347-3360行付近）**:

```diff
- [ ] 5-6. CR詳細画面（影響調査結果表示、疑義リンク一覧）— 部分実装済み
+ [x] 5-6. CR詳細画面（影響調査結果表示、疑義リンク一覧）

  未実装項目（将来実装予定）:
- [ ] 5-8. MCP Server 実装
- [ ] 5-9. 改修指示パッケージ生成機能
- [ ] 5-10. 設計決定ログ記録機能
+ <!-- 5-8. MCP Server 実装 - Phase 6以降で検討 -->
+ <!-- 5-9. 改修指示パッケージ生成機能 - Phase 6以降で検討 -->
+ <!-- 5-10. 設計決定ログ記録機能 - Phase 6以降で検討 -->
```

### 3. 更新: `docs/checklists/active/2026-01-28-phase4-ai-features.md`

**M4完了条件更新**:

```diff
- [ ] M4完了時の確認項目
+ [x] M4完了時の確認項目（2026-02-02確認済み）
```

### 4. 更新: `docs/design/database-schema-design.md`

**変更履歴追加**:

```diff
| 日付 | 変更内容 |
|------|----------|
+ 2026-02-11 | Phase 4.5完了。構造化スキーマ定義、UIエディター/ビューアー、互換性レイヤー実装 |
```

---

## 既存ファイル・パターンの再利用

### チェックリストフォーマット
- 参照: `docs/checklists/archive/2026-02-06-phase5-change-management.md`
- 同じフォーマットで構成する（概要、完了日、チェックリスト、実装ファイル一覧）

### スキーマ定義確認
- `lib/domain/schemas/` ディレクトリ内の8ファイルを確認
- 各ファイルのエクスポートされているスキーマ名を確認

---

## 検証手順

1. **新規作成ファイルの確認**
   ```bash
   ls -la docs/checklists/active/2026-02-05-structured-io-schema.md
   cat docs/checklists/active/2026-02-05-structured-io-schema.md
   ```

2. **PRD.mdの更新確認**
   ```bash
   # Phase 4.5チェックリストが全て[x]になっているか
   grep -A 10 "4.5-8" docs/PRD.md
   grep -A 10 "4.5-9" docs/PRD.md
   grep -A 10 "4.5-10" docs/PRD.md
   ```

3. **Phase 5チェックリスト確認**
   ```bash
   # 5-6が[x]、5-8〜5-10がコメントアウトされているか
   grep -A 10 "5-6" docs/PRD.md
   ```

4. **リンク切れ確認**
   ```bash
   # PRD.mdから参照されているチェックリストが存在するか
   grep "2026-02-05-structured-io-schema" docs/PRD.md
   ```

---

## 実行順序

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
```

---

## 参考ファイルパス

- PRD: `docs/PRD.md`
- DB設計: `docs/design/database-schema-design.md`
- チェックリストディレクトリ: `docs/checklists/active/`
- アーカイブ済みチェックリスト: `docs/checklists/archive/2026-02-06-phase5-change-management.md`
- スキーマ定義: `lib/domain/schemas/`
- UIエディター: `components/forms/design-document/editors/`
