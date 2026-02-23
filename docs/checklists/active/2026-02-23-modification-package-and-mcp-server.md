# MCP Server最優先 + 改修指示パッケージ チェックリスト

## 作業概要

PRDの方針変更（1.4.1 / 6.20）に合わせ、ビジネスMVP時は「開発者がClaude Code / Codexを手動利用」前提で進める。
そのため、コーディングエージェントから要件管理DBへ直接参照できるMCP Server（最小限）を最優先で実装する。

**実装フェーズ：**
- **Phase 5（ビジネスMVP時）**: MCP Server最小限（読み取り専用ツール、シンプル認証）+ 改修指示パッケージ
- **Phase 6（PMF確認後）**: MCP Server完全版（書き込みツール、APIキー認証、レート制限、監査ログ）

優先順は「MCP最小限 -> 改修指示パッケージ運用改善 -> MCP完全版」とする。

---

## 更新対象ファイル

### 1. チェックリスト運用（このファイル）

ファイル: `docs/checklists/active/2026-02-23-modification-package-and-mcp-server.md`

#### 実装項目
- [x] Phase 5〜6の統合チェックリストを作成
- [x] 実装進捗に合わせて都度チェック更新
- [x] Phase 5-1完了時点で中間サマリを追記

#### 確認項目
- [x] 未完了タスクが明確に可視化されている

中間サマリ（Phase 5-1）:
- 生成API・生成ロジック・UI導線を実装済み
- ステータス遷移ルールを `docs/design/change-request-status-transition.md` に明文化済み
- API単体テスト（6ケース）を追加し、`bun test tests/unit/app/api/instruction-package-route.test.ts` で全件pass確認済み

---

### 2. 改修指示パッケージ生成（Phase 5-1）

ファイル: `lib/domain/value-objects.ts`, `lib/data/modification-packages.ts`, `app/api/tickets/[id]/instruction-package/route.ts`

依存: セクション3,4,5

#### 実装項目
- [x] ModificationPackage型定義を追加（PRD 6.8準拠）
- [x] 生成ロジック（allow_paths/参照要件ID/残存リスク）を実装
- [x] 既存調査結果（investigation_results）からパッケージを構築
- [x] API Route（GET/POST）を実装
- [x] 異常系レスポンス（調査未実行・疑義未解消）を実装

#### 確認項目
- [x] チケットID指定でJSONパッケージが取得できる
- [x] 条件未達（疑義あり等）で適切にエラーになる

---

### 3. チケット詳細画面の導線（Phase 5-1）

ファイル: `app/(with-sidebar)/tickets/[id]/page.tsx`, `components/tickets/generate-instruction-package-button.tsx`

#### 実装項目
- [x] 「改修指示パッケージ生成」ボタンを追加
- [x] 実行条件（status / suspect件数）で活性制御
- [x] 生成結果のダウンロード導線（json or md）を実装

#### 確認項目
- [ ] review済みチケットで生成操作できる
- [ ] 実行後にダウンロードが開始される

---

### 4. 変更要求ステータス連携（Phase 5-1）

ファイル: `lib/data/change-requests.ts`, `app/api/tickets/[id]/investigate/route.ts`

#### 実装項目
- [x] 生成前提に合わせたステータス遷移を整理
- [x] 必要なら `approved` への更新APIを追加
- [x] 影響調査完了後の遷移ルールを明文化

#### 確認項目
- [x] ステータス遷移がUIとAPIで矛盾しない

---

### 5. MCP Server - Phase 5（ビジネスMVP最小限 / 最優先）

ファイル: `app/api/mcp/route.ts`（新規）

依存: なし（最優先）

**ビジネスMVP時のスコープ**: 読み取り専用ツールのみ。認証はシンプル（project_idベース）。

#### 実装項目（Phase 5）
- [x] MCPエンドポイント雛形を実装
- [x] 最小限ツールセットを実装:
  - [x] `get_product_requirement` - PR取得
  - [x] `search_requirements` - 要件検索
  - [x] `get_requirement` - 要件詳細取得
  - [x] `get_system_function` - システム機能取得（エントリポイント含む）
- [x] シンプル認証（リクエストヘッダでproject_id受け取り）
- [x] エラーレスポンス仕様を統一

#### 確認項目（Phase 5）
- [x] project_id指定でツールが呼べる
- [x] 正本データが取得できる

---

### 6. MCP Server - Phase 6（完全版）

**PMF確認後の拡張スコープ**: 書き込みツール追加、APIキー認証、レート制限、監査ログ。

#### 実装項目（Phase 6）
- [ ] 追加ツール実装:
  - [ ] `search_concepts` - 概念辞書検索
  - [ ] `get_links` - 要件間リンク取得
  - [ ] `submit_impact_proposal` - 影響範囲候補送信
- [ ] APIキー認証（ヘッダ）を実装
- [ ] レート制限（Rate Limiting）
- [ ] 監査ログ

#### 確認項目（Phase 6）
- [ ] APIキーなしアクセスが拒否される
- [ ] APIキーありで全ツールが呼べる
- [ ] レート制限が機能する

---

### 7. テスト・検証

ファイル: `tests/unit/...`（必要箇所追加）

#### 実装項目（Phase 5）
- [x] 改修指示パッケージ生成ロジックのユニットテスト追加
- [x] MCP最小限ツールのユニットテスト追加
- [x] 主要APIハッピーパスの確認

#### 実装項目（Phase 6）
- [ ] MCP認証ガードのユニットテスト追加
- [ ] レート制限のテスト

#### 確認項目
- [x] 追加テストが通る
- [x] 既存テストに回帰がない

---

## 統合テスト

### Phase 5 フロー
- [x] 影響調査完了済みチケットでパッケージ生成できる
- [x] allow_paths / 参照要件 / residual_risks が出力される
- [x] MCP最小限ツールが動作（project_idベース認証）
- [x] 正本参照APIが最低限利用可能

### Phase 6 フロー
- [ ] MCP APIキー認証が有効
- [ ] 全MCPツールが利用可能
- [ ] レート制限・監査ログが機能

---

## 完了基準

- [x] Phase 5-1（改修指示パッケージ生成）がUI/APIで動作
- [x] Phase 5-2（MCP Server 最小限版 / 手動Claude Code・Codex運用向け）が動作
- [ ] Phase 6（MCP Server 完全版 + 認証・監査）が動作
- [x] TypeScriptエラーなし
- [x] PRDの未実装項目に対応する実装メモを残す

---

## 注記（PRD整合）

- PRDの現行定義では、`5-8` が「MCP Server（完全版）」、`5-9` は「設計決定ログ記録機能」。
- 本チェックリストで扱う改修指示パッケージ生成は、番号ではなく `Phase 5-1` として管理する。
- 6章の「Claude Agent SDKによる全自動改修」はPMF後（Phase 6以降）に適用し、ビジネスMVPでは対象外とする。
