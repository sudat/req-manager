# DB検索設計（search_requirements）

## 目的
`/chat` の検索（`search_requirements`）を **MCP経由のDB検索** に切り替え、ヒット率と再現性を上げる。

## 適用原則
- KISS: MCPはstdio接続＋1ツールに限定
- DRY: 検索ロジックはDB関数 `search_requirements_v2` に集約
- YAGNI: ベクトル検索は今回は導入しない

## 構成
- **DB側**: `search_requirements_v2` 関数 + `pg_trgm` + インデックス
- **MCPサーバ**: Supabase MCP（ホスト型、HTTP）
- **MCPクライアント**: `lib/mcp/search-client.ts`
- **Mastra Tool**: `lib/mastra/tools/search-requirements.ts`（MCP優先・失敗時フォールバック）

## 検索対象
BT / BR / SF / SR の4系統。
検索対象カラムは以下。

- BT: `id`, `name`, `summary`
- BR: `id`, `title`, `goal`, `task_id`
- SF: `id`, `title`, `summary`
- SR: `id`, `title`, `summary`

## DB検索ロジック（search_requirements_v2）
ID形式のクエリ（`BT-` / `BR-` / `SF-` / `SR-` で始まる場合）は、
**前方一致のみ返す**（類似検索を抑制）。
それ以外は「ID前方一致 > 部分一致 > 類似度」の順。
`pg_trgm` の `similarity()` を併用し、表記ゆれを吸収する。

スコア付け（概略）:
- `id ilike '{query}%'` は最高点
- `title/name` は高め、`summary/goal` は中程度
- `similarity()` は 0.2 を閾値に採用

返却結果は `result jsonb, score real` で、最終的に **score降順** で並べる。

## MCPツール利用方針
Supabase MCP の `execute_sql` を使用して `search_requirements_v2` を呼び出す。
SQL側で `result` を返し、アプリは結果を整形して返却する。

## フォールバック
MCPが起動できない／DB接続不可の場合は、従来の Supabase クライアント検索にフォールバックする。

## マイグレーション
ファイル: `supabase/migrations/20260205090000_search_requirements_v2.sql`

含まれる内容:
- `pg_trgm` 拡張の有効化
- 各テーブルに `text_pattern_ops` / `gin_trgm_ops` インデックス追加
- `search_requirements_v2` 関数追加

## 必須環境変数
Supabase MCP の接続URLを指定する。

- `MCP_SEARCH_SERVER_URL`（例: `https://mcp.supabase.com/mcp?...`）

任意:
- `SUPABASE_ACCESS_TOKEN`（Bearerで送信）
- `MCP_SEARCH_SERVER_HEADERS`（JSONで追加ヘッダを指定）
- `MCP_SEARCH_TOOL_NAME`（デフォルト: `execute_sql`）

## 制約・注意
- Supabase MCPは **HTTP接続** 前提。
- MCP側で `execute_sql` が利用可能であることが前提。
- 検索の上限は `limit <= 50`。

## 今後の拡張余地
- ベクトル検索（pgvector）の併用
- スコアリングの学習型調整
- SR/SFでのエントリポイント（entry_points）検索の追加
