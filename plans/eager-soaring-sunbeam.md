# Plan: Chat ページ - 入力エリア浮かぜる（修正）

## 背景
クイックアクション削除と入力エリア absolute 配置は既に実装済み。
ただし「浮かぶ」見た目になっていない。メッセージエリアと入力エリアが単に分けられているように見える。

## 根本原因
`chat-input.tsx` のルート要素が `<div className="px-6 py-4 bg-white">` で不透明な白バックグラウンドを持っている。
そのため `chat-container.tsx` で親ラッパーに設定した `bg-gradient-to-b from-white/0 to-white` グラデーションが ChatInput の bg-white で完全に隠れてしまっている。

```
chat-container side:
<div class="absolute bottom-0 ... pt-6 bg-gradient-to-b from-white/0 to-white">
                                       ↑ この効果が見えない
  <ChatInput />
      ↓
chat-input side:
<div class="px-6 py-4 bg-white">   ← ★ この bg-white が原因
```

## 難易度
```
難易度: ★☆☆
根拠: 1 file (chat-input.tsx), 1 line change
リスク: ChatInput は chat-container 以外にも使われていないか確認要（現時点で1箇所のみ確認済み）
```

## 変更対象ファイル
- `components/ai-chat/chat-input.tsx`（1行のみ）

## 変更内容

`chat-input.tsx` のルート要素から `bg-white` を削除する。

```
Before: <div className="px-6 py-4 bg-white">
After:  <div className="px-6 py-4">
```

これにより親ラッパーの `bg-gradient-to-b from-white/0 to-white` グラデーションが透過して見え、
メッセージが入力エリアの上で自然にフェーデイングする「浮かぶ」効果になる。

### なぜこれで十分か
- 親ラッパーの gradient は `from-white/0`（上端：完全透過）→ `to-white`（下端：不透明白）
- ChatInput 自体の位置は ラッパーの下側にある
- →  ラッパー上端（pt-6 エリア）で透過→不透明へのフェーデイングが見え、下端は白で入力欄バックグラウンドとなる
- ChatInput 内部の border/shadow 付きカード (`border border-slate-300 rounded-2xl bg-white shadow-sm`) は残るので、入力欄そのものの見た目は変わらない

## 検証方法
1. `http://localhost:3000/chat` に遷移
2. 確認項目：
   - 入力エリア上端に白グラデーション（フェーデイング）が見える
   - メッセージを多数送信してスクロールし、メッセージがグラデーション越しに裏を通るときに自然に見える
   - 入力欄カード自体（ボーダー・シャドウ・白バックグラウンド）の見た目は変わっていない
