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
  - design-document-structured.ts
  - fields.ts
  - io-schemas.ts
  - side-effects.ts
  - core-logic.ts
  - exceptions.ts
  - non-functional.ts
  - model-detail.ts
- エディター: `components/forms/design-document/editors/*.tsx` (9ファイル)
  - StructuredSpecEditor.tsx
  - FieldEditor.tsx
  - InputSchemaEditor.tsx
  - OutputSchemaEditor.tsx
  - SideEffectsEditor.tsx
  - CoreLogicEditor.tsx
  - ExceptionsEditor.tsx
  - NonFunctionalEditor.tsx
  - ModelEntityEditor.tsx
- ビューアー: `components/system-domains/structured-spec-viewer/*.tsx` (13ファイル)
  - index.tsx
  - FieldsViewer.tsx
  - InputSchemaViewer.tsx
  - OutputSchemaViewer.tsx
  - CoreLogicViewer.tsx
  - ExceptionsViewer.tsx
  - NonFunctionalViewer.tsx
  - SideEffectsViewer.tsx
  - ModelDetailViewer.tsx
  - field-group-helper.tsx
  - schema-type-guards.ts
  - constants.ts
- 互換性: `lib/utils/design-documents/structured-compat.ts`
- テスト: `tests/unit/schemas/*.test.ts` (7ファイル)
  - fields.test.ts
  - design-document-structured.test.ts
  - io-schemas.test.ts
  - side-effects.test.ts
  - core-logic.test.ts
  - exceptions.test.ts
  - non-functional.test.ts

## 関連ファイル
- スキーマ定義: `docs/control_plane.md`
- DB設計: `docs/design/database-schema-design.md`
- PRD: `docs/PRD.md` (Phase 4.5)
