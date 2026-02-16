# コード簡素化・共通化リファクタリング計画

## Context

コードベース調査により、以下の技術的負債が判明した：
1. **DesignDocumentCard.tsx が2,976行の God Component** — 7コンポーネントが1ファイルに同居
2. **SelectionDialog 2種が95%重複** — 汎用コンポーネントで統合可能
3. **InputSchemaViewer / OutputSchemaViewer が90%ミラー構造** — 型ガード・ヘルパーが重複

機能変更なし・既存エクスポート維持の純粋なリファクタリングとして実施する。

```
難易度: ★★☆
根拠: 18 new files, 5 modified files, 0 logic changes
リスク: ファイル分割時のimportパス漏れ（TypeScript strict modeで検出可能）
```

---

## Area 1: DesignDocumentCard.tsx 分割 (2,976行 → ~15ファイル)

### 対象ファイル
- `components/forms/design-document/DesignDocumentCard.tsx` (2,976行)

### 利用者（影響範囲）
- `components/forms/design-document-list.tsx` のみが `DesignDocumentCard` をimport

### 現在の内部構造

| 行範囲 | コンポーネント/セクション | 行数 |
|--------|--------------------------|-----:|
| 1-69 | import + 型定義 | 69 |
| 80-131 | 定数9個 (EXCEPTION_TYPES等) | 52 |
| 132-1054 | `DesignDocumentCard` 本体 | 922 |
| 1056-1102 | `ApiInputFieldsSection` | 47 |
| 1104-1197 | `ApiOutputSchemaSection` | 94 |
| 1199-1244 | `ApiOutputFieldsSection` | 46 |
| 1246-1305 | `ScreenInputSection` | 60 |
| 1307-1361 | `ScreenOutputSection` | 55 |
| 1363-2976 | `StructuredSpecEditor` | **1,613** |

`StructuredSpecEditor` 内部は `FoldableStructuredSection` で7セクションに分かれている（行1461, 1473, 2012, 2401, 2459, 2762, 2893）。

### 分割後のファイルツリー

```
components/forms/design-document/
  DesignDocumentCard.tsx          (~400行, main card + dialogs)
  StructuredSpecEditor.tsx        (~100行, セクション配置のオーケストレータ)
  FoldableStructuredSection.tsx   (既存, 変更なし)
  constants.ts                    (~55行, DD_TYPES/EXCEPTION_TYPES等の定数)
  editors/
    types.ts                      (~15行, 共通Props型)
    index.ts                      (barrel export)
    InputSchemaEditor.tsx          (~200行, api/screen/batch/job入力フォーム)
    CoreLogicEditor.tsx            (~340行, ルール一覧エディタ)
    OutputSchemaEditor.tsx         (~80行, 出力スキーマ配置)
    SideEffectsEditor.tsx          (~300行, DB/API/イベント/ファイル)
    ExceptionsEditor.tsx           (~130行, 例外リスト)
    NonFunctionalEditor.tsx        (~80行, 性能/認証)
    ModelEntityEditor.tsx          (~365行, 属性/関連/FK)
    ApiInputFieldsSection.tsx      (~50行, query/bodyフィールド分割)
    ApiOutputSchemaSection.tsx     (~100行, success/errorステータス)
    ApiOutputFieldsSection.tsx     (~50行, 出力フィールド)
    ScreenInputSection.tsx         (~65行, trigger/action/precondition)
    ScreenOutputSection.tsx        (~60行, transition/messages/behavior)
```

### 共通Props型 (`editors/types.ts`)

```typescript
export interface StructuredSpecEditorProps {
  spec: StructuredDesignDocumentSpec;
  onChange: (next: StructuredDesignDocumentSpec) => void;
  updateStructuredSpec: (
    updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec
  ) => void;
}
```

### 実装順序

1. **`constants.ts` 作成** — 定数9個を移動、DesignDocumentCard.tsxから削除してimportに変更
2. **`editors/types.ts` 作成** — 共通Props型定義
3. **IO別セクション5個を `editors/` へ移動** — ApiInputFieldsSection, ApiOutputSchemaSection, ApiOutputFieldsSection, ScreenInputSection, ScreenOutputSection（既にself-contained関数）
4. **StructuredSpecEditor内のセクションを分離**（単純な順に）:
   - `NonFunctionalEditor` (行2893-2971, 最もシンプル)
   - `ExceptionsEditor` (行2762-2889)
   - `SideEffectsEditor` (行2459-2758)
   - `CoreLogicEditor` (行2012-2397)
   - `OutputSchemaEditor` (行2401-2456)
   - `ModelEntityEditor` (行1614-1963, FK dialog連携あり)
   - `InputSchemaEditor` (行1473-2009, 型分岐ロジック最多)
5. **`StructuredSpecEditor.tsx` 作成** — 薄いオーケストレータ
6. **`DesignDocumentCard.tsx` スリム化** — StructuredSpecEditorをimportに変更
7. **`editors/index.ts` 作成** — barrel export

### 注意点
- `ModelEntityEditor` は `onOpenFkDialog: (attrIndex: number) => void` を追加propsとして受ける
- `InputSchemaEditor` も同様に `onOpenFkDialog` を受ける（model型のattributes部分）
- FK/リレーションダイアログの**状態管理は DesignDocumentCard 本体に残す**（ダイアログ表示制御のため）

---

## Area 2: SelectionDialog 統合 (2ファイル → 1汎用 + 2ラッパー)

### 対象ファイル
- `components/forms/SystemFunctionSelectionDialog.tsx` (162行)
- `components/forms/DesignDocumentSelectionDialog.tsx` (164行)

### 利用者
- `SystemFunctionSelectionDialog`: DesignDocumentCard.tsx, `/schema/sequence/page.tsx`
- `DesignDocumentSelectionDialog`: DesignDocumentCard.tsx

### 差分（5箇所のみ）

| 箇所 | SystemFunction | DesignDocument |
|------|---------------|----------------|
| アイテム型 | `{id, title, domainName?}` | `{id, name, type, summary}` |
| 検索対象 | `sf.title` | `dd.name` |
| グループキー | `sf.domainName \|\| "その他"` | `DD_TYPE_LABELS[dd.type] \|\| "その他"` |
| 表示ラベル | `sf.title` | `dd.name \|\| "(名称未設定)"` |
| 空メッセージ | `"システム機能がありません。"` | `"設計書がありません。"` |

### 新規ファイル

**`components/forms/GroupedSelectionDialog.tsx`** (~140行)

```typescript
export interface GroupedSelectionDialogProps<T extends { id: string }> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  getSearchableText: (item: T) => string;
  getGroupKey: (item: T) => string;
  getDisplayLabel: (item: T) => string;
}
```

### 既存ファイル書き換え

両ファイルとも **~25行のthin wrapper** に縮小。既存の型export (`SystemFunctionItem`, `DesignDocumentItem`) とProps interfaceは維持。

### 実装順序

1. `GroupedSelectionDialog.tsx` を新規作成（既存コードをベースにジェネリック化）
2. `SystemFunctionSelectionDialog.tsx` をwrapperに書き換え
3. `DesignDocumentSelectionDialog.tsx` をwrapperに書き換え

---

## Area 3: InputSchemaViewer / OutputSchemaViewer 共通化

### 対象ファイル
- `components/system-domains/structured-spec-viewer/InputSchemaViewer.tsx` (154行)
- `components/system-domains/structured-spec-viewer/OutputSchemaViewer.tsx` (202行)

### 重複箇所
1. **型ガード関数** — Input側4個 (行25-39) + Output側4個 (行24-38)
2. **フィールド描画ヘルパー** — `renderFieldGroup` (行41-55) ≈ `renderFields` (行40-50)

### 新規ファイル

**`components/system-domains/structured-spec-viewer/schema-type-guards.ts`** (~45行)
- Input型ガード4個 + Output型ガード4個
- 純粋TypeScript関数（React依存なし、テスト容易）

**`components/system-domains/structured-spec-viewer/field-group-helper.tsx`** (~25行)
- `renderFieldGroup(label, fields, variant)` を共通化
- OutputSchemaViewerの `renderFields` は `variant="default"` で呼ぶだけ

### 既存ファイル変更

- `InputSchemaViewer.tsx`: 154行 → ~100行（型ガード+ヘルパー削除、importに置換）
- `OutputSchemaViewer.tsx`: 202行 → ~145行（同上）
- **switch/case内のJSXは変更なし**（per-typeの表示は genuinely different なため統合しない）

### 過度な抽象化を避ける判断

単一 `IoSchemaViewer<"input" | "output">` への統合は**不採用**:
- per-type JSXが入出力で大きく異なる（API出力はsuccess/error Badge、画面出力はtransition/messages等）
- Props型が異なるunion（`ApiInputV2 | ...` vs `ApiOutputV2 | ...`）
- 統合すると direction分岐が各case内に増え、可読性が悪化

### 実装順序

1. `schema-type-guards.ts` 作成
2. `field-group-helper.tsx` 作成
3. `InputSchemaViewer.tsx` を更新（import置換のみ）
4. `OutputSchemaViewer.tsx` を更新（import置換のみ）

---

## 全体の実装順序

| Step | Area | 作業内容 | リスク |
|:----:|:----:|---------|--------|
| 1 | 2 | SelectionDialog統合 (Quick Win) | 低 |
| 2 | 3 | Viewer共通化 (Quick Win) | 低 |
| 3 | 1 | DesignDocumentCard分割 | 中（ファイル数多い） |

Quick Winの2つを先にやることで、Area 1作業時にはSelectionDialogが既に整理済みになる。

## 検証方法

1. **TypeScriptコンパイル**: `bunx tsc --noEmit` で型エラーがないことを確認
2. **既存テスト実行**: `bun test` で既存テスト全パス
3. **E2E動作確認**: agent-browserでシステム機能編集画面を開き、DD編集が正常動作することを確認
   - DDカードの展開/折りたたみ
   - 構造化スペックの各セクション編集
   - SF選択ダイアログ / DD選択ダイアログの動作
   - 入出力スキーマのViewer表示
