# 受入基準セクションのクリック展開機能

## 概要
受入基準（Acceptance Criteria）のCollapse/Expand機能を改善し、右端の展開ボタンだけでなく、ヘッダーエリア全体（AC ID + Description）をクリックしても展開されるようにする。

## 難易度評価
```
難易度: ★☆☆
根拠: 1 file, ~10 lines, 1 component
リスク: ホバー効果の誤適用、既存スタイルへの影響（軽微）
```

## 変更ファイル
- **`components/forms/AcceptanceCriteriaDisplay.tsx`** (67-108行目)

## 実装内容

### 現状の問題点
- 右端の「展開/折りたたむ」ボタンしかクリックできない
- AC IDやDescriptionエリアをクリックしても何も起こらない

### 変更方針
1. ヘッダー全体を `CollapsibleTrigger` で囲む
2. ホバー効果を追加してクリック可能であることを示す
3. `hasContent` がない場合は通常表示（クリック不可）のまま維持

### Before/After

#### Before（現在）
```tsx
<div className="flex items-start gap-2">
    <span className="text-[11px] font-mono text-slate-400 shrink-0 mt-0.5">
        {item.id}
    </span>
    <div className="flex-1 min-w-0">
        <div className="text-[13px] text-slate-700">
            {item.description}
        </div>
        {isTemplate && (...)}
    </div>
    {hasContent && (
        <CollapsibleTrigger asChild>
            <button type="button" className="...">
                <ChevronDown ... />
                <span>{isOpen ? "折りたたむ" : "展開"}</span>
            </button>
        </CollapsibleTrigger>
    )}
</div>
```

#### After（変更後）
```tsx
{hasContent ? (
    <CollapsibleTrigger asChild>
        <div className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 rounded -m-3 p-3 transition-colors">
            <span className="text-[11px] font-mono text-slate-400 shrink-0 mt-0.5">
                {item.id}
            </span>
            <div className="flex-1 min-w-0">
                <div className="text-[13px] text-slate-700">
                    {item.description}
                </div>
                {isTemplate && (...)}
            </div>
            <ChevronDown className="shrink-0 h-4 w-4 transition-transform duration-200 text-slate-500" />
        </div>
    </CollapsibleTrigger>
) : (
    <div className="flex items-start gap-2">
        {/* hasContentがない場合の通常表示 */}
    </div>
)}
```

### 主な変更点
| 項目 | 内容 |
|------|------|
| CollapsibleTrigger | ボタンのみ → ヘッダー全体（hasContent時） |
| ホバー効果 | `hover:bg-slate-50` + `cursor-pointer` |
| レイアウト調整 | `-m-3 p-3` でホバー領域を拡張 |
| ChevronDown | ボタンから独立した配置に変更 |
| テキストラベル | 「展開/折りたたむ」を削除（クリック領域拡大で不要） |

## 検証手順

### 手動確認
1. http://localhost:3001/system-domains/AR/SRF-006 にアクセス
2. 受入基準セクションが Collapse 状態であることを確認
3. AC ID/Description 部分をクリック
4. セクションが展開されることを確認
5. もう一度クリックして折りたたまることを確認

### 確認項目
- [ ] ヘッダー全体をクリックすると展開/折りたたみが切り替わる
- [ ] ホバー時に背景色が変わる
- [ ] カーソルが pointer になる
- [ ] `hasContent=false` の項目はクリック不可
- [ ] 既存のスタイリング（text size、spacing）が維持されている

### Playwright MCP による動作確認
e2e-testing スキルを使用して以下を検証：
1. ページ読み込み時の初期状態（Collapse）
2. ヘッダークリックでの展開
3. 展開状態でのクリックでの折りたたみ
4. スクリーンショット取得

## リスクと軽減策
| リスク | 軽減策 |
|--------|--------|
| ホバー領域が隣接項目と重複 | ネガティブマージン `-m-3` で適切に調整 |
| 既存のクリックイベントとの競合 | CollapsibleTrigger のみを使用（競合なし） |
