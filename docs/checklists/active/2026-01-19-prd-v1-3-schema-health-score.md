# PRD v1.3 実装（スキーマ拡張・受入条件構造化・ヘルススコア）チェックリスト

## 作業概要
`docs/prd.md`（最終更新: 2026-01-19）の追加・変更点（優先度/受入条件の構造化/エントリポイント/ヘルススコア）を、既存のSupabase + Next.js実装に段階導入で反映する。

---

## 概要計画（高レベル）
※細部は次フェーズで詰める。依存関係の都合で「DB → データ層 → 画面 → 品質監視」の順を推奨。

### 1) DBテーブル修正（Supabase）
- [x] `business_requirements` に `priority` を追加
- [x] 業務要件の受入条件を構造化（Phase 1: `acceptance_criteria_json` 追加で段階移行、legacy `acceptance_criteria(text[])` は残置）
- [x] `system_requirements` に `category` と `business_requirement_ids` を追加
- [x] システム要件の受入条件を構造化（Phase 1: `acceptance_criteria_json` 追加で段階移行、legacy `acceptance_criteria(text[])` は残置）
- [x] `system_functions` に `entry_points`（path/type/responsibility）を追加（Phase 1: `code_refs.paths` から `path` を暫定移行、`type/responsibility` は後続で入力）

### 2) データアクセス層修正（`lib/data/*`）
- [x] `BusinessRequirement`/`SystemRequirement`/`SystemFunction` の型・Row変換・CRUDを新スキーマに追従
- [x] 既存UIが壊れないように暫定互換（旧データの読み取り/表示）方針を決める

### 3) 画面修正（フォーム・詳細表示）
- [x] 業務要件: `priority` 入力、受入条件（構造化）の表示/編集
- [x] システム要件: `category` 入力、`business_requirement_ids` 表示/編集、受入条件（構造化）の表示/編集
- [x] システム機能: `entry_points` の表示/編集（責務/種別/パス）

### 4) バックエンド/ロジック修正（品質監視）
- [x] スコアリング仕様の確定（対象エンティティ/項目/重み/閾値/表示ルール）
- [x] 欠損・不整合の検出ルール確定（例: `responsibility` null/空、受入条件0件など）
- [x] スコア計算ロジック実装（DRY: 共通の集計/判定関数に寄せる）
- [x] 算出場所の決定（KISS: まずはアプリ側で算出 → 必要ならDB集計/RPCへ）
- [x] UI表示（一覧/カードにスコア・警告バッジ、詳細に内訳）
- [x] 最小テスト（スコア関数の単体 or スモーク）

### 5) 既存データ移行・seed整備
- [x] 既存 `acceptance_criteria: text[]` を新形式に変換して移行（Phase 1: `acceptance_criteria_json` へバックフィル）
- [x] `code_refs` 由来のパスを `entry_points` に暫定移行（type/responsibilityは手入力 or 既定値）
- [ ] 必要性判定（YAGNI: `lib/mock/data` がseed/画面で使われている範囲だけ更新する）
- [ ] 参照箇所棚卸し（`lib/mock/data/*` をimportしている画面/seed導線）
- [ ] 追加スキーマとの差分確認（KISS: default列で吸収できるなら無理に埋めない）
- [ ] （必要な場合のみ）`lib/mock/data/*` を最小更新（SystemFunctionの `entryPoints` など）

### 6) 動作確認（E2E優先）
- [ ] 実行環境確認（dev server起動、認証/ENV、テスト用データ方針、cleanup）
- [ ] シナリオ: 業務要件CRUD（`priority`/受入条件の表示・編集・再読込）
- [ ] シナリオ: システム要件CRUD（`category`/`business_requirement_ids`/受入条件の表示・編集・再読込）
- [ ] シナリオ: システム機能CRUD（`entry_points` の表示・編集・再読込）
- [ ] シナリオ: 互換（legacyのみのデータ表示→保存で破綻しない）
- [ ] 証跡（スクショ/ログ/再現手順）を残す（Playwright MCP）
  - ※Phase 3範囲の確認は実施済み。Phase 5完了後に再実施。
- [ ] （任意）自動テスト/CI化（YAGNI: まずは手動E2Eで十分なら後回し）

### 7) 運用ガードレール（目的に対する積み残し）
- [ ] 受入条件lint（検証可能性の警告）を実装し、UIに表示する（KISS: 警告のみでブロックしない）
- [ ] ヘルススコアにlint警告を反映する（DRY: lint結果をスコア/一覧/詳細で再利用）
- [ ] 互換列の収束方針を決める（`acceptance_criteria` / `code_refs` の二重書きの終了条件とタイミング）（YAGNI: すぐ削除しない）

---

## 直近詳細計画
- [x] [Phase 1: DBテーブル修正（Supabase）](2026-01-19-prd-v1-3-phase1-db-schema.md)
- [x] [Phase 2: データアクセス層修正（lib/data/*）](2026-01-19-prd-v1-3-phase2-data-layer.md)
- [x] [Phase 3: 画面修正（フォーム・詳細表示）](2026-01-19-prd-v1-3-phase3-ui-forms.md)
- [x] [Phase 4: ヘルススコア（品質監視）](2026-01-19-prd-v1-3-phase4-health-score.md)
- [ ] [Phase 5: 既存データ移行・seed整備](2026-01-19-prd-v1-3-phase5-seed-mock-data.md)
