# 8. 技術アーキテクチャ

本章では、要件管理DBアプリの技術的な構成を定義する。5章で設計したアプリ内AI、6章で設計したコーディングエージェント連携を含めた全体像を示し、各層の技術選定と責務を明確にする。

---

## 8.1 アーキテクチャ全体像

要件管理DBアプリは、3つの層で構成される。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        要件管理DBシステム全体像                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ① アプリケーション層                                              │  │
│  │    正本の管理UI、レビューUI、エクスポート                          │  │
│  │    [Next.js + Supabase]                                           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    │ API呼び出し                        │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ② アプリ内AI層                                                    │  │
│  │    登録支援、影響調査、品質チェック（チャットUI経由）               │  │
│  │    [Mastra Agent + Tool群]（5章参照）                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    │ ジョブ投入 / 結果受信              │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ③ コーディングエージェント連携層                                   │  │
│  │    コード解析、影響調査、改修実行                                   │  │
│  │    [Claude Agent SDK + MCP Server]（6章参照）                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

各層の責務：

| 層 | 責務 | 主な機能 |
|----|------|---------|
| アプリケーション層 | 正本の永続化、UI提供、エクスポート | CRUD画面、レビューUI、疑義リンク受信箱、Claude Code連携ファイル出力 |
| アプリ内AI層 | 登録支援、品質チェック、影響分析（正本ベース） | チャットUI、草案生成、Criticチェック、トップダウン分析 |
| コーディングエージェント連携層 | コード解析、影響調査（コードベース）、改修実行 | InvestigationRequest処理、ModificationPackage処理、PR作成 |

この3層構成により、「正本の管理」「AIによる支援」「コーディングエージェントとの連携」を明確に分離し、各層を独立して進化させられる。

---

## 8.2 技術選定

### 選定一覧

| コンポーネント | 技術 | 選定理由 |
|---------------|------|---------|
| フロントエンド | Next.js 16 (App Router) | PRで指定された技術スタック |
| UIライブラリ | shadcn/ui + Tailwind CSS 4 | PRで指定、コンポーネント豊富 |
| バックエンド | Next.js API Routes (Route Handler) | App Router標準、別途バックエンド不要 |
| データベース | Supabase (PostgreSQL) | RLS、リアルタイム、Auth統合 |
| ベクトル検索 | pgvector | 概念辞書の類似検索、Supabase統合 |
| アプリ内AI | Mastra 1.x | Agent/Tool/Memory統合、5章で設計 |
| LLM（Agent本体） | Claude (Anthropic API) | 高精度の会話制御・ツール判断 |
| LLM（ツール内生成） | OpenAI / Z.AI（プロジェクト別設定） | コスト効率の高い大量テキスト生成 |
| コーディングエージェント | Claude Agent SDK | 6章で設計、MCP対応（Phase 5以降） |
| 認証 | Supabase Auth | Supabase RLS統合、Phase 6で実装予定 |
| ホスティング | Vercel | Next.js最適化、Edge Functions |

### 選定の背景

フロントエンドとバックエンドはPR（3.1参照）のtech_stack_profileで定義されたスタックに従う。本ツール自体が「PRに従って開発する」実践例となる。

バックエンドは当初Hono (Supabase Edge Functions)を検討したが、Next.js App RouterのRoute Handlerが十分に成熟しており、別途バックエンドフレームワークを立てる必要がないため、Next.js API Routesに一本化した。

アプリ内AIにMastraを採用する理由は5章で説明した通り、「単一Agent + 複数Tool」の構成を自然に実装でき、コンテキスト管理とワークフロー定義が容易なため。

LLMはAgent本体とツール内生成の二層構造を採用する。Agent本体（会話制御・ツール判断）にはClaudeを使用し、ツール内の大量テキスト生成にはOpenAI/Z.AIを使用する。プロジェクト単位でLLMプロバイダー・モデル・temperature等を設定可能（`resolveProjectLlmRuntimeSettings`）。

認証は当初BetterAuthを検討したが、Supabase AuthがRLSと統合されており、要件管理ツールの用途に十分なため、Supabase Authに変更した。

コーディングエージェントにClaude Agent SDKを採用する理由は6章で説明した通り、MCP対応によりアプリの正本に直接アクセスでき、サブエージェント機能で複雑なタスクを分解できるため。

---

## 8.3 アプリケーション層

### フロントエンド構成

```
/app
  /product-requirement    # PR編集
  /business               # 業務領域・BT・BR管理
  /system                 # システム領域・SF・SR・DD管理
  /ideas                  # 概念辞書管理
  /tickets                # CR・影響調査・疑義リンク管理
  /dashboard              # ヘルススコア・疑義リンクダッシュボード
  /links                  # 要件間リンク可視化
  /export                 # データエクスポート
  /baseline               # ベースラインデータ
  /chat                   # AIチャットUI（Mastra Agent）
  /settings               # プロジェクト設定
  /projects               # プロジェクト一覧
```

UIはshadcn/uiをベースに、以下のパターンで構成する。

| パターン | 用途 | コンポーネント例 |
|---------|------|----------------|
| 一覧画面 | BD/SD/CR等の一覧表示 | DataTable, Card |
| 詳細画面 | 要件の詳細表示・編集 | Form, Tabs, Sheet |
| チャット画面 | アプリ内AIとの対話 | Chat UI（カスタム） |
| レビュー画面 | 草案の確認・編集 | Diff View, Accordion |

### バックエンド構成

APIはNext.js App RouterのRoute Handler（`app/api/`配下の`route.ts`）で提供する。

| エンドポイント群 | 責務 |
|-----------------|------|
| /api/chat | Mastra Agentとのチャット（SSEストリーミング） |
| /api/drafts/commit | 草案の正本登録 |
| /api/concepts | 概念辞書CRUD |
| /api/export/business | 業務系データエクスポート |
| /api/export/requirements | 要件エクスポート（ZIP） |
| /api/export/system | システム系データエクスポート |
| /api/tickets/[id]/investigate | 影響調査実行 |
| /api/business/tasks/reorder | 業務タスク並び替え |

### データベース設計

主要テーブル：

| テーブル | 内容 |
|---------|------|
| projects | プロジェクト |
| product_requirements | PR（プロジェクトごとに1件） |
| business_domains | 業務領域（BD） |
| business_tasks | 業務タスク（BT） |
| business_requirements | 業務要件（BR） |
| system_domains | システム領域（SD） |
| system_functions | システム機能（SF） |
| system_requirements | システム要件（SR） |
| acceptance_criteria | 受入基準（AC） |
| design_documents | DD（Design Document） |
| concepts | 概念辞書 |
| requirement_links | 要件間リンク（疑義管理含む） |
| change_requests | 変更要求（CR） |
| investigation_results | 影響調査結果 |
| impact_scopes | 変更影響範囲 |

Row Level Security（RLS）でプロジェクト単位のアクセス制御を行う。

---

## 8.4 アプリ内AI層

5章で設計した統合Agent（Mastra）の技術的な配置を定義する。

### 配置構成

```
┌────────────────────────────────────────────────────────────────┐
│ Next.js アプリケーション                                        │
│                                                                │
│  ┌──────────────┐      ┌──────────────────────────────────┐   │
│  │ チャットUI    │ ───▶ │ /api/agent/chat                  │   │
│  │ (React)      │      │ (API Route)                      │   │
│  └──────────────┘      └──────────────┬───────────────────┘   │
│                                       │                       │
│                                       ▼                       │
│                        ┌──────────────────────────────────┐   │
│                        │ Mastra Agent                     │   │
│                        │ (サーバーサイドで実行)            │   │
│                        │                                  │   │
│                        │  ┌────────────────────────────┐  │   │
│                        │  │ Tool群                     │  │   │
│                        │  │ - bt_draft                 │  │   │
│                        │  │ - br_draft                 │  │   │
│                        │  │ - system_draft             │  │   │
│                        │  │ - impact_analysis          │  │   │
│                        │  │ - critic_check             │  │   │
│                        │  │ - ...                      │  │   │
│                        │  └────────────────────────────┘  │   │
│                        └──────────────┬───────────────────┘   │
│                                       │                       │
│                                       ▼                       │
│                        ┌──────────────────────────────────┐   │
│                        │ Supabase (正本DB)                │   │
│                        └──────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Mastra Agent の初期化

```typescript
// /lib/mastra/agents/requirements-agent.ts
import { Agent } from '@mastra/core';
import { tools } from '../tools';
import { memory } from '../memory';
import { resolveProjectLlmRuntimeSettings, resolveProjectAgentModel } from '../utils/llm-settings';

export const requirementsAgent = new Agent({
  name: 'requirements-agent',
  instructions: `...`, // 5.2参照
  // Agent本体のLLM: Claude（会話制御・ツール判断）
  model: async ({ requestContext }) => {
    const projectId = requestContext?.get('projectId');
    const settings = await resolveProjectLlmRuntimeSettings(projectId);
    // Z.AIプロバイダーの場合はOpenAI互換API経由
    if (settings.provider === 'zai') {
      return { id: `openai/${settings.model}`, url: settings.baseUrl, apiKey: getZaiApiKey() };
    }
    return resolveProjectAgentModel(projectId);
  },
  tools,
  memory, // LibSQLStore + LibSQLVector
});
```

> **補足**: ツール内の草案生成（bt_draft, system_draft等）では `callOpenAI()` ヘルパー関数を使用し、Agent本体とは別のLLMモデルを呼び出す。これによりAgent本体は高品質な会話制御に、ツール内生成はコスト効率の高いモデルに、と使い分けが可能。

### Tool群の実装パターン

各Toolは以下のパターンで実装する。

```typescript
// /lib/mastra/tools/bt-draft.ts
import { createTool } from '@mastra/core';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const btDraftTool = createTool({
  id: 'bt_draft',
  description: '業務タスク（BT）の草案を生成する',
  inputSchema: z.object({
    naturalLanguageInput: z.string(),
    bdId: z.string(),
  }),
  execute: async ({ naturalLanguageInput, bdId }, { context }) => {
    // 1. 正本からコンテキスト取得
    const pr = await supabase.from('product_requirements').select('*').single();
    const existingBTs = await supabase.from('business_tasks').select('*').eq('bd_id', bdId);
    
    // 2. LLMで草案生成（Mastraの内部LLM呼び出し）
    // ...
    
    // 3. 草案を返却（DBには保存しない）
    return { draft, uncertainties };
  },
});
```

### セッション管理

チャットセッションはMastraのMemory機能で管理し、以下のコンテキストを保持する。

| コンテキスト | 保持期間 | 用途 |
|-------------|---------|------|
| PR | セッション開始時に注入 | 技術スタック、コーディング規約の参照 |
| 現在位置 | セッション中更新 | 親要件の自動設定 |
| 未確定草案 | セッション終了まで | 連続作業の文脈維持 |
| 会話履歴 | セッション終了まで | 対話の継続 |

---

## 8.5 コーディングエージェント連携層

6章で設計したコーディングエージェント連携の技術的な配置を定義する。

### 配置構成

```
┌────────────────────────────────────────────────────────────────────┐
│ 要件管理DBアプリ                                                   │
│                                                                    │
│  ┌──────────────────┐      ┌──────────────────────────────────┐   │
│  │ CR詳細画面        │ ───▶ │ /api/jobs/investigation          │   │
│  │ (影響調査ボタン)  │      │ (ジョブ投入API)                   │   │
│  └──────────────────┘      └──────────────┬───────────────────┘   │
│                                           │                       │
└───────────────────────────────────────────┼───────────────────────┘
                                            │ ジョブ投入
                                            ▼
┌────────────────────────────────────────────────────────────────────┐
│ Agent Runner (Cloud Run)                                           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Claude Agent SDK                                             │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ MCP Client                                             │  │  │
│  │  │ - 正本API (MCP Server) への接続                        │  │  │
│  │  │ - 対象リポジトリへのアクセス                            │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ ジョブ実行                                             │  │  │
│  │  │ - InvestigationRequest → InvestigationResult           │  │  │
│  │  │ - ModificationPackage → 実装 → PR作成                  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
                                            │
                                            │ MCP Protocol
                                            ▼
┌────────────────────────────────────────────────────────────────────┐
│ MCP Server (要件管理DBアプリ内)                                    │
│                                                                    │
│  提供ツール:                                                       │
│  - get_product_requirement                                         │
│  - search_requirements                                             │
│  - get_requirement                                                 │
│  - get_system_function                                             │
│  - get_links                                                       │
│  - submit_investigation_result                                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### MCP Server の実装

MCP Serverは、コーディングエージェントが正本にアクセスするためのインターフェースを提供する。

#### 段階的実装方針

**Phase 5（ビジネスMVP時）- 最小限実装：**
読み取り専用ツールのみ実装。認証はシンプルなプロジェクトIDベース（リクエストヘッダで受け取る）。

```typescript
// Phase 5: 最小限ツールセット
const mvpTools: Tool[] = [
  {
    name: 'get_product_requirement',
    description: 'プロダクト要件（PR）を取得',
    handler: async ({ project_id }) => { /* ... */ },
  },
  {
    name: 'search_requirements',
    description: '要件を検索（業務/システム）',
    handler: async ({ project_id, query, type }) => { /* ... */ },
  },
  {
    name: 'get_requirement',
    description: '要件の詳細を取得',
    handler: async ({ project_id, id }) => { /* ... */ },
  },
  {
    name: 'get_system_function',
    description: 'システム機能（エントリポイント含む）を取得',
    handler: async ({ project_id, id }) => { /* ... */ },
  },
];
```

**Phase 6（PMF後）- 完全版：**
書き込みツール追加、APIキー認証、レート制限、監査ログを実装。

```typescript
// /lib/mcp/server.ts
import { MCPServer, Tool } from '@modelcontextprotocol/sdk';

const tools: Tool[] = [
  {
    name: 'get_product_requirement',
    description: 'プロダクト要件（PR）を取得',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const pr = await supabase.from('product_requirements').select('*').single();
      return pr;
    },
  },
  {
    name: 'search_requirements',
    description: '要件を検索',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        type: { type: 'string', enum: ['business', 'system'] },
      },
      required: ['query'],
    },
    handler: async ({ query, type }) => {
      // ベクトル検索 + 全文検索
      // ...
    },
  },
  // ... 他のツール
];

export const mcpServer = new MCPServer({ tools });
```

### ジョブ管理

ジョブは以下の状態を持つ。

```
pending → running → completed
                 → failed
                 → cancelled
```

ジョブの状態と結果はSupabaseに永続化し、UIからリアルタイムで監視できる。

---

## 8.6 セキュリティ

### 認証・認可

| 対象 | 方式 | 説明 |
|------|------|------|
| ユーザー認証 | Supabase Auth | メール/パスワード、OAuth（GitHub等）。Phase 6で実装予定 |
| API認証（アプリ内） | セッションベース | Supabase Authのセッション |
| API認証（MCP Server） | APIキー | プロジェクトごとに発行 |
| DB認可 | RLS | プロジェクト単位のアクセス制御 |

### 権限モデル

組織→プロジェクト→ユーザーの3層構造で権限を管理する。

```
組織（Organization）
  └── プロジェクト（Project）
        └── メンバー（User + Role）
```

ロール定義：

| ロール | 説明 | 権限 |
|--------|------|------|
| owner | 組織オーナー | 組織設定、プロジェクト作成・削除、メンバー管理、全操作 |
| admin | プロジェクト管理者 | プロジェクト設定、メンバー招待、全要件の編集・削除 |
| editor | 編集者 | 要件の作成・編集、CR起票、影響調査実行 |
| viewer | 閲覧者 | 要件の閲覧のみ、編集不可 |

操作別の権限マトリクス：

| 操作 | owner | admin | editor | viewer |
|------|:-----:|:-----:|:------:|:------:|
| 組織設定 | 〇 | - | - | - |
| プロジェクト作成・削除 | 〇 | - | - | - |
| プロジェクト設定 | 〇 | 〇 | - | - |
| メンバー管理 | 〇 | 〇 | - | - |
| 要件の閲覧 | 〇 | 〇 | 〇 | 〇 |
| 要件の作成・編集 | 〇 | 〇 | 〇 | - |
| 要件の削除 | 〇 | 〇 | - | - |
| CR起票・影響調査 | 〇 | 〇 | 〇 | - |
| 改修指示パッケージ生成 | 〇 | 〇 | 〇 | - |
| エクスポート | 〇 | 〇 | 〇 | 〇 |

MVPスコープ：MVPではowner/editorの2ロールで開始し、admin/viewerは将来拡張とする。

### データ保護

| 観点 | 対策 |
|------|------|
| 通信の暗号化 | HTTPS必須 |
| 保存時の暗号化 | Supabaseのデフォルト暗号化 |
| 機密情報の分離 | APIキー等はVault（将来拡張） |

### コーディングエージェントへのデータ送信

コーディングエージェントに送信される正本データは、以下のルールで制御する。

| ルール | 説明 |
|--------|------|
| 送信範囲の可視化 | UIで「どの正本がエージェントに送られるか」を表示 |
| 機密フラグ（将来） | 機密性の高い要件には「送信不可」フラグを設定可能 |
| ログ記録 | エージェントへの送信内容を監査ログに記録 |

---

## 8.7 コスト管理

### コスト発生ポイント

| コンポーネント | 課金単位 | 主なコスト要因 |
|---------------|---------|---------------|
| Anthropic API（Agent本体） | トークン | 会話制御、ツール判断 |
| OpenAI / Z.AI API（ツール内生成） | トークン | 草案生成、品質チェック |
| Anthropic API（Agent SDK経由） | トークン | 影響調査、改修実行（Phase 5以降） |
| Supabase | ストレージ、リクエスト | 正本保存、API呼び出し |
| Vercel | 関数実行時間 | API処理 |

### トークン消費の目安

| 操作 | 想定トークン | 備考 |
|------|-------------|------|
| BT草案生成 | 1,000〜3,000 | 入力の長さに依存 |
| SF/SR/AC一括生成 | 3,000〜8,000 | BR数に依存 |
| 品質チェック | 1,000〜3,000 | チェック対象数に依存 |
| 影響調査（コード解析） | 5,000〜15,000 | リポジトリ規模に依存 |
| 改修実行（1ファイル） | 5,000〜20,000 | 変更内容に依存 |

### コスト最適化の方針

| 方針 | 効果 |
|------|------|
| 段階的な深掘り | 最初は浅い分析、必要に応じて深掘り |
| 正本の充実 | 正本が充実するほどコード分析の範囲を絞れる |
| キャッシュ活用 | 同一セッション内の重複クエリをキャッシュ |
| モデル使い分け | 簡単なタスクはHaiku、複雑なタスクはSonnet |

### 予算管理（将来拡張）

- プロジェクトごとの月額上限設定
- 上限到達時の警告・制限
- 使用量ダッシュボード
