# MCPガードモード設計（APIキー認証 / レート制限）

## 1. 目的

MCP API（`/api/mcp`）に対して、以下を段階的に適用できるようにする。

- APIキー認証（不正アクセス防止）
- レート制限（暴走・過負荷防止）

ただし、導入初期に「ガード実装の不具合で利用不能」になるリスクを避けるため、
**モード切替で fail-safe に運用できる**ことを必須とする。

## 2. モード定義

`MCP_GUARD_MODE` で制御する。

- `off`
  - ガードを評価しない（常に通過）
  - 緊急時の退避モード
- `observe`（デフォルト）
  - ガードを評価するが、失敗しても通過させる
  - ログに「would block」を出して影響を観測する
- `enforce`
  - ガード失敗時は拒否する
  - APIキー不正/欠落は `401`
  - レート超過は `429`

## 3. 対象エンドポイント

- `/api/mcp` の `tools/call`（JSON-RPC）
- `/api/mcp` の simple call（`{ tool, args }`）

`initialize` / `tools/list` は現時点では読み取り系メタ情報のため対象外。

## 4. 環境変数

- `MCP_GUARD_MODE`
  - `off | observe | enforce`
  - 未指定時は `observe`
- `MCP_API_KEY`
  - 単一キー
- `MCP_API_KEYS`
  - 複数キー（`,`区切り）
  - `MCP_API_KEYS` が優先
- `MCP_RATE_LIMIT_WINDOW_MS`
  - レート制限ウィンドウ（ms）
  - デフォルト: `60000`
- `MCP_RATE_LIMIT_MAX_REQUESTS`
  - 1ウィンドウあたり最大リクエスト数
  - デフォルト: `60`

## 5. レート制限キー

レート制限は以下の組み合わせで判定する。

- `project_id`
- クライアント識別子（`x-forwarded-for` → `x-real-ip` → `unknown`）

キー例: `project-1:10.0.0.1`

## 6. 運用方針（MVP）

ビジネスMVPでは **`observe` で開始**する。

- まずは実トラフィックで誤検知率を確認
- 誤検知や運用課題が収束したら `enforce` に切替
- 障害時は `off` で即時退避可能

## 7. 移行手順

1. `observe` で運用開始
2. ログを確認して誤ブロック候補を修正
3. 一部環境で `enforce` を検証
4. 問題なければ本番を `enforce` に昇格
5. 障害時のみ一時的に `off` へ退避

## 8. 設計原則

- `KISS`: ガードは route 内で最小構成（複雑な外部依存なし）
- `YAGNI`: 永続ストア型レート制限は現時点で導入しない（MVP段階では不要）
- `DRY`: APIキー判定とレート判定を共通関数化し、JSON-RPC/simple callで再利用

## 9. 監査ログ仕様（MVP確定）

### 9.1 目的

- 追跡性: 「誰が・いつ・どのツールを呼んだか」を後から確認できるようにする
- 障害解析: 認証失敗・レート制限超過の原因を特定しやすくする
- 監査対応: 運用説明時の証跡を残す

### 9.2 記録対象

- `/api/mcp` の `tools/call`（JSON-RPC）
- `/api/mcp` の simple call（`{ tool, args }`）

`initialize` / `tools/list` は記録対象外（情報取得のみのため）。

### 9.3 保存先（MVP）

MVPは以下の二重化で保存する。

- 構造化アプリログ（stdout / Cloud Logging）
- DB永続化（`public.mcp_audit_logs`）

障害解析はアプリログを一次ソースとし、監査・検索用途はDBを主に利用する。

### 9.4 ログ項目（必須）

- `event`: `"mcp_audit"`
- `timestamp`: ISO8601
- `request_id`: リクエスト相関ID（あれば）
- `project_id`
- `tool_name`
- `transport`: `"jsonrpc"` or `"simple"`
- `guard_mode`: `off|observe|enforce`
- `auth_result`: `pass|fail|skipped`
- `rate_limit_result`: `pass|fail|skipped`
- `status_code`
- `duration_ms`

### 9.5 マスキング方針

- APIキー、Authorizationヘッダ、機密トークンは絶対に記録しない
- `args` の生データは原則記録しない（必要時は項目名のみ）
- エラーログにも秘密情報を含めない

### 9.6 障害時の扱い

- 監査ログ出力に失敗しても、MCP本処理は継続する（fail-open）
- ログ失敗は `warn` レベルで記録する

### 9.7 運用ポリシー

- `observe` 期間中は `would block` 件数を監視し、誤検知を先に潰す
- `enforce` 昇格前に、主要クライアントで疎通確認を行う
