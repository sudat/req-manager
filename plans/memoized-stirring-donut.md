# tickets/create — カスケード選択時スクロールバー延びバグ修正

> ImpactScopeSelector のカスケード（L1→L2→L3）を進めるとページ全体スクロールバーが画面の下まで延びて視覚的に不自然になるバグ

---

## 難易度
```
難易度: ★☆☆
根拠: 3 files, 5 lines, CSS クラス変更のみ
リスク: なし（レイアウトの高さ制約のみ。他ページへの影響なし）
```

適用原則: **KISS**（既存のTailwind クラスで高さ制限を追加するだけ）

---

## レイアウト階層と根本原因

```
div.flex.h-[100dvh]                              ← layout.tsx:14
└── main.flex-1.h-full.min-h-0.overflow-y-auto   ← main-content.tsx:15-16
    │  スクロールバートラック = 常に画面丈(100dvh)
    └── TicketCreatePage
        └── div.flex-1.min-h-screen              ← page.tsx:111 ← ①問題
            └── form
                ├── Textareas × 3               (~320px)
                └── ImpactScopeSelector
                    └── Tabs → CascadeSelector
                        ├── L1 grid             (~100px)
                        ├── L2 リスト（機能）    (~430px, 6件×72px) ← ②問題
                        └── L3 リスト（要件）    (~230px+, 件数次第) ← ②問題
```

### ① `min-h-screen` → 不要な100vh下限を強制
- `MainContent` が `h-full(=100dvh)` + `overflow-y-auto` で画面スクロールを管理する
- 子側の `min-h-screen` は「コンテンツが短いときも100vh埋める」用途だが、
  カスケード展開後はコンテンツが100vhを大幅に超えるため無意味になる
- 削除すると自然なコンテンツ高さに収まる

### ② L2・L3 リストに高さ上限がない
- L2（機能リスト）は 6件で ~430px → 1つのリストで画面の半分近く
- カスケード全段展開のとき、form合計高さ ~1800px+ となり、
  scrollbar thumb が非常に小さくなる（「やたら下まで延びる」の正体）
- `max-h-60`(240px) で内部スクロールに収めると、リスト面積が半減

---

## 変更対象

| ファイル | 行 | 現在 | 変更後 |
|---------|---|------|--------|
| `app/(with-sidebar)/tickets/create/page.tsx` | 111 | `flex-1 min-h-screen bg-slate-50` | `flex-1 bg-slate-50` |
| `components/tickets/business-requirement-cascade-selector.tsx` | 67 | `space-y-2 mt-2` (L2 業務タスク) | `space-y-2 mt-2 max-h-60 overflow-y-auto pr-1` |
| `components/tickets/business-requirement-cascade-selector.tsx` | 94 | `space-y-2 mt-2` (L3 業務要件) | `space-y-2 mt-2 max-h-60 overflow-y-auto pr-1` |
| `components/tickets/system-requirement-cascade-selector.tsx` | 61 | `space-y-2 mt-2` (L2 システム機能) | `space-y-2 mt-2 max-h-60 overflow-y-auto pr-1` |
| `components/tickets/system-requirement-cascade-selector.tsx` | 88 | `space-y-2 mt-2` (L3 システム要件) | `space-y-2 mt-2 max-h-60 overflow-y-auto pr-1` |

> `pr-1`(4px右パディング): スクロールバーとリスト項目の間に間隔を取り視覚的には切れ目なし

---

## 変更しない点
- `components/layout/main-content.tsx`: `overflow-y-auto` は正しい（他ページも使用中）
- `components/tickets/impact-scope-selector.tsx`: Tab構造・選択ロジックは変更不要
- `hooks/use-cascade-fetch.ts`: データフェッチは正常
- L1（領域グリッド）: 3件程度で高さ問題なし

---

## 検証
1. `http://localhost:3000/tickets/create` を開く
2. 「システム要件」タブ → 任意の領域 → 機能を選択 → **L2リストが内部スクロールで収まっている**か確認
3. 機能を選んで要件が表示 → **L3リストも内部スクロールで収まっている**か確認
4. 「業務要件」タブでも同様に確認
5. **ページ全体のスクロールバーが短縮・消えている**か確認
6. カスケード未選択状態でもレイアウトが崩れていないか確認
