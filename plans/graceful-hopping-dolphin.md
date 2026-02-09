# UNIQUEバッジ表示の修正

## Context
請求書テーブルのカラムにUNIQUE制約が設定されているにもかかわらず、閲覧画面（`/system/[id]/[srfId]`）でUNIQUEバッジが表示されていない問題を修正する。

- **原因**: `ModelDetailViewer.tsx` で `primaryKey` や `nullable` のバッジは表示しているが、`unique` バッジの実装が漏れていた
- **編集画面では正しく表示**: `DesignDocumentCard.tsx` では UNIQUE バッジが実装されており、編集時は確認できる
- **データ構造は問題なし**: スキーマ (`lib/domain/schemas/model-detail.ts`) に `unique: z.boolean()` が定義されている

## 実装計画

### 修正ファイル
- `/usr/local/src/dev/wsl/personal-pj/req-manager/components/system-domains/structured-spec-viewer/ModelDetailViewer.tsx`

### 変更内容
70-102行目のバッジ表示セクションに、UNIQUEバッジを追加する。

**追加位置**: `primaryKey` バッジ（72-76行目）の後、`nullable` バッジ（77-81行目）の前

**コード**:
```tsx
{attr.unique && (
  <Badge variant="outline" className="text-xs">UK</Badge>
)}
```

### バッジのスタイル一貫性
| バッジ | variant | 表示 |
|--------|---------|------|
| PK (Primary Key) | default | 青 |
| UK (UNIQUE) | outline | 枠線 |
| NOT NULL | secondary | グレー |

## 検証方法
1. `http://localhost:3000/system/AR/SF-AR-0001` にアクセス
2. 請求書テーブルのモデル詳細を確認
3. UNIQUE制約が設定されたカラムに「UK」バッジが表示されていることを確認

## 参考ファイル
- 編集画面の実装: `components/forms/design-document/DesignDocumentCard.tsx:437`
