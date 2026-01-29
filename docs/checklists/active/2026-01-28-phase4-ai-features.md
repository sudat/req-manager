# Phase4 AI機能（PRD 11.2 準拠）

最終更新: 2026-01-28 (Mastra最新仕様対応)

---

## 1. エグゼクティブサマリー

### 目的
PRD 第11章 Phase4 のチェックリストを詳細化し、Mastra Agentを統合してAIチャットUI・草案生成機能を実装する。

### 対象フェーズ
- Phase 4: AI機能

### 期待成果物
- Mastra Agent基盤（単一Agent + 複数Tool構成）
- コンテキスト注入機能（PR、現在位置、既存要件、概念辞書）
- 登録支援Tool群（bt_draft, br_draft, system_draft, impl_unit_draft）
- 品質チェックTool（critic_check）
- 概念抽出Tool（concept_extract）
- AIチャットUI（/chat）
- 草案プレビュー・確定フロー
- 「AIで追加」ボタン連携

---

## 2. 前提・方針

- PRD 5章の設計に準拠する
- Mastraを使用して「単一Agent + 複数Tool」構成を採用
- 草案は未確定状態で保持し、ユーザーの確定操作を待つ
- AIストリーミング表示で体感速度を改善
- エラーハンドリング・リトライ機構を用意

---

## 3. 詳細チェックリスト

### 3.1 Mastra セットアップ・Agent定義（4-1）

**関連ファイル**: `lib/mastra/`, `package.json`

#### 実装項目
- [x] Mastra パッケージインストール
  - @mastra/core
  - @mastra/memory
  - @mastra/libsql
- [x] 環境変数設定（ANTHROPIC_API_KEY, OPENAI_API_KEY等）
- [x] Memory設定（`lib/mastra/memory.ts`）
  - LibSQLStore設定（storage: file:./data/memory.db）
  - LibSQLVector設定（vector: file:./data/vector.db）
  - embedder: 'openai/text-embedding-3-small'
  - options設定（lastMessages, semanticRecall, workingMemory）
- [x] requirementsAgent定義（`lib/mastra/agents/requirements-agent.ts`）
  - id: 'requirements-agent'
  - name: 'Requirements Assistant'
  - model: 'anthropic/claude-sonnet-4-20250514'
  - instructions: PRD 5章のシステムプロンプト
  - tools: { btDraftTool, brDraftTool, ... } オブジェクト形式
  - memory: memory インスタンス
- [x] Mastra初期化設定ファイル作成（`lib/mastra/index.ts`）

#### 確認項目
- [x] `bun run dev` でMastra初期化エラーなし
- [x] Agent定義がコンパイルエラーなく読み込まれる
- [ ] Memory DBファイルが作成される（Agent使用時に自動作成）

---

### 3.2 コンテキスト注入機能（4-2）

**関連ファイル**: `lib/mastra/context/`

#### 実装項目
- [x] Context Provider実装（`lib/mastra/context/provider.ts`）
  - product_requirement取得
  - current_location取得（UI位置情報）
  - related_requirements取得
  - concept_dictionary取得
  - recent_drafts取得
- [x] buildContext関数実装（UILocationからコンテキスト構築）
- [x] buildInitialPrompt関数実装（位置に応じた初期プロンプト生成）
- [x] threadId/resourceId管理機能実装
  - threadId: 会話スレッド識別子（セッションごと）
  - resourceId: ユーザー/プロジェクト識別子

#### 確認項目
- [ ] BD画面からコンテキストが正しく取得できる（UI実装後に確認）
- [ ] BT/SF/CR等各画面で適切な初期プロンプトが生成される（UI実装後に確認）
- [ ] threadIdでメモリが正しく管理される（UI実装後に確認）

---

### 3.3 bt_draft / br_draft Tool 実装（4-3）

**関連ファイル**: `lib/mastra/tools/bt-draft.ts`, `lib/mastra/tools/br-draft.ts`

#### 実装項目
- [x] bt_draft Tool実装（createTool使用）
  - id: 'bt_draft'
  - description: '業務タスク（BT）の草案を生成する'
  - inputSchema: z.object({ naturalLanguageInput, bdId, generateBR })
  - execute: async (inputData) の形式
    - PRとコンテキストを参照してBT草案生成
    - 概念候補抽出
    - 未確定事項抽出
    - BRも同時生成オプション対応
- [x] br_draft Tool実装（createTool使用）
  - id: 'br_draft'
  - inputSchema: z.object({ naturalLanguageInput, btId })
  - execute: async (inputData) の形式
  - 既存BRを参照して重複回避
  - 概念候補抽出

#### 確認項目
- [ ] 自然文入力からBT草案が生成される（UI実装後に確認）
- [ ] 生成されたBTがPRDの3章YAML形式に準拠（UI実装後に確認）
- [ ] 概念候補が抽出される（UI実装後に確認）

---

### 3.4 system_draft Tool 実装（4-4）

**関連ファイル**: `lib/mastra/tools/system-draft.ts`

#### 実装項目
- [x] system_draft Tool実装（createTool使用）
  - id: 'system_draft'
  - description: 'BR群からSF/SR/ACを一括生成する'
  - inputSchema: z.object({ brIds: z.array(z.string()), additionalContext })
  - execute: async (inputData) の形式
    - BR群からSF/SR/AC一括生成
    - tech_stack_profile参照
    - coding_conventions参照
    - SRのtypeに応じたGWTテンプレート適用
    - realizesリンク自動生成

#### 確認項目
- [ ] BR IDからSF/SR/AC階層が生成される（UI実装後に確認）
- [ ] ACがGWT形式で生成される（UI実装後に確認）
- [ ] realizesリンクが正しく生成される（UI実装後に確認）

---

### 3.5 impl_unit_draft Tool 実装（4-5）

**関連ファイル**: `lib/mastra/tools/impl-unit-draft.ts`

#### 実装項目
- [x] impl_unit_draft Tool実装（createTool使用）
  - id: 'impl_unit_draft'
  - description: '実装単位SDの草案を生成する'
  - inputSchema: z.object({ sfId, naturalLanguageInput })
  - execute: async (inputData) の形式
    - coding_conventionsに従ったentry_point生成
    - PRの技術スタック参照
    - データモデル設計案生成

#### 確認項目
- [ ] SF IDから実装単位SD草案が生成される（UI実装後に確認）
- [ ] entry_pointがcoding_conventionsに準拠（UI実装後に確認）

---

### 3.6 critic_check Tool 実装（4-6）

**関連ファイル**: `lib/mastra/tools/critic-check.ts`

#### 実装項目
- [x] critic_check Tool実装（createTool使用）
  - id: 'critic_check'
  - description: '要件の曖昧さ・矛盾・漏れを検出する'
  - inputSchema: z.object({ targetIds: z.array(z.string()), checkLevel })
  - execute: async (inputData) の形式
    - 曖昧性チェック
    - 検証可能性チェック（AC向け）
    - 整合性チェック（リンク間）
    - PRとの整合性チェック
    - 致命度でソート
    - 修正案生成

#### 確認項目
- [ ] 要件IDを指定して品質チェックが実行される（UI実装後に確認）
- [ ] 曖昧な表現が検出される（UI実装後に確認）
- [ ] 修正案が提示される（UI実装後に確認）

---

### 3.7 共通Tool群実装

**関連ファイル**: `lib/mastra/tools/`

#### 実装項目
- [x] save_to_draft Tool実装（createTool使用）
  - execute: async (inputData) 形式
  - 草案の一時保存
- [x] commit_draft Tool実装（createTool使用）
  - 草案の正本登録
- [x] search_requirements Tool実装（createTool使用）
  - 既存要件検索
- [x] get_links Tool実装（createTool使用）
  - 要件間リンク取得
- [x] get_context Tool実装（createTool使用）
  - コンテキスト情報取得

#### 確認項目
- [ ] 草案がdraft状態で保存される（UI実装後に確認）
- [ ] 確定操作で正本に登録される（UI実装後に確認）

---

### 3.8 AIチャットUI実装（4-7）

**関連ファイル**: `app/(with-sidebar)/[projectId]/chat/`, `components/ai-chat/`

#### 実装項目
- [x] チャットページ作成（`app/(with-sidebar)/chat/page.tsx`）
- [x] チャットUIコンポーネント作成
  - ヘッダー（現在位置表示、閉じるボタン）
  - クイックアクションバー（BT登録, BR登録, SF/SR/AC生成, 品質チェック）
  - チャット履歴表示エリア
  - メッセージ入力フォーム
- [x] Mastra Agent接続API（`app/api/chat/route.ts`）
  - agent.generate() 実装（テキスト生成）
  - agent.stream() 実装（ストリーミング対応）
  - threadId/resourceId管理
  - for await (const chunk of stream.textStream) でストリーミング
- [ ] 構造化出力対応（z.object()でスキーマ定義）※将来の拡張用
- [x] エラーハンドリング・リトライUI

#### 確認項目
- [ ] /chat画面が表示される（動作確認後にチェック）
- [ ] メッセージ送信でAgentからレスポンスが返る（動作確認後にチェック）
- [ ] textStreamでストリーミング表示される（動作確認後にチェック）
- [ ] クイックアクションが動作する（動作確認後にチェック）
- [ ] threadIdでメモリが保持される（動作確認後にチェック）

---

### 3.9 草案プレビュー・確定フロー実装（4-8）

**関連ファイル**: `components/ai-chat/draft-preview/`

#### 実装項目
- [x] 草案プレビューカードコンポーネント
  - タイプ別表示（BT/BR/SF/SR/AC/実装単位SD）
  - 確定/編集/やり直しボタン
- [x] 草案状態管理（draft → committed/discarded）
  - チャットコンテナに統合完了
- [ ] 詳細モーダル（将来の拡張）
- [ ] 一括生成プレビュー（ツリー表示）※将来の拡張
- [ ] 確定前品質チェック自動実行※将来の拡張
- [ ] セッション終了時の未確定草案確認ダイアログ※将来の拡張

#### 確認項目
- [ ] 草案がプレビューカードで表示される（動作確認後にチェック）
- [ ] 確定ボタンで正本に登録される（動作確認後にチェック）
- [ ] 編集ボタンでマニュアル登録画面に遷移（動作確認後にチェック）
- [ ] 一括確定が動作する（将来の拡張）

---

### 3.10 「AIで追加」ボタン連携（4-9）

**関連ファイル**: `app/(with-sidebar)/business/`, `app/(with-sidebar)/system/`

#### 実装項目
- [x] BD詳細画面に「AIで追加」ボタン追加
- [x] BT詳細画面に「AIで追加」ボタン追加
- [x] SF詳細画面に「AIで追加」ボタン追加
- [x] ボタン押下時にチャットUIをコンテキスト付きで起動
- [x] 起動時の位置情報をContext Providerに渡す

#### 確認項目
- [ ] BD詳細画面から「AIで追加」→チャットUI起動（動作確認後にチェック）
- [ ] 起動時に位置情報が表示される（動作確認後にチェック）
- [ ] 生成したBTがBD配下に正しく登録される（動作確認後にチェック）

---

### 3.11 概念候補抽出・提案UI実装（4-10）

**関連ファイル**: `lib/mastra/tools/concept-extract.ts`, `components/ai-chat/concept-suggestion/`

#### 実装項目
- [x] concept_extract Tool実装（createTool使用）
  - id: 'concept_extract'
  - description: 'テキストから概念候補を抽出する'
  - inputSchema: z.object({ text: z.string(), projectId: z.string() })
  - execute: async (inputData) 形式
    - テキストから概念候補を抽出
    - 既存概念辞書との照合
    - 新規概念候補の提案
- [x] 概念候補提案UIコンポーネント
  - 承認/却下/保留ボタン
  - 概念詳細入力フォーム（承認時）
- [x] チャットコンテナへの統合
  - 概念候補の表示
  - 承認フォームの表示

#### 確認項目
- [ ] 草案生成時に概念候補が抽出される（動作確認後にチェック）
- [ ] 既存概念との一致が検出される（動作確認後にチェック）
- [ ] 新規概念として承認→概念辞書に登録（動作確認後にチェック）

---

## 4. 依存関係

```
3.1 Mastraセットアップ
    ├── 3.2 コンテキスト注入
    │   └── 3.8 AIチャットUI
    │       ├── 3.9 草案プレビュー
    │       └── 3.10 AIで追加ボタン
    ├── 3.3 bt_draft/br_draft
    ├── 3.4 system_draft
    ├── 3.5 impl_unit_draft
    ├── 3.6 critic_check
    ├── 3.7 共通Tool群
    │   └── 3.9 草案プレビュー
    └── 3.11 概念抽出
```

---

## 5. 完了条件（M4相当）

PRD 11.3のM4完了時の確認項目：

- [ ] AIチャットUIで自然文を入力し、BT草案が生成される
- [ ] 草案をプレビューし、確定すると正本に登録される
- [ ] SF/SR/ACの一括生成が動作する
- [ ] 概念候補が提案され、承認/却下/保留ができる
- [ ] critic_checkで品質チェック結果が表示される

---

## 6. 技術的注意点（PRD 11.4 + Mastra最新仕様）

| 項目 | 注意点 |
|------|--------|
| 草案の状態管理 | 未確定の草案はセッション内で保持し、画面遷移で消えないようにする |
| ストリーミング | agent.stream() + textStream で体感速度を改善する |
| エラーハンドリング | AI呼び出し失敗時のリトライ・フォールバックを用意する |
| モデル指定 | `anthropic/claude-sonnet-4-20250514` の形式 |
| Tool定義 | createTool() + execute: async (input, context) の形式 |
| Tools渡し | agent定義で `tools: { toolName }` オブジェクト形式 |
| メモリ管理 | Memory + LibSQLStore + threadId/resourceId で管理 |
| コンテキストアクセス | Tool内で context.mastra, context.agent 経由 |

---

## 7. 推奨実装順序

### Week 1: 基盤構築
- 3.1 Mastraセットアップ
- 3.2 コンテキスト注入
- 3.7 共通Tool群（save_to_draft, commit_draft）

### Week 2: Tool実装
- 3.3 bt_draft / br_draft
- 3.4 system_draft
- 3.5 impl_unit_draft
- 3.6 critic_check
- 3.11 概念抽出

### Week 3: UI実装
- 3.8 AIチャットUI
- 3.9 草案プレビュー
- 3.10 AIで追加ボタン
- M4動作確認
