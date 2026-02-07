# DD（Design Document）details フィールド UI改善計画

## Context（背景と目的）

現在、システム機能のDD（Design Document）の `details` フィールドは、YAML文字列として `<pre>` タグで表示されており、以下の課題があります：

- **可読性が低い**: プレーンテキストのため、ネストの深い構造が把握しづらい
- **編集しづらい**: YAML文法を知らないと編集が困難。インデントミスでエラーが発生しやすい
- **UI一貫性の欠如**: 他の画面（技術スタック・規約タブ）では階層型UIを使用しているが、DD画面のみYAML表示

この問題を解決するため、`/product-requirement` の「技術スタック・規約」タブと同じ階層型UI（`HierarchicalEditor` / `HierarchicalViewer`）を導入します。

**期待される効果**:
- ✅ ネスト構造の視覚的な把握が容易になる
- ✅ YAML知識不要で直感的に編集可能
- ✅ UI/UXの一貫性向上
- ✅ 既存データは自動変換されるため、データ移行不要

---

## 難易度

**★☆☆** （低難易度）

- **修正ファイル数**: 2 files
- **変更行数概算**: 約80 lines
- **影響コンポーネント数**: 2 components
- **リスク**: 既存コンポーネントの再利用のため、互換性問題なし。成功率95%

---

## 実装内容

### 1. 表示画面の改善（優先度: 高）

**対象ファイル**: `components/system-domains/design-document-section.tsx`

#### 変更点

**A. import文の変更**

```typescript
// 削除
import { toYamlText } from "@/lib/utils/yaml";

// 追加
import { HierarchicalViewer } from "@/components/forms/hierarchical-editor/viewer";
import { jsonToHierarchical } from "@/lib/utils/hierarchical-editor";
```

**B. `DesignDocumentItem` コンポーネントの変更**

**変更箇所1: 71行目**

```typescript
// 変更前
const detailsText = toYamlText(item.details ?? {}).trim();

// 変更後
const hierarchicalValue = item.details
  ? jsonToHierarchical(item.details)
  : null;
```

**変更箇所2: 152-161行目**

```typescript
// 変更前
{detailsText ? (
  <div className="space-y-2">
    <SectionLabel>details</SectionLabel>
    <pre className="text-[11px] text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-md p-3 border border-slate-200">
      {detailsText}
    </pre>
  </div>
) : (
  <div className="text-[12px] text-slate-400">details 未設定</div>
)}

// 変更後
<div className="space-y-2">
  <SectionLabel>details</SectionLabel>
  {hierarchicalValue ? (
    <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
      <HierarchicalViewer value={hierarchicalValue} />
    </div>
  ) : (
    <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
      <span className="text-slate-400 italic text-[13px]">未設定</span>
    </div>
  )}
</div>
```

**ポイント**:
- 技術スタック画面の `HierarchicalFieldView` と同じパターンを適用
- 空データも統一感のあるUIで表示（グレー背景 + イタリック体）

---

### 2. 編集画面の改善（優先度: 高）

**対象ファイル**: `components/forms/design-document/DesignDocumentCard.tsx`

#### 変更点

**A. import文の変更**

```typescript
// 削除
import { YamlTextareaField } from "@/components/forms/yaml-textarea-field";
import { useYamlValidation } from "@/hooks/use-yaml-validation";

// 追加
import { HierarchicalEditor } from "@/components/forms/hierarchical-editor";
```

**B. `DesignDocumentCard` コンポーネントの変更**

**変更箇所1: 45行目**

```typescript
// 削除
const yamlDiag = useYamlValidation(item.detailsYaml);
```

**変更箇所2: 130-137行目**

```typescript
// 変更前
<YamlTextareaField
  label="details（YAML）"
  value={item.detailsYaml}
  onChange={(value) => onUpdate({ detailsYaml: value })}
  diag={yamlDiag}
  minHeight="min-h-[140px]"
  placeholder="api_definition:, data_model: などをYAMLで記述"
/>

// 変更後
<HierarchicalEditor
  label="details"
  value={item.detailsYaml}
  onChange={(value) => onUpdate({ detailsYaml: value })}
  placeholder={"例: api_definition:\n  method: POST\n  endpoint: /api/v1/users"}
  helperText="DDの詳細情報を階層的に入力できます。既存のデータは自動的に変換されます。"
/>
```

**ポイント**:
- `YamlTextareaField` → `HierarchicalEditor` に置き換え
- `useYamlValidation` フックは不要（`HierarchicalEditor` が内部処理）
- プレースホルダーとヘルプテキストで、YAML → 階層型UI移行を説明

---

## データ変換の扱い

### 既存データの互換性

`HierarchicalEditor` は `jsonStringToHierarchical()` を使用しており、この関数は以下の後方互換性機能を持っています：

```typescript
// lib/utils/hierarchical-editor.ts:59-72
export function jsonStringToHierarchical(jsonString: string): HierarchicalValue {
  // まずJSONパースを試みる
  try {
    const jsonValue = JSON.parse(jsonString);
    return jsonToHierarchical(jsonValue);
  } catch {
    // JSONパース失敗ならYAMLパースを試みる（後方互換性）
    return yamlToHierarchical(jsonString);
  }
}
```

**つまり**:
1. 既存の `detailsYaml` がJSON文字列の場合 → そのまま変換される
2. 既存の `detailsYaml` がYAML文字列の場合 → 自動的にJSONに変換される
3. 空の場合 → `null` として扱われる

**→ データ移行は不要です。**

### 保存時のデータ形式

- `HierarchicalEditor` の `onChange` は、JSON文字列を返す
- フォーム側では `detailsYaml` に保存し、バックエンドに送信
- バックエンドで `details: Record<string, unknown>` として保存される

---

## UI/UX上の考慮事項

### 折りたたみ状態

- **表示画面**: `HierarchicalViewer` のデフォルトは展開状態（`isOpen: true`）
- **編集画面**: `HierarchicalEditor` のデフォルトは展開状態（`isExpanded: true`）
- ユーザーが手動で折りたたみ可能

### 空データの扱い

**表示画面**:
```tsx
{hierarchicalValue ? (
  <HierarchicalViewer value={hierarchicalValue} />
) : (
  <span className="text-slate-400 italic text-[13px]">未設定</span>
)}
```

**編集画面**:
- `HierarchicalEditor` が内部的にプレースホルダーを表示

### 自動表示される統計情報

`HierarchicalEditor` は以下を自動表示します：
- **項目数とネストの深さ**: `{stats.totalKeys} 項目 • 深さ {stats.maxDepth}`
- **JSONコピーボタン**: クリップボードにコピー機能

---

## 検証方法

### 1. 表示画面の確認

#### 既存DDがある場合

```bash
# ブラウザで以下にアクセス
http://localhost:3000/system/GL/SF-GL-0009
```

**確認事項**:
- [ ] DDセクションの `details` が階層型UIで表示される
- [ ] 折りたたみ/展開が正しく動作する
- [ ] ネスト構造が視覚的に把握しやすい

#### DDが空の場合

**確認事項**:
- [ ] 「未設定」のプレースホルダーが表示される
- [ ] グレー背景 + イタリック体で統一感がある

### 2. 編集→保存→再表示のフロー確認

#### 編集画面

```bash
# ブラウザで以下にアクセス
http://localhost:3000/system/GL/SF-GL-0009/edit
```

**確認事項**:
- [ ] DDの `details` を `HierarchicalEditor` で編集できる
- [ ] 階層的にデータを追加/削除できる
- [ ] 統計情報（項目数・深さ）が表示される
- [ ] JSONコピーボタンが動作する

#### 保存

**確認事項**:
- [ ] 編集内容が保存される
- [ ] ブラウザの開発者ツールで送信データがJSON形式であることを確認

#### 再表示

**確認事項**:
- [ ] 詳細ページに戻る
- [ ] 編集した内容が階層型UIで正しく表示される

### 3. エッジケースの確認

#### ネストの深いデータ

```yaml
api_definition:
  request:
    headers:
      authorization: Bearer token
    body:
      user:
        name: string
        email: string
```

**確認事項**:
- [ ] 深いネストも正しく表示・編集できる

#### 配列データ

```yaml
validations:
  - field: email
    rule: required
  - field: email
    rule: email_format
```

**確認事項**:
- [ ] 配列も正しく表示・編集できる

#### プリミティブ型の混在

```yaml
config:
  enabled: true
  max_retries: 3
  timeout: 30.5
  message: "エラーメッセージ"
```

**確認事項**:
- [ ] 文字列、数値、真偽値が正しく表示される

---

## Critical Files

実装に必要なファイルの優先度順リスト：

1. **`components/system-domains/design-document-section.tsx`** ⭐️⭐️⭐️
   - DD表示画面のメインロジック
   - `details` の表示ロジックを変更する箇所

2. **`components/forms/design-document/DesignDocumentCard.tsx`** ⭐️⭐️⭐️
   - DD編集フォーム
   - `details` の編集UIを階層型エディタに置き換える箇所

3. **`components/product-requirement/tech-stack-view.tsx`** ⭐️⭐️
   - 階層型UI表示のパターン参照用
   - `HierarchicalViewer` の使い方の模範例

4. **`lib/utils/hierarchical-editor.ts`** ⭐️
   - 変換ロジックの実装
   - YAML/JSON変換の仕組みを理解する際に参照

---

## リスクと対策

### 既存データの破損リスク

**リスク**: YAML → JSON変換で既存データが意図せず変更される可能性

**対策**:
- `jsonStringToHierarchical()` は後方互換性を持つため、既存のYAMLデータも正しく変換される
- 変換失敗時は元のデータを保持する設計（`lib/utils/hierarchical-editor.ts:86-94`）

### パフォーマンスリスク

**リスク**: 大規模なデータでレンダリングが遅延する可能性

**対策**:
- `HierarchicalViewer` は Collapsible を使用しており、デフォルトで折りたたみ可能
- 初期状態は展開だが、ユーザーが手動で折りたためる
- 必要に応じて初期状態を折りたたみに変更可能

---

## 実装順序（推奨）

1. **表示画面の変更**
   - `design-document-section.tsx` を変更
   - 既存データが正しく表示されることを確認

2. **編集画面の変更**
   - `DesignDocumentCard.tsx` を変更
   - 編集→保存→再表示のフローを確認

3. **エッジケースの検証**
   - ネストの深いデータ、配列、プリミティブ型の混在をテスト

---

## まとめ

この実装では、既存の `HierarchicalEditor` / `HierarchicalViewer` を再利用し、最小限の変更でDDの `details` フィールドを階層型UIに置き換えます。

**主なポイント**:
- ✅ データ移行不要（後方互換性あり）
- ✅ 既存コンポーネントの再利用（YAGNIの原則）
- ✅ 技術スタック画面のパターン踏襲（一貫性）
- ✅ エッジケースの考慮（ネスト、配列、プリミティブ型）

実装後は、より見やすく編集しやすいUIになり、開発者の生産性が向上することが期待されます。
