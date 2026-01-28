# システム要件カード(SR)と実装単位SD(IU)の開閉機能実装プラン

## 概要
システム要件カード(SR)と実装単位SD(IU)を縦に長いため開閉可能にする。初期状態は閉じた状態とする。

## 難易度
```
難易度: ★☆☆ / ★★★
根拠: 2 files, ~60 lines, 2 components
リスク: 低 - 既存パターンに従うのみ、新規ロジックなし
```

## 変更ファイル

| ファイル | 変更内容 |
|---------|----------|
| `components/system-domains/system-requirements-section.tsx` | SRカードにCollapsible適用 |
| `components/system-domains/impl-unit-sd-section.tsx` | IUカードにCollapsible適用 |

## 実装内容

### 1. system-requirements-section.tsx (SRカード)

#### インポート追加
```typescript
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
```

#### RequirementItem コンポーネントの変更
- `const [isOpen, setIsOpen] = useState(false);` を追加
- JSX構造を Collapsible パターンに変更
- `CollapsibleTrigger` にヘッダー部分を配置
- `CollapsibleContent` に本文を配置
- `p-5` を `CollapsibleContent` に移動

### 2. impl-unit-sd-section.tsx (IUカード)

#### インポート追加
```typescript
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
```

#### ImplUnitSdItem コンポーネントの変更
- `const [isOpen, setIsOpen] = useState(false);` を追加
- JSX構造を Collapsible パターンに変更
- `CollapsibleTrigger` にヘッダー部分を配置
- `CollapsibleContent` に本文を配置
- `p-5` を `CollapsibleContent` に移動

## デザイン仕様

### CollapsibleTrigger
- ホバー時の背景色: `hover:bg-slate-50/50`
- カーソル: `cursor-pointer`
- パディング調整: `px-2 -mx-2 py-2`

### ChevronDown アイコン
- サイズ: `h-5 w-5`
- 色: `text-slate-400`
- アニメーション: `transition-transform duration-200`
- 開状態: `rotate-180`

### CollapsibleContent
- パディング: `p-5`（元カードのパディングをここに配置）

## 参考実装
- `components/business-requirement-card.tsx` - 全体開閉パターン（初期値を `false` に変更）
- `components/forms/AcceptanceCriteriaDisplay.tsx` - 複数アイテム開閉パターン

## 検証手順

### 1. Playwright MCPでの動作確認
```bash
# e2e-testing スキルを使用
# http://localhost:3002/system-domains/AR/SRF-001 にアクセス
```

### 2. 確認項目
- [ ] 初期状態で両カードが閉じている
- [ ] ヘッダークリックでカードが開く
- [ ] ChevronDown アイコンが回転する
- [ ] ホバー時に背景色が変わる
- [ ] アニメーションが滑らか
- [ ] 既存のデザインが崩れていない

### 3. スクリーンショット取得
- 初期状態（閉じた状態）
- 開いた状態
- ホバー時のスタイル
