# Design Document 入出力項目のテーブル形式表示変更

## Context

### 課題
現在、照会画面（`/system/[id]/[srfId]`）の Design Document 入力・出力項目はカード形式で縦に並んで表示されている。項目数が増えると縦長になり、一覧性が悪い。

### 目的
エンティティ定義のようなテーブル形式に変更し、スリムで見やすい表示を実現する。

---

## 実装計画

### 変更ファイル
- **`components/system-domains/structured-spec-viewer/FieldsViewer.tsx`**

### 変更内容

#### 現状（カード形式）
```
┌─────────────────────────────┐
│ ラベル (name)        [型]    │
│ 説明                        │
│ [最小:0] [最大:100]         │
└─────────────────────────────┘
┌─────────────────────────────┐
│ ...                         │
└─────────────────────────────┘
```

#### 変更後（テーブル形式）
```
┌─────────────────────────────────────────────────────────────────┐
│ 名前              │ 型    │ 必須  │ 制約           │ 説明       │
├─────────────────────────────────────────────────────────────────┤
│ ラベル (name)     │ type  │ [必須]│ [最小:0][最大:100]│ desc    │
│ ...                │       │       │               │           │
└─────────────────────────────────────────────────────────────────┘
```

### テーブル列定義
| 列名 | 幅 | 内容 |
|------|------|------|
| 名前 | w-[25%] | label (name) - 論理名と物理名を併記 |
| 型 | w-[10%] | type - codeスタイルで表示 |
| 必須 | w-[10%] | required - バッジで表示 |
| 制約 | w-[30%] | constraints - Badgeを横に並べて表示 |
| 説明 | w-[25%] | description |

### 実装パターン（ModelDetailViewer 参考実装）
```tsx
<table className="w-full text-sm">
  <thead className="bg-muted">
    <tr>
      <th className="w-[25%] px-3 py-2 text-left font-medium">名前</th>
      <th className="w-[10%] px-3 py-2 text-left font-medium">型</th>
      <th className="w-[10%] px-3 py-2 text-left font-medium">必須</th>
      <th className="w-[30%] px-3 py-2 text-left font-medium">制約</th>
      <th className="w-[25%] px-3 py-2 text-left font-medium">説明</th>
    </tr>
  </thead>
  <tbody>
    {fields.map((field, index) => (
      <tr key={index} className="border-t">
        <td className="px-3 py-2">
          <div className="font-mono text-xs">
            {field.label || field.name}
            {field.label && field.name && field.label !== field.name && (
              <span className="text-muted-foreground"> ( {field.name} )</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2">
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
            {field.type || "any"}
          </code>
        </td>
        <td className="px-3 py-2">
          {field.required && (
            <Badge variant="secondary" className="text-xs">必須</Badge>
          )}
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1 flex-wrap">
            {/* min, max, pattern, format, enum, default をバッジで表示 */}
          </div>
        </td>
        <td className="px-3 py-2 text-muted-foreground text-xs">
          {field.description}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 制約表示の詳細
各constraintsプロパティを以下のようにBadgeで表示：

| プロパティ | Badgeラベル | スタイル |
|-----------|------------|----------|
| min | `最小: {min}` | secondary/outline |
| max | `最大: {max}` | secondary/outline |
| pattern | `パターン: {pattern}` | secondary/outline + font-mono |
| format | `{format}` | outline |
| enum | `{enum.join(", ")}` | outline |
| default | `デフォルト: {default}` | outline |

---

## 検証方法

### E2Eテスト（agent-browser）
1. `http://localhost:3000/system/AR/SF-AR-0001` にアクセス
2. Design Document セクションを展開
3. 「入力項目（データ）」「出力項目（データ）」がテーブル形式で表示されていることを確認

### 確認ポイント
- [ ] テーブルヘッダーが表示されている
- [ ] 各列が正しく表示されている
- [ ] 制約がバッジで横に並んで表示されている
- [ ] 必須項目に「必須」バッジが表示されている
- [ ] 空データ時は「未設定」と表示される
- [ ] レスポンシブ対応（必要に応じて）

---

## 参考ファイル
- `components/system-domains/structured-spec-viewer/ModelDetailViewer.tsx` - テーブル実装の参考
- `components/ui/table.tsx` - 基本テーブルコンポーネント
- `lib/domain/schemas/fields.ts` - Field型定義
