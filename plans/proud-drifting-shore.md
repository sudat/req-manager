# DD（Design Document）CollapsibleTrigger のレイアウト変更

## Context

システム機能詳細ページ (`/system/[id]/[srfId]`) において、システム要件（SR）とDD（Design Document）の表示形式が異なっている。

- **SRの表示**: `[IDバッジ] [種別バッジ] [タイトル]`
- **DDの表示**: `[タイトル] [種別バッジ] ... [ID]`

DDをSRと同じ「ID | 種別 | 名前」のレイアウトに統一する。

## 変更内容

### ファイル
- `components/system-domains/design-document-section.tsx`

### 変更箇所
`DesignDocumentItem` コンポーネントの `CollapsibleTrigger` 部分

**変更前:**
```tsx
<CollapsibleTrigger ...>
    <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-[15px] font-semibold text-slate-900">
            {item.name || "名称未設定"}
        </h3>
        <Badge variant="outline" className={`${typeColor} text-[12px] font-medium px-2.5 py-1`}>
            {typeLabel}
        </Badge>
    </div>
    <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
        <ChevronDown ... />
    </div>
</CollapsibleTrigger>
```

**変更後:**
```tsx
<CollapsibleTrigger ...>
    <div className="flex items-center gap-2 flex-wrap">
        {/* IDバッジ - SRと同じスタイル */}
        <Badge className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2.5 py-1 font-mono">
            {item.id}
        </Badge>
        {/* 種別バッジ */}
        <Badge variant="outline" className={`${typeColor} text-[12px] font-medium px-2.5 py-1`}>
            {typeLabel}
        </Badge>
        {/* DD名 */}
        <span className="text-[14px] font-semibold text-slate-900">
            {item.name || "名称未設定"}
        </span>
    </div>
    <div className="flex items-center gap-2">
        <ChevronDown ... />
    </div>
</CollapsibleTrigger>
```

### スタイリング詳細

| 要素 | スタイル | 備考 |
|------|---------|------|
| IDバッジ | `border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2.5 py-1 font-mono` | SRのIDバッジと統一 |
| 種別バッジ | `DD_TYPE_COLORS` + `text-[12px] font-medium px-2.5 py-1` | 既存の色定義を使用 |
| DD名 | `text-[14px] font-semibold text-slate-900` | SRのタイトルと統一 |

## 実装手順

1. `components/system-domains/design-document-section.tsx` を開く
2. `DesignDocumentItem` 関数の `CollapsibleTrigger` 内部を変更
   - IDを右端から左端のバッジに移動
   - 順序を「ID → 種別 → DD名」に並べ替え
   - IDに `font-mono` クラスを追加
3. 動作確認

## 検証方法

1. システム機能詳細ページにアクセス: `http://localhost:3000/system/AR/SF-AR-0001`
2. DDセクションの閉じた状態の見た目を確認
3. 展開・折りたたみ動作が正常か確認

## 影響範囲

- **変更ファイル**: 1ファイル
- **変更行数**: 約10行
- **リスク**: 低（表示のみの変更、ロジック変更なし）
