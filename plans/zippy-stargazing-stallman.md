# チャット機能改修計画

## 難易度

```
難易度: ★★☆
根拠: 4 files, 約150行, 4 components（独立した改修）
リスク: 各要件が独立しているため低リスク
```

## 要件サマリ

| # | 要件 | 対象ファイル | 変更規模 |
|---|------|--------------|----------|
| ① | 自動スクロール無効化 | chat-messages.tsx | ~20行追加 |
| ② | 途中経過の折り畳み表示 | chat-messages.tsx | ~30行変更 |
| ③ | テーブル表示対応 | markdown-renderer.tsx | ~35行追加 |
| ④ | maxSteps拡張（5→10） | route.ts | 1行変更 |

---

## ①自動スクロール無効化

**現状**: `messages`変更のたびに`scrollIntoView`が発火し、ストリーミング中に過去メッセージが読めない

**対応**: 条件付き自動スクロール（ユーザーが下部にいる場合のみ追従）

```
変更ファイル: components/ai-chat/chat-messages.tsx

- containerRefを追加してスクロール位置を監視
- 下部100px以内の場合のみ自動スクロール
- onScrollハンドラで位置を追跡
```

---

## ②途中経過の折り畳み表示

**現状**: ストリーミング中に自動で展開される

**対応**: ChatGPTライクなUI
- 初期状態は常に折り畳み（closed）
- ストリーミング中はSpinner + 「処理中... (1/3)」表示
- 完了後はChevronアイコン + 「途中経過 (3件)」表示

```
変更ファイル: components/ai-chat/chat-messages.tsx

- ProgressStepsコンポーネントの初期状態をfalse固定
- 自動展開のuseEffectを削除
- Loader2アイコンを追加（ストリーミング中）
- ボタンテキストを動的に変更
```

---

## ③マークダウンテーブル対応

**現状**: `remark-gfm`はあるがtableコンポーネント未定義

**対応**: table/thead/tbody/tr/th/tdコンポーネントを追加

```
変更ファイル: components/markdown/markdown-renderer.tsx

- tableを横スクロール可能なコンテナで囲む
- 背景をbg-whiteでチャットバブル内で視認性確保
- セル間に境界線とホバー効果
```

---

## ④maxSteps拡張

**現状**: `const maxSteps = 5;` でハードコード → 5Step超で最終回答が返らない

**対応**: 環境変数化 + デフォルト10

```
変更ファイル: app/api/chat/route.ts

const maxSteps = Number(process.env.CHAT_MAX_STEPS) || 10;
```

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `components/ai-chat/chat-messages.tsx` | 要件①②（自動スクロール、折り畳み） |
| `components/markdown/markdown-renderer.tsx` | 要件③（テーブル対応） |
| `app/api/chat/route.ts` | 要件④（maxSteps拡張） |

---

## 検証方法

1. **自動スクロール**: 過去メッセージを見ながら新メッセージ送信 → スクロールが動かないこと
2. **折り畳み**: ストリーミング中にSpinner表示、クリックで展開/折り畳み
3. **テーブル**: エージェントにBT登録を依頼 → 表形式で表示されること
4. **maxSteps**: 5Step超の複雑な処理（BT登録→BR登録など）で最終回答が返ること

Playwright MCPで `http://localhost:3000/chat` にアクセスして動作確認
