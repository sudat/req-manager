# Design Documents 編集ページのUIリデザイン計画

## Context

現在の Design Documents 編集ページ (`/system/[id]/[srfId]/edit/design-documents`) は、**2層のCard構造**になっており、以下の問題がある:

1. **多層Card構造**: DesignDocumentList (外層Card) → DesignDocumentCard (個別Card) の2層構造で視覚的に重い
2. **DD間の区切りが不明瞭**: Card間の余白のみで、項目の境界が分かりにくい
3. **ページ幅が狭い**: `max-w-4xl` で、Requirements ページ (`max-w-[1400px]`) と比べて大幅に狭い

既に実装済みの Requirements 編集ページのUIリデザインパターンを適用し、一貫性のあるデザインに統一する。

## 現状の構造（2層）

```
DesignDocumentList (外層Card)
  └─ CardHeader (タイトル + 追加ボタン)
  └─ CardContent (space-y-4)
      └─ DesignDocumentCard (個別Card) × N
          └─ CardContent
              ├─ ID + 削除ボタン
              ├─ DD名 + 種別
              ├─ 概要
              ├─ EntryPointsInlineEditor
              ├─ 設計方針
              └─ 構造化設計セクション
```

**問題点:**
- DD間の区切りがない（単なる余白）
- 削除ボタンが常時表示で誤操作リスク
- ページ幅が狭い

## 改善後の構造（1層 + div強調）

```
DesignDocumentList (単一Card)
  └─ CardContent
      ├─ ヘッダー（タイトル + 件数Badge + 追加ボタン）
      └─ space-y-0
          └─ DD項目 (Collapsible + div) × N
              ├─ border-t-2 my-8 (区切り)
              ├─ div.pl-4.border-l-4.border-indigo-500.bg-slate-50/50
              ├─ CollapsibleTrigger（見出しエリア）
              │   ├─ ChevronDown
              │   ├─ ID + DD名 + 種別Badge
              ├─ 削除ボタン（展開時のみ）
              └─ CollapsibleContent（フィールド群）
```

## デザイン原則

### 視覚的ヒエラルキー

1. **全体カード** (1枚のみ): 既存の DesignDocumentList のカードを維持
2. **DD項目**: Card を削除し、以下で強調
   - 左ボーダー (`border-l-4 border-indigo-500`) でアクセント
   - 背景色 (`bg-slate-50/50`) で領域を明示
   - 折り畳み機能で初期表示をコンパクトに
3. **DD間の区切り**: 太いボーダー (`border-t-2 border-slate-300`) + マージン (`my-8`)
4. **削除ボタン**: 展開時のみ表示で誤操作防止

### スタイリング詳細

**ヘッダーエリア (Requirements ページと同様):**
```tsx
<div className="flex items-center justify-between pb-2 border-b border-slate-100">
  <div className="flex items-center gap-2">
    <h3 className="text-[14px] font-semibold text-slate-900">
      DD（Design Document）
    </h3>
    <Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
      {items.length}
    </Badge>
  </div>
  <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]">
    <Plus className="h-4 w-4" />
    追加
  </Button>
</div>
```

**DD間の区切り:**
```tsx
{index > 0 && (
  <div className="border-t-2 border-slate-300 my-8" />
)}
```

**DD項目本体:**
```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <div className="pl-4 border-l-4 border-indigo-500 bg-slate-50/50 rounded-md p-4">
    <CollapsibleTrigger className="w-full cursor-pointer">
      <div className="flex items-center gap-3 text-left">
        <ChevronDown className={cn("h-5 w-5 text-slate-500 transition-transform shrink-0", isOpen && "rotate-180")} />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono text-sm text-slate-500 shrink-0">{item.id}</span>
          <span className="text-base font-medium text-slate-900 truncate">{item.name || "（未設定）"}</span>
        </div>
        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium">
          {DD_TYPE_LABELS[item.type]}
        </Badge>
      </div>
    </CollapsibleTrigger>

    {isOpen && (
      <div className="flex justify-end mt-2">
        <Button variant="outline" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )}

    <CollapsibleContent className="mt-4 space-y-4">
      {/* 既存のフィールド群 */}
    </CollapsibleContent>
  </div>
</Collapsible>
```

## 変更対象ファイル

### 1. `app/(with-sidebar)/system/[id]/[srfId]/edit/design-documents/page.tsx`
- **変更内容**: ページ幅を拡大
- **変更箇所**: 64行目 `max-w-4xl` → `max-w-[1400px]`

### 2. `components/forms/design-document-list.tsx`
- **変更内容**: 単一Card構造に変更、DD間の区切りを追加
- **主な変更**:
  - `CardHeader` を削除し、`CardContent` 内にヘッダーを統合
  - ヘッダーを `pb-2 border-b border-slate-100` で区切り
  - タイトルを `h3` + `Badge` で表現
  - `space-y-4` → `space-y-0` に変更
  - DD間に `border-t-2 border-slate-300 my-8` の区切りを追加

### 3. `components/forms/design-document/DesignDocumentCard.tsx`
- **変更内容**: Card → Collapsible + div 構造に変更、折り畳み機能追加
- **主な変更**:
  - 必要なimportを追加: `useState`, `ChevronDown`, `Collapsible` 系, `cn`
  - `useState(false)` で折り畳み状態を管理（初期状態は閉じる）
  - `Card` → `Collapsible` + `div.pl-4.border-l-4.border-indigo-500.bg-slate-50/50` に変更
  - 見出しエリアを `CollapsibleTrigger` で実装（行全体クリック可能）
  - 削除ボタンを `{isOpen && ...}` で展開時のみ表示
  - 既存のフィールド群を `CollapsibleContent` 内に配置

**追加import:**
```tsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
```

## 実装順序

### Phase 1: ページ幅の変更
`page.tsx` の 64行目: `max-w-4xl` → `max-w-[1400px]`

### Phase 2: DesignDocumentList の構造変更
1. `CardHeader` を削除
2. `CardContent` 内にヘッダーとコンテンツを統合
3. `space-y-4` → `space-y-0` に変更
4. DD間の区切りを追加 (`{index > 0 && <div className="border-t-2 border-slate-300 my-8" />}`)

### Phase 3: DesignDocumentCard の構造変更
1. 必要なimportを追加
2. `useState(false)` で折り畳み状態を管理
3. `Card` → `Collapsible` + `div` 構造に変更
4. 見出しエリアを実装（`CollapsibleTrigger`）
5. 削除ボタンを展開時のみ表示に変更
6. 既存のフィールド群を `CollapsibleContent` 内に配置

### Phase 4: 動作確認
1. ページの表示確認
2. 追加・編集・削除の動作確認
3. 折り畳み・展開の動作確認
4. 構造化設計セクションの動作確認

## 参照用ファイル（Requirements ページのパターン）

実装時に参考にするファイル:
- `components/forms/requirement-list-section.tsx` - 外層Card構造のパターン
- `components/forms/requirement-card.tsx` - Collapsible + div構造、折り畳み機能、見出しエリアのパターン

## 検証方法

### 手動確認
1. 開発サーバーを起動: `bun run dev`
2. ブラウザで `/system/AR/SF-AR-0001/edit/design-documents` にアクセス
3. 以下を確認:
   - [ ] ページ幅が広くなっている (`max-w-[1400px]`)
   - [ ] 全体が1枚のカードで囲まれている
   - [ ] DD間の境界が明確（太いボーダー）
   - [ ] 各DD項目が左ボーダー + 背景色で強調されている
   - [ ] 折り畳み機能が動作する（初期状態は閉じている）
   - [ ] 見出しエリア全体がクリック可能
   - [ ] ChevronDown アイコンが回転する
   - [ ] 削除ボタンが展開時のみ表示される
   - [ ] 既存の機能（追加・編集・削除）が正常に動作する
   - [ ] Requirements ページとの視覚的一貫性がある

## リスク

### 低リスク
- CSSのみの変更が中心で、ロジックの変更は最小限
- Requirements ページで既に実証済みのパターンを適用
- 既存のフィールド、バリデーション、状態管理はそのまま維持

### 注意事項
- DD項目は Requirements に比べて遥かに多くのフィールドを持つが、折り畳み機能により初期表示はコンパクトになる
- `StructuredSpecEditor`, `EntryPointsInlineEditor` などの既存コンポーネントはそのまま利用
- DD名が未設定の場合は `"（未設定）"` をプレースホルダーとして表示

## 期待される効果

1. **視覚的改善**: ページ幅の拡大により、横に広いフィールドが見やすくなる
2. **操作性の向上**: 折り畳み機能により、初期表示がコンパクトになり一覧性が向上
3. **一貫性の向上**: Requirements ページと同じパターンのため、学習コストが低い
4. **誤操作防止**: 削除ボタンが展開時のみ表示されるため、誤削除のリスクが減る
