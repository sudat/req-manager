← 親ファイルの [PRD](../prd.md) の第6章に戻る。

---

← アーキテクチャの[architecture-specifiation](../request/architecture-specification.md)に遷移する。

---

# AI影響調査機能 設計書

## 1. 概要

### 1.1 目的
変更依頼（Change Request）に対して、Claude Agent SDKを利用した影響調査を自動実行する機能を提供する。業務ユーザーが記載した変更内容をもとに、該当するGitHubリポジトリのコードを解析し、影響範囲を構造化して返却する。

### 1.2 ゴール
- 変更依頼の照会画面から「AI影響分析」ボタンをクリックするだけで影響調査を開始できる
- 調査結果を `change_request_impact_scopes` テーブルに保存し、照会画面で確認できる
- 調査完了後、変更依頼のステータスを自動的に `open` → `review` に更新する

### 1.3 スコープ
- ✅ GitHubリポジトリのClone（URL指定 or リポジトリ選択）
- ✅ Claude Agent SDKによる影響調査の実行
- ✅ 調査結果の構造化保存
- ✅ ステータス自動更新
- ❌ リアルタイム進捗表示（Phase 2で実装）
- ❌ 複数リポジトリの同時調査（Phase 2で実装）

### 1.4 ドキュメントの位置づけ（使い分け）
- 本書: 影響調査機能の具体設計（フロー/API/データ/Cloud Run運用考慮/画面反映）
- 技術アーキテクチャ: 全体構成と責務分担、Agent Runner/MCPなど基盤設計（`docs/request/architecture-specification.md`）
- PRD: 要求レベルの概要のみ（詳細は本書と技術アーキテクチャに集約）

---

## 2. アーキテクチャ

### 2.1 全体フロー

```
[照会画面]
    ↓ ユーザーが「AI影響分析」ボタンクリック
[POST /api/tickets/{id}/analyze-impact]
    ↓ 202 Accepted（即時応答）
    ↓ Cloud Tasks でジョブ投入（idempotent）
[Cloud Run: 影響調査ワーカー]
    ├─ 0. analysis_logs を running で作成（job_id発行）
    ├─ 1. GitHubリポジトリのClone（URL or リポジトリ選択）
    ├─ 2. Claude Agent SDK呼び出し（MCP経由でDB接続）
    │   ├─ 2-1. 概念辞書で関連用語を検索
    │   ├─ 2-2. 関連する要件を検索（業務要件 + システム要件）
    │   ├─ 2-3. システム機能を特定
    │   ├─ 2-4. エントリポイントを取得
    │   ├─ 2-5. コード依存分析（エントリポイントから展開）
    │   ├─ 2-6. 逆引き：依存ファイル → 正本
    │   ├─ 2-7. 正本に未登録のファイルがあれば追加を提案
    │   └─ 2-8. 影響範囲を統合・確信度でランキング
    ├─ 3. 調査結果をJSONで受信（submit_impact_proposal）
    ├─ 4. change_request_impact_scopes に保存
    ├─ 5. analysis_logs を completed/error で更新
    └─ 6. ステータスを `review` に更新
```

### 2.2 データフロー

#### 2.2.1 入力（Change Request）
```typescript
{
  id: string;                // 変更依頼ID
  background: string;        // 背景
  purpose: string;           // 目的
  expected_effect: string;   // 期待効果
  impact_description: string;// 影響範囲の概要
}
```

#### 2.2.2 出力（Impact Scopes）
```typescript
{
  change_request_id: string;
  scope_type: 'business' | 'system' | 'api' | 'ui' | 'test';
  target_identifier: string; // 影響を受けるファイルパス or 機能ID
  description: string;       // 影響内容の説明
  confidence_score: number;  // 確信度 (0.0 ~ 1.0)
  evidence: string;          // 根拠（コード引用、依存関係など）
  suggestion: string | null; // AIからの提案
}[]
```

### 2.3 Cloud Run 前提の実行モデル（重要）

本機能は **Cloud Runにデプロイする前提** とし、次の制約・考慮を満たす設計とする。

- **非同期実行（必須）**: 影響調査は数分〜十数分になり得るため、HTTPリクエストを保持しない。`/api/tickets/{id}/analyze-impact` は **Cloud Tasks へ投入して即時202** を返す。
- **ステートレス前提**: Cloud Runインスタンスはリクエスト間で状態を保持しない。リポジトリcloneや中間状態は `/tmp`（一時）に置き、**必ずfinallyで削除**する。永続状態はDB（`analysis_logs` / `change_request_impact_scopes`）にのみ保存する。
- **冪等性（必須）**: Cloud Tasksは再送され得るため、同一Change Requestに対する重複実行を防ぐ（例：`analysis_logs` に `request_id`/`dedupe_key` を持たせ、runningが存在する場合は新規実行しない）。
- **依存のバンドル**: Cloud Run上で `npx -y ...` の動的取得に依存しない（起動遅延・外部障害・供給網リスク）。**コンテナに必要なnpm依存を含める**。
- **Secrets管理**: `ANTHROPIC_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / GitHub PAT は **Secret Manager** 経由で注入し、ログやエラー詳細に出さない。
- **ネットワーク考慮**: GitHubへのclone/LLM APIへの外向き通信が必須。必要に応じて **VPC Connector/egress** とIP制限（GitHub許可リスト等）を検討する。
- **リソースと並列性**: clone＋解析はI/OとCPUを使う。Cloud Runの **concurrencyは低め（原則1）**、メモリはリポジトリサイズに合わせる。スケールアウトによる費用増を見込む。

---

## 3. 実装詳細

### 3.1 APIエンドポイント

#### 3.1.1 POST /api/tickets/{id}/analyze-impact

**Request Body**
```typescript
{
  repository_url?: string;  // GitHubリポジトリURL（省略時はDB登録済みリポジトリを使用）
}
```

**Response**
```typescript
{
  success: boolean;
  message: string;
  job_id: string;           // analysis_logs.id
  enqueued: boolean;        // Cloud Tasksに投入できたか
}
```

**エラーレスポンス**
```typescript
{
  success: false;
  error: string;
  details?: string;
}
```

### 3.2 GitHubリポジトリのClone

#### 3.2.1 リポジトリURL指定の場合
```typescript
const repoPath = await cloneGitHubRepository({
  url: repository_url,
  destination: `/tmp/repo-${changeRequestId}`,
  shallow: true, // 履歴不要なので shallow clone
});
```

#### 3.2.2 リポジトリ選択の場合（Phase 2）
```typescript
// DBから登録済みリポジトリを取得
const repositories = await getLinkedRepositories(changeRequestId);
// 複数ある場合はユーザーに選択させる（UIで実装）
```

### 3.3 Claude Agent SDK呼び出し

#### 3.3.1 エージェント初期化
```typescript
import { ClaudeAgentSDK } from '@anthropic-ai/agent-sdk';

const agent = new ClaudeAgentSDK({
  apiKey: process.env.ANTHROPIC_API_KEY,
  mcpServers: [
    {
      name: 'supabase',
      command: 'npx',
      args: ['-y', '@supabase/mcp'],
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
    {
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', repoPath],
    },
  ],
});
```

> Cloud Run前提の注意: 上記のような `npx -y` 実行は **実運用では避け**、コンテナに依存を含めて固定バージョンで実行する（起動遅延/外部障害/供給網リスクの回避）。

#### 3.3.2 影響調査プロンプト
```typescript
const prompt = `
あなたは変更影響調査の専門家です。以下の変更依頼について、影響範囲を調査してください。

# 変更依頼
- 背景: ${changeRequest.background}
- 目的: ${changeRequest.purpose}
- 期待効果: ${changeRequest.expected_effect}
- 影響範囲概要: ${changeRequest.impact_description}

# 調査手順
1. 概念辞書（glossary_termsテーブル）で関連用語を検索
2. 関連する業務要件（business_requirementsテーブル）とシステム要件（system_requirementsテーブル）を特定
3. 関連するシステム機能（system_functionsテーブル）を特定
4. システム機能のエントリポイント（entry_pointsテーブル）を取得
5. エントリポイントから依存ファイルをコード解析で追跡
6. 各依存ファイルが正本（business_requirements, system_requirements, system_functions）のどれに対応するか逆引き
7. 正本に未登録のファイルがあれば追加を提案
8. 影響範囲を以下のカテゴリで整理し、確信度順にランキング

# 影響範囲のカテゴリ
- business: 業務要件（どの業務プロセスが影響を受けるか）
- system: システム要件（どのシステム機能が影響を受けるか）
- api: API（どのエンドポイントが影響を受けるか）
- ui: UI（どの画面・コンポーネントが影響を受けるか）
- test: テスト（どのテストケースが影響を受けるか）

# 出力形式
調査結果は submit_impact_proposal 関数を使って送信してください。
各影響範囲には以下を含めてください:
- target_identifier: ファイルパス or 機能ID
- description: 影響内容の説明
- confidence_score: 確信度（0.0 ~ 1.0）
- evidence: 根拠（コード引用、依存関係の説明など）
- suggestion: 推奨される対応（あれば）
`;
```

#### 3.3.3 submit_impact_proposal ツール定義
```typescript
const tools = [
  {
    name: 'submit_impact_proposal',
    description: '影響調査結果を送信する',
    input_schema: {
      type: 'object',
      properties: {
        impact_scopes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scope_type: {
                type: 'string',
                enum: ['business', 'system', 'api', 'ui', 'test'],
              },
              target_identifier: { type: 'string' },
              description: { type: 'string' },
              confidence_score: { type: 'number', minimum: 0, maximum: 1 },
              evidence: { type: 'string' },
              suggestion: { type: 'string', nullable: true },
            },
            required: ['scope_type', 'target_identifier', 'description', 'confidence_score', 'evidence'],
          },
        },
      },
      required: ['impact_scopes'],
    },
  },
];
```

### 3.4 調査結果の保存

#### 3.4.1 change_request_impact_scopes への保存
```typescript
const saveImpactScopes = async (changeRequestId: string, impactScopes: ImpactScope[]) => {
  const { data, error } = await supabase
    .from('change_request_impact_scopes')
    .insert(
      impactScopes.map((scope) => ({
        change_request_id: changeRequestId,
        scope_type: scope.scope_type,
        target_identifier: scope.target_identifier,
        description: scope.description,
        confidence_score: scope.confidence_score,
        evidence: scope.evidence,
        suggestion: scope.suggestion,
      }))
    );

  if (error) throw error;
  return data;
};
```

#### 3.4.2 ステータス更新
```typescript
const updateStatus = async (changeRequestId: string) => {
  const { error } = await supabase
    .from('change_requests')
    .update({ status: 'review' })
    .eq('id', changeRequestId);

  if (error) throw error;
};
```

### 3.5 エラーハンドリング

| エラーケース | ハンドリング |
|------------|------------|
| GitHubリポジトリのClone失敗 | エラーメッセージを返却、リトライ可能にする |
| Claude Agent SDKの呼び出し失敗 | タイムアウト設定（5分）、エラーログ保存 |
| submit_impact_proposal の呼び出しがない | 調査失敗として扱い、エラーメッセージを返却 |
| DB保存失敗 | トランザクションをロールバック、エラーログ保存 |

```typescript
try {
  const repoPath = await cloneGitHubRepository({ url: repository_url });
  const result = await agent.runTask(prompt, { tools, timeout: 300000 });

  if (!result.tool_calls?.find(t => t.name === 'submit_impact_proposal')) {
    throw new Error('影響調査結果が返却されませんでした');
  }

  const impactScopes = result.tool_calls.find(t => t.name === 'submit_impact_proposal')?.input.impact_scopes;

  await saveImpactScopes(changeRequestId, impactScopes);
  await updateStatus(changeRequestId);

  return { success: true, impact_scopes_count: impactScopes.length };
} catch (error) {
  console.error('影響調査エラー:', error);

  // エラーログをDBに保存
  await supabase.from('analysis_logs').insert({
    change_request_id: changeRequestId,
    status: 'error',
    error_message: error.message,
    error_stack: error.stack,
  });

  return { success: false, error: error.message };
} finally {
  // 一時ディレクトリをクリーンアップ
  await fs.rm(repoPath, { recursive: true, force: true });
}
```

Cloud Run前提の追加考慮:

- **タイムアウト/再試行**: Cloud Tasksの再試行で同一ジョブが重複実行されないように冪等ガードを必須化する。外部API（GitHub/LLM）失敗は指数バックオフでリトライし、最終失敗時に `analysis_logs.status=error` を残す。
- **部分成功の扱い**: `change_request_impact_scopes` 保存の途中で失敗した場合、同一job_idで再試行しても二重登録にならないよう、insert方針（upsert/削除して再作成等）を決める。
- **ログ**: Cloud Loggingに必要最小限を出し、Secrets/個人情報/リポジトリ内容の原文を出さない。

---

## 4. UIフロー

### 4.1 照会画面での操作

#### 4.1.1 「AI影響分析」ボタン
**現状**:
`components/tickets/ticket-impact-card.tsx:84-89` にボタンがあるが、onClick未実装

**変更後**:
```typescript
const handleAnalyze = async () => {
  setIsAnalyzing(true);

  try {
    const response = await fetch(`/api/tickets/${changeRequest.id}/analyze-impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repository_url: selectedRepositoryUrl }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success(`影響調査が完了しました（${result.impact_scopes_count}件の影響を検出）`);
      router.refresh(); // 画面を再読み込みして結果を表示
    } else {
      toast.error(`影響調査に失敗しました: ${result.error}`);
    }
  } catch (error) {
    toast.error('影響調査中にエラーが発生しました');
  } finally {
    setIsAnalyzing(false);
  }
};

<Button onClick={handleAnalyze} disabled={isAnalyzing}>
  {isAnalyzing ? '調査中...' : 'AI影響分析'}
</Button>
```

#### 4.1.2 調査結果の表示
調査結果は `ticket-impact-card.tsx` の既存コンポーネントで表示される。
確信度順にソートして表示する。

```typescript
const sortedScopes = impactScopes.sort((a, b) => b.confidence_score - a.confidence_score);
```

---

## 5. データモデル

### 5.1 change_request_impact_scopes テーブル

```sql
CREATE TABLE change_request_impact_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('business', 'system', 'api', 'ui', 'test')),
  target_identifier TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score NUMERIC(3, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence TEXT NOT NULL,
  suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_impact_scopes_change_request ON change_request_impact_scopes(change_request_id);
CREATE INDEX idx_impact_scopes_confidence ON change_request_impact_scopes(change_request_id, confidence_score DESC);
```

### 5.2 analysis_logs テーブル（エラーログ用）

```sql
CREATE TABLE analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'error')),
  error_message TEXT,
  error_stack TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_analysis_logs_change_request ON analysis_logs(change_request_id);
```

---

## 6. セキュリティ

### 6.1 認証・認可
- APIエンドポイントは認証必須（Supabase RLS適用）
- 変更依頼の作成者のみが影響調査を実行できる

### 6.2 GitHubアクセス
- プライベートリポジトリの場合、Personal Access Tokenが必要
- トークンはユーザー設定画面で登録（暗号化して保存）

### 6.3 レート制限
- 同一変更依頼に対して5分に1回までに制限（重複実行防止）

---

## 7. パフォーマンス

### 7.1 タイムアウト設定
- Claude Agent SDK: 5分（300秒）
- APIエンドポイント: 即時応答（202）により長時間処理を回避
- ワーカー（Cloud Run）: ジョブの上限時間と外部API制約に合わせて設定（長時間化する場合は分割/段階実行も検討）

### 7.2 最適化
- Shallow Clone（履歴不要）
- 不要なファイル除外（.git, node_modules, .next など）
- 調査結果のページング（確信度上位50件のみ表示）

---

## 8. テスト戦略

### 8.1 ユニットテスト
- `cloneGitHubRepository` のテスト（モックGitリポジトリ）
- `saveImpactScopes` のテスト（モックDB）
- エラーハンドリングのテスト

### 8.2 統合テスト
- APIエンドポイント `/api/tickets/{id}/analyze-impact` のテスト
- Claude Agent SDKのモック呼び出し

### 8.3 E2Eテスト（Playwright）
1. 照会画面を開く
2. 「AI影響分析」ボタンをクリック
3. 調査中のローディング表示を確認
4. 調査完了後、影響範囲が表示されることを確認
5. ステータスが「レビュー中」に変更されることを確認

---

## 9. マイルストーン

### Phase 1（MVP）
- [ ] APIエンドポイント実装
- [ ] GitHubリポジトリのClone実装
- [ ] Claude Agent SDK呼び出し実装
- [ ] 調査結果の保存実装
- [ ] UIボタンの実装
- [ ] エラーハンドリング実装

### Phase 2（拡張）
- [ ] リアルタイム進捗表示（WebSocket）
- [ ] 複数リポジトリの同時調査
- [ ] 調査履歴の表示
- [ ] 調査結果の差分表示（再調査時）

---

## 10. 参考資料

- PRD 6.3節: コーディングエージェント（Claude Agent SDK）の責務
- PRD 6.5.2節: 影響調査の詳細フロー
- [Claude Agent SDK ドキュメント](https://docs.anthropic.com/agent-sdk)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
