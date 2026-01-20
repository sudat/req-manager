# Phase6（PRD v1.3）E2E 実行メモ（2026-01-19）

## 実行環境
- URL: `http://localhost:3000`
- データ方針: 既存データを使用
- cleanup方針: 破壊的な削除はせず、必要箇所のみ更新

※ `bun run dev -- --port 3000` はポート使用中で起動失敗（`EADDRINUSE`）。ただし既存の `localhost:3000` が稼働しており、E2Eは継続可能だった。

## 対象ID（固定）
- `businessId`: `BIZ-001`
- `taskId`: `TASK-001`
- `systemDomainId`: `AR`
- `srfId`（system function）:
  - CRUD: `SRF-006`
  - legacy互換: `SRF-001`

## 実施結果（チェックリスト対応）

### シナリオ1: 業務要件CRUD（priority/受入条件）
- 対象: `BR-TASK-001-001`
- 変更: `priority` を `Could` に変更、構造化受入条件の `evidence` を追記
- 保存→詳細表示→再読込で保持を確認

### シナリオ2: システム要件CRUD（category/business_requirement_ids/受入条件）
- 対象: `SR-TASK-001-002`
- 変更: `category` を `auth` に変更、`businessRequirementIds` を2件紐付け、構造化受入条件を1件追加（verification/status/evidence埋め）
- 保存→詳細表示→再読込で保持を確認
- 付随: タスクヘルススコアが `78 → 86` に改善（紐付け欠損が解消）

### シナリオ3: システム機能CRUD（entry_points）
- 対象: `SRF-006`
- 変更: `entry_points` に `path=/ar/credit-limits/{customerId}` を追加（type=api, responsibility=与信枠変更申請）
- 保存→詳細表示→再読込で保持を確認

### シナリオ4: 互換（legacyのみのデータ）
- `BR-TASK-001-002` / `SR-TASK-001-001`:
  - DBで `acceptance_criteria_json=[]` にして legacy `acceptance_criteria(text[])` のみの状態を作成
  - 詳細表示が崩れないこと、保存しても破綻しないことを確認
- `SRF-001`:
  - DBで `entry_points=[]` にして legacy `code_refs.paths` のみの状態を作成
  - 詳細でエントリポイントがフォールバック表示されること、保存しても破綻しないことを確認

### シナリオ5: ヘルススコア/警告（回帰）
- ダッシュボード/タスク詳細/システム機能詳細でヘルススコア表示を確認
- 修正操作によりスコアが改善することを確認（例: タスク `78 → 86`）

## 証跡（スクショ）
- `./.playwright-mcp/phase6-20260119-*.png`

## コンソール/注意点
- SelectionDialog オープン時に `DialogContent` の a11y 警告が出ることがある（`Missing Description or aria-describedby`）。再現: タスク編集で「業務要件」→「選択」ダイアログを開く。
- 重大なコンソールエラー／ネットワークエラーは目視上なし（警告は上記のみ）。

