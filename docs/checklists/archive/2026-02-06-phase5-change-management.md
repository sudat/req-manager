# Phase 5: 変更管理と連携 - M5マイルストーン実装

> 開始日: 2026-02-06
> スコープ: Phase 5 MVP (5-1, 5-3, 5-4, 5-5, 5-6, 5-7, 5-8)
> 拡張分離: 5-9 改修指示パッケージ, 5-10 設計決定ログ

---

## Phase A: DB Foundation (先行)

- [x] 5-1a: investigation_results マイグレーション SQL 作成
- [x] 5-1b: InvestigationResult 型定義 (value-objects.ts)
- [x] 5-1c: investigation-results.ts データアクセス層
- [x] 5-1d: lib/data/index.ts に export 追加

## Phase B: 並行実装グループ

### B1: Mastra Tool拡張 (5-8)
- [x] 8a: get_product_requirement Tool 実装
- [x] 8b: search_requirements Tool に dd 検索タイプ追加
- [x] 8c: tools/index.ts + requirements-agent.ts に登録

### B2: impact_analysis Tool (5-3)
- [x] 3a: listSfIdsByBrId クエリ追加 (requirement-links.ts)
- [x] 3b: impact_analysis Tool 実装 (impact-analysis.ts)
- [x] 3c: tools/index.ts + requirements-agent.ts に登録

### B3: エクスポート機能 (5-7)
- [x] 7a: requirements-export.ts エクスポート生成ロジック
- [x] 7b: app/api/export/requirements/route.ts API
- [x] 7c: export/page.tsx に 7章形式エクスポートカード追加

## Phase C: 並行UI実装グループ

### C1: 疑義リンク管理UI (5-4)
- [x] 4a: resolveSuspectLink ラッパー (requirement-links.ts)
- [x] 4b: suspect-link-action-bar.tsx コンポーネント
- [x] 4c: suspect-link-card.tsx コンポーネント

### C2: 疑義リンク受信箱UI (5-5)
- [x] 5a: suspect-inbox/page.tsx ページ
- [x] 5b: sidebar.tsx に受信箱メニュー追加
- [x] 5c: dashboard/page.tsx に疑義リンク件数バッジ追加

## Phase E: 統合画面 (5-6 CR詳細画面拡張)

- [x] 6a: investigate/route.ts API + CR詳細画面に「影響調査開始」ボタン
- [x] 6b: ticket-investigation-result-card.tsx 影響調査結果カード
- [x] 6c: ticket-suspect-links-card.tsx 疑義リンクカード
- [x] 6d: tickets/[id]/page.tsx に拡張コンポーネント統合

## 検証

- [x] TSC (--noEmit) → Phase 5のエラー全解消（既存3件のみ残存）
- [x] M5 動作確認チェックリスト全項目パス
