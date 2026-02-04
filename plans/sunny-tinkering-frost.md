# Plan: チャット画面メインカラムスクロールバー修正（v2）

## ステータス
- Phase 1（layout.tsx / main-content.tsx / chat-container.tsx / chat/page.tsx の修正）: **実装済み・検証済み（Playwright）**
- Phase 2（サブピクセル溢れによる実ブラウザスクロールバー）: **未実装**

---

## 現在の問題（ユーザー実報告）
実ブラウザ（Windows Chrome、ブックマークバー有）で `/chat` を表示すると、**メインカラムのスクロールバーが残る**。
Playwright ヘッドレスモードでは再現しない。

### スクリーンショット（WS000047.JPG）で確認した実態
- **サイドバー右端の細いスクロールバー**: sidebar nav の `overflow-y-auto` の設計通りの動作。ビューポートが小さい分メニュー項目が収まらない。→ **許容OK**
- **画面最右端のスクロールバー**: `<main>` の `overflow-y-auto` が発火している。**← 修正対象**

---

## 根本原因（再分析）

Phase 1 で導入した変更の組み合わせが、実ブラウザで以下のサブピクセル溢れを発生させている：

```
layout.tsx       <div class="flex h-[100dvh]">          height: 100dvh（例: 756.4px）
  ↓ h-full
main-content.tsx <main class="... overflow-y-auto">    height: 100% → 756.4px
  ↓ h-full（百分率チェーン の丸め誤差）
chat-container   <div class="h-full flex ...">         height: 100% → 757px（0.6px溢れ）
```

`h-full` の百分率チェーン（dvh → % → %）がブラウザのサブピクセル丸め処理で微妙にズレ、
ChatContainer が `<main>` より数分の1ピクセル大きくなる。
`overflow-y-auto` はその微小な溢れを検知してスクロールバーを表示してしまう。

> **なぜ Playwright で見えなかった？**
> Playwright のヘッドレスモードはブックマークバーなどがなく、dvh の計算がピクセル境界に落ちやすい。
> 実ブラウザでは Chrome UI の高さによって dvh が非整数になりやすい。

---

## 追加修正: Phase 2

### 修正対象: `components/ai-chat/chat-container.tsx` — 行472
**ChatContainer の root div に `overflow-hidden` を追加する。**

```diff
- <div className="h-full flex flex-col min-h-0 bg-white">
+ <div className="h-full flex flex-col min-h-0 overflow-hidden bg-white">
```

### なぜこれで解決するか
- `overflow-hidden` は「溢れをこの要素で切り捨てる」の宣言
- ChatContainer 内部のスクロール（メッセージ領域の `overflow-y-auto`）には影響しない
- `<main>` の `overflow-y-auto` が見る「子要素の高さ」は ChatContainer の
  `h-full`（= mainと同じ）になり、サブピクセル溢れが透過しなくなる
- `h-full + min-h-0 + overflow-hidden` はflex内の高さ拘束の標準パターン

### なぜ他の修正は不要か
- サイドバーの scrollbar は `nav overflow-y-auto` の設計通りで許容OK
- 他18ページの `min-h-screen` は長いコンテンツのスクロールが期待される動作で問題なし
- `sidebar.tsx` の `h-screen` は `fixed` 要素なので layout には影響しない

---

## 変更リスト（Phase 2のみ）

| # | ファイル | 行 | 変更 |
|---|---------|---|------|
| 1 | `components/ai-chat/chat-container.tsx` | 472 | root div に `overflow-hidden` を追加 |

---

## 検証手順
1. ユーザーの実ブラウザ（Chrome on Windows、ブックマークバー有）で `/chat` を開く
2. 空状態でメインカラムのスクロールバーが消えていることを確認
3. Playwright でも再確認（回帰がないこと）
4. `/dashboard` や `/settings` のスクロール動作に影響がないこと
