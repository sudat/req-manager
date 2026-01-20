# 変更要求機能整備計画

## 概要

PRDの受入条件設計を見直し、「ベースライン仕様（状態）」と「変更要求（イベント）」の分離原則を徹底する。

## 問題点（Grokの分析に同意）

現在のPRD設計では、受入条件に確認状態（status/verified_by/verified_at/evidence）が混在している。しかし：

1. **概念的矛盾**: 受入条件はベースライン仕様（不変）だが、確認状態は変更要求ごとに変動する
2. **運用上の非効率**: 改修ごとにゼロベース確認が必要なのに、前回結果が残存
3. **データ構造の歪み**: 同一受入条件が複数変更要求で異なる状態を持つ可能性

## 解決策

| 区分 | 変更前 | 変更後 |
|------|--------|--------|
| 受入条件定義 | description + verification_method + status + verified_* + evidence | **description + verification_method のみ** |
| 確認状態 | 受入条件に混在 | **変更要求チケット**で版管理 |

## 実装計画

詳細チェックリスト: `docs/checklists/active/2026-01-20-change-request-feature.md`

### Phase 1: PRD設計更新
- `docs/prd.md` の 1.1.1「受入条件の確認状態」セクション修正
- 確認状態は変更要求チケットで管理と明記

### Phase 2: データベーススキーマ
新規テーブル作成：
- `change_requests` - 変更要求チケット本体
- `change_request_impact_scopes` - 影響範囲
- `change_request_acceptance_confirmations` - 受入条件確認状態

既存スキーマ変更：
- `AcceptanceCriterionJson` から status/verified_by/verified_at/evidence を除外

### Phase 3: ドメイン層
- `ChangeRequest` エンティティ定義
- `ImpactScope` 値オブジェクト定義
- `AcceptanceConfirmation` エンティティ定義
- `AcceptanceCriterionDefinition` 型（定義のみ）

### Phase 4: データアクセス層
リポジトリ作成：
- `change-request-repository.ts`
- `impact-scope-repository.ts`
- `acceptance-confirmation-repository.ts`

### Phase 5: UI実装
- `/tickets` 配下のページをモックからDB連携へ
- `acceptance-confirmation-panel.tsx` 新規作成
- `structured-acceptance-criteria-input.tsx` 簡素化

### Phase 6: 統合テスト
- E2Eフロー検証（起票→影響範囲確定→受入確認→完了判定）
- 北極星KPI判定の検証

## 修正対象ファイル

### 必須
- `docs/prd.md`
- `lib/data/structured.ts`
- `lib/domain/entities.ts`
- `lib/domain/value-objects.ts`
- `supabase/migrations/` (新規4ファイル)
- `lib/repositories/` (新規3ファイル)
- `app/tickets/page.tsx`
- `app/tickets/create/page.tsx`
- `app/tickets/[id]/page.tsx`
- `components/structured-acceptance-criteria-input.tsx`
- `components/acceptance-confirmation-panel.tsx` (新規)

## 難易度

```
難易度: ★★☆
根拠: 10+ files, 500+ lines, 4 components（DB/Domain/Repository/UI）
リスク: 既存データのマイグレーション、PRDとの整合性維持
```

## 検証方法

1. **単体テスト**: 各リポジトリのCRUD操作
2. **統合テスト**: Playwright MCPで変更要求フロー検証
3. **データ整合性**: 受入条件定義に確認状態が混在していないことを確認
4. **北極星KPI**: 変更要求単位での「全受入条件確認済みOK」判定

## 次のアクション

Phase 1から順次実装。まずPRDの設計修正から着手し、設計が固まってからスキーマ・コード実装へ進む。
