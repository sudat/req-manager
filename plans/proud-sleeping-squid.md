# 修正プラン: BT登録直後のBR草案作成でBTが見つからないエラー

## 問題の概要

BTを登録した直後に同じチャットスレッドでBR草案を作成しようとすると「業務タスクが見つかりません」エラーが発生する。

**エラー詳細:**
- 対象BT: `BT-GL-0010`
- エラーメッセージ: 「BR草案生成に失敗: 業務タスクが見つかりません」
- BTは確実にDBに存在する

## 根本原因

**AIエージェントのinstructionsにBR登録時のBT ID取得ルールが不足している。**

### コード分析

1. **`brDraftTool`** (`lib/mastra/tools/br-draft.ts:38`)
   ```typescript
   .eq('id', btId)  // btIdで完全一致検索
   ```
   - DBの`business_tasks`テーブルを`id`カラムで完全一致検索

2. **`commitDraftTool`** (`lib/mastra/tools/commit-draft.ts:162`)
   ```typescript
   id: v.code,  // BT-GL-0010のようなcodeがそのままidになる
   ```

3. **`requirements-agent.ts`のinstructions**
   - **BR登録** (122-127行): BT IDの取得方法が**全く指定されていない**
   - **システム要件生成** (129-141行): BR ID取得ルールが**詳細に指定されている**

### 問題の対比

| 処理 | ID取得ルール | 結果 |
|------|-------------|------|
| システム要件生成 | 「BR IDの収集（重要）」セクションで詳細に指定 | ✅ 動作する |
| BR登録 | 「必要な情報を収集する」としか書いてない | ❌ AIがBT IDを間違える |

## 修正方針

### 修正内容

**ファイル:** `lib/mastra/agents/requirements-agent.ts`

**変更箇所:** 122-127行のBR登録セクションを以下に置き換え

```typescript
### 業務要件（BR）登録を依頼された場合
1. **BT IDの収集（重要）:**
   - 直前にBTを登録した場合: **commitDraftToolの結果から返されたID**（例: BT-GL-0010）を使用する
     - commitDraftToolの出力には「id: BT-GL-0010」が含まれている
   - 既存BTに対してBRを追加する場合: ユーザーに確認するか、searchRequirementsToolで検索
   - ユーザーがBT IDを明示した場合: そのIDを使用（例: 「BT-GL-0010にBRを追加」）
   - **絶対にToolを呼び出す前に、必ずBT IDが特定できているか確認すること**
2. **brDraftToolを呼び出す**
   - btId パラメータには「BT-{AREA}-{NNNN}」形式のIDを指定する
   - naturalLanguageInput にはユーザーの要件説明を渡す
3. ユーザーにマークダウン形式で草案を提示して確認を求める
4. ユーザーが承認したら**commitDraftTool**を呼び出して登録する

**BTからBRへの連続登録の対話例:**
ユーザ: 「じゃあ業務要件も登録して」
AI: 「先ほど登録したBT-GL-0010に業務要件を追加しますね。どのような要件ですか？」
ユーザ: 「申請書類は全て電子化されている必要がある」
AI: [brDraftToolをbtId: "BT-GL-0010"で呼び出す]
```

## 修正の難易度

難易度: ★☆☆
根拠: 1 file, 約30 lines, 1 component
リスク: instructionsの変更のみでコードロジックに影響なし

## 検証方法

1. **開発サーバーを起動**
   ```bash
   bun dev
   ```

2. **Playwright MCPで動作確認**
   - `http://localhost:3000/chat?screen=BD&bdId=GL` にアクセス
   - BTを新規登録する
   - 同じチャットで「業務要件も追加して」と依頼
   - エラーなくBR草案が生成されることを確認

3. **確認ポイント**
   - [ ] brDraftToolに正しいBT ID（BT-GL-XXXX形式）が渡されている
   - [ ] 「業務タスクが見つかりません」エラーが発生しない
   - [ ] BR草案が正常に生成される
