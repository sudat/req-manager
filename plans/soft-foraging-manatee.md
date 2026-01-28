# Phase 4: AI機能 詳細計画

## 概要
PRD 第11章 Phase4 のチェックリストを詳細化し、Mastra Agent統合とAIチャットUI実装を行う。

**想定期間**: 2-3週間
**難易度**: ★★★ (広範囲かつ技術難度高)

---

## 作成予定チェックリスト

以下の内容で `docs/checklists/active/2026-01-28-phase4-ai-features.md` を作成します。

---

# Phase4 AI機能（PRD 11.2 準拠）

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
- [ ] Mastra パッケージインストール（@mastra/core）
- [ ] 環境変数設定（ANTHROPIC_API_KEY等）
- [ ] Mastra初期化設定ファイル作成（`lib/mastra/index.ts`）
- [ ] requirementsAgent定義（`lib/mastra/agents/requirements-agent.ts`）
  - name: 'requirements-agent'
  - model: claude-sonnet-4
  - instructions: PRD 5章のシステムプロンプト
- [ ] Tool群のエクスポート設定

#### 確認項目
- [ ] `bun run dev` でMastra初期化エラーなし
- [ ] Agent定義がコンパイルエラーなく読み込まれる

---

### 3.2 コンテキスト注入機能（4-2）

**関連ファイル**: `lib/mastra/context/`

#### 実装項目
- [ ] Context Provider実装（`lib/mastra/context/provider.ts`）
  - product_requirement取得
  - current_location取得（UI位置情報）
  - related_requirements取得
  - concept_dictionary取得
  - recent_drafts取得
- [ ] buildContext関数実装（UILocationからコンテキスト構築）
- [ ] buildSystemMessage関数実装（位置に応じた初期メッセージ）
- [ ] initializeChatSession関数実装（セッション初期化）

#### 確認項目
- [ ] BD画面からコンテキストが正しく取得できる
- [ ] BT/SF/CR等各画面で適切なシステムメッセージが生成される

---

### 3.3 bt_draft / br_draft Tool 実装（4-3）

**関連ファイル**: `lib/mastra/tools/bt-draft.ts`, `lib/mastra/tools/br-draft.ts`

#### 実装項目
- [ ] bt_draft Tool実装
  - 入力: naturalLanguageInput, bdId, generateBR(optional)
  - PRとコンテキストを参照してBT草案生成
  - 概念候補抽出
  - 未確定事項抽出
  - BRも同時生成オプション対応
- [ ] br_draft Tool実装
  - 入力: naturalLanguageInput, btId
  - 既存BRを参照して重複回避
  - 概念候補抽出

#### 確認項目
- [ ] 自然文入力からBT草案が生成される
- [ ] 生成されたBTがPRDの3章YAML形式に準拠
- [ ] 概念候補が抽出される

---

### 3.4 system_draft Tool 実装（4-4）

**関連ファイル**: `lib/mastra/tools/system-draft.ts`

#### 実装項目
- [ ] system_draft Tool実装
  - 入力: brIds, additionalContext(optional)
  - BR群からSF/SR/AC一括生成
  - tech_stack_profile参照
  - coding_conventions参照
  - SRのtypeに応じたGWTテンプレート適用
  - realizesリンク自動生成

#### 確認項目
- [ ] BR IDからSF/SR/AC階層が生成される
- [ ] ACがGWT形式で生成される
- [ ] realizesリンクが正しく生成される

---

### 3.5 impl_unit_draft Tool 実装（4-5）

**関連ファイル**: `lib/mastra/tools/impl-unit-draft.ts`

#### 実装項目
- [ ] impl_unit_draft Tool実装
  - 入力: sfId, naturalLanguageInput(optional)
  - coding_conventionsに従ったentry_point生成
  - PRの技術スタック参照
  - データモデル設計案生成

#### 確認項目
- [ ] SF IDから実装単位SD草案が生成される
- [ ] entry_pointがcoding_conventionsに準拠

---

### 3.6 critic_check Tool 実装（4-6）

**関連ファイル**: `lib/mastra/tools/critic-check.ts`

#### 実装項目
- [ ] critic_check Tool実装
  - 入力: targetIds, checkLevel(quick/standard/thorough)
  - 曖昧性チェック
  - 検証可能性チェック（AC向け）
  - 整合性チェック（リンク間）
  - PRとの整合性チェック
  - 致命度でソート
  - 修正案生成

#### 確認項目
- [ ] 要件IDを指定して品質チェックが実行される
- [ ] 曖昧な表現が検出される
- [ ] 修正案が提示される

---

### 3.7 共通Tool群実装

**関連ファイル**: `lib/mastra/tools/common/`

#### 実装項目
- [ ] save_to_draft Tool実装（草案の一時保存）
- [ ] commit_draft Tool実装（草案の正本登録）
- [ ] search_requirements Tool実装（既存要件検索）
- [ ] get_links Tool実装（要件間リンク取得）
- [ ] get_context Tool実装（コンテキスト情報取得）

#### 確認項目
- [ ] 草案がdraft状態で保存される
- [ ] 確定操作で正本に登録される

---

### 3.8 AIチャットUI実装（4-7）

**関連ファイル**: `app/(with-sidebar)/[projectId]/chat/`, `components/ai-chat/`

#### 実装項目
- [ ] チャットページ作成（`app/(with-sidebar)/[projectId]/chat/page.tsx`）
- [ ] チャットUIコンポーネント作成
  - ヘッダー（現在位置表示、閉じるボタン）
  - クイックアクションバー（BT登録, BR登録, SF/SR/AC生成, 品質チェック）
  - チャット履歴表示エリア
  - メッセージ入力フォーム
- [ ] ストリーミングレスポンス対応
- [ ] Mastra Agentとの接続API（`app/api/chat/route.ts`）
- [ ] エラーハンドリング・リトライUI

#### 確認項目
- [ ] /chat画面が表示される
- [ ] メッセージ送信でAgentからレスポンスが返る
- [ ] ストリーミング表示される
- [ ] クイックアクションが動作する

---

### 3.9 草案プレビュー・確定フロー実装（4-8）

**関連ファイル**: `components/ai-chat/draft-preview/`

#### 実装項目
- [ ] 草案プレビューカードコンポーネント
  - タイプ別表示（BT/BR/SF/SR/AC/実装単位SD）
  - 詳細モーダル
  - 確定/編集/やり直しボタン
- [ ] 一括生成プレビュー（ツリー表示）
- [ ] 草案状態管理（draft → committed/discarded）
- [ ] 確定前品質チェック自動実行
- [ ] セッション終了時の未確定草案確認ダイアログ

#### 確認項目
- [ ] 草案がプレビューカードで表示される
- [ ] 確定ボタンで正本に登録される
- [ ] 編集ボタンでマニュアル登録画面に遷移
- [ ] 一括確定が動作する

---

### 3.10 「AIで追加」ボタン連携（4-9）

**関連ファイル**: `app/(with-sidebar)/business/`, `app/(with-sidebar)/system/`

#### 実装項目
- [ ] BD詳細画面に「AIで追加」ボタン追加
- [ ] BT詳細画面に「AIで追加」ボタン追加
- [ ] SF詳細画面に「AIで追加」ボタン追加
- [ ] ボタン押下時にチャットUIをコンテキスト付きで起動
- [ ] 起動時の位置情報をContext Providerに渡す

#### 確認項目
- [ ] BD詳細画面から「AIで追加」→チャットUI起動
- [ ] 起動時に「BD-XXXにBTを追加します」のシステムメッセージ表示
- [ ] 生成したBTがBD配下に正しく登録される

---

### 3.11 概念候補抽出・提案UI実装（4-10）

**関連ファイル**: `lib/mastra/tools/concept-extract.ts`, `components/ai-chat/concept-suggestion/`

#### 実装項目
- [ ] concept_extract Tool実装
  - テキストから概念候補を抽出
  - 既存概念辞書との照合
  - 新規概念候補の提案
- [ ] 概念候補提案UIコンポーネント
  - 承認/却下/保留ボタン
  - 概念詳細入力フォーム（承認時）
- [ ] 草案生成時の概念候補自動表示

#### 確認項目
- [ ] 草案生成時に概念候補が抽出される
- [ ] 既存概念との一致が検出される
- [ ] 新規概念として承認→概念辞書に登録

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

## 6. 技術的注意点（PRD 11.4より）

| 項目 | 注意点 |
|------|--------|
| 草案の状態管理 | 未確定の草案はセッション内で保持し、画面遷移で消えないようにする |
| ストリーミング | AI生成はストリーミング表示で体感速度を改善する |
| エラーハンドリング | AI呼び出し失敗時のリトライ・フォールバックを用意する |

---

## 7. 推奨実装順序

1. **Week 1: 基盤構築**
   - 3.1 Mastraセットアップ
   - 3.2 コンテキスト注入
   - 3.7 共通Tool群（save_to_draft, commit_draft）

2. **Week 2: Tool実装**
   - 3.3 bt_draft / br_draft
   - 3.4 system_draft
   - 3.5 impl_unit_draft
   - 3.6 critic_check
   - 3.11 概念抽出

3. **Week 3: UI実装**
   - 3.8 AIチャットUI
   - 3.9 草案プレビュー
   - 3.10 AIで追加ボタン
   - M4動作確認

---

## 8. 次のアクション

Plan承認後、`docs/checklists/active/2026-01-28-phase4-ai-features.md` にチェックリストを作成して実装を開始します。
