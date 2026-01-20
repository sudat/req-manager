# 変更要求機能整備チェックリスト

## 課題認識と対処

### 問題の所在
業務要件・システム要件に受入条件の確認状態を記載することについて、概念的な疑義がある。
受入条件自体は要件定義として正当だが、確認状態（未確認/確認済み(OK)/確認済み(NG)）は変更要求ごとに変動する性質を持ち、ベースライン仕様としての要件定義に記載するのは不適合である。

### 現在の設計の問題点
PRDでは受入条件に確認状態を混在させているが、これは以下の矛盾を生む：
- 概念的混乱：不変の要件定義に変動的な確認結果を混在
- 運用上の非効率：改修ごとにゼロベース確認が必要なのに、前回結果が残存
- データ構造の歪み：同じ受入条件が複数変更要求で異なる状態を持つ可能性

### 提案する解決策
受入条件の定義と確認状態を分離し、確認状態を変更要求チケットで管理する：
- ベースライン仕様：受入条件の定義（description/verification_method）
- 変更要求チケット：確認状態の追跡（status/verified_by/verified_at/evidence）

### 変更要求チケット機能の役割整理
変更要求チケットは「イベント」として機能し、以下の役割を担う：
- 影響範囲の確定：変更対象の業務要件・システム要件・受入条件を特定
- 確認状態の追跡：影響範囲に紐づく受入条件の確認状態を版管理
- 成功状態の判定：北極星KPI（全受入条件が確認済み(OK)）の達成確認
- 履歴管理：変更要求ごとの確認履歴を保持

### 当機能に確認状態を記載する方向の妥当性
この設計変更により、以下の問題がすべて解消される：
1. 概念的一貫性：受入条件は不変の定義、確認状態は変動的な結果として明確分離
2. 運用効率：変更要求ごとに独立した確認状態管理が可能、ゼロベース確認が自然
3. KPI達成：変更要求適用後の確認状態で北極星KPI判定可能
4. フェーズ実現：受入確認フェーズ（H）でチェックリスト的確認が可能
5. 品質監視：ヘルススコアの確認率算出が変更要求単位で実現
また、受入条件定義変更時の影響も最小化でき、複数変更要求での重複確認も効率的に管理できる。

### 結論
受入条件から確認状態を分離し、変更要求チケットで版管理する設計が、概念的・運用的に優位である。PRDの設計見直しを推奨する。


## 作業概要

受入条件の設計見直し（定義と確認状態の分離）と、変更要求機能の実装を行う。
Grokの分析に基づき、PRDの「ベースライン仕様（状態）」と「変更要求（イベント）」の分離原則を徹底する。

### 設計変更の核心

| 区分 | 変更前 | 変更後 |
|------|--------|--------|
| 受入条件定義 | description + verification_method + **status** + verified_by + verified_at + evidence | description + verification_method のみ |
| 確認状態 | 受入条件に混在 | **変更要求チケット**で版管理 |

### 難易度

```
難易度: ★★☆
根拠: 10+ files, 500+ lines, 4 components（DB/Domain/Repository/UI）
リスク: 既存データのマイグレーション、PRDとの整合性維持
```

---

## Phase 1: PRD設計更新

### 1.1 PRD文書の修正
**ファイル**: `docs/prd.md`

#### 実装項目
- [x] 1.1.1「受入条件の確認状態」セクションを修正
  - 確認状態は「変更要求チケットで管理」と明記
  - 受入条件定義には description + verification_method のみ保持
- [x] 北極星KPIの定義を明確化（変更要求単位での判定を強調）
- [x] 2.7 用語定義に「受入条件確認」を追加
- [x] 4.2.1 変更要求セクションに「受入条件確認状態の追跡」機能を詳細化

#### 確認項目
- [x] PRDの「ベースライン仕様」と「変更要求」の分離原則が一貫している
- [x] 北極星KPIの判定フローが明確である

---

## Phase 2: データベーススキーマ

### 2.1 受入条件構造の簡素化
**ファイル**: `supabase/migrations/YYYYMMDD_simplify_acceptance_criteria.sql`

> **注記**: Phase 2ではデータ構造の変更のみを行い、UIからの削除も実施済み。

#### 実装項目
- [x] `AcceptanceCriterionJson` から status/verified_by/verified_at/evidence を除外（型定義修正）
- [x] UIコンポーネントから確認状態フィールドを削除
- [x] 既存データの移行スクリプト作成（確認状態データは別テーブルへ退避）
  - **注記**: 不要（アプリ層で確認状態フィールドを無視する設計のため）

#### 確認項目
- [x] TypeScriptビルドが成功する
- [x] 既存の受入条件データが保持されている（DB確認済み: business_requirements 53行, system_requirements 56行）
- [x] 新構造が適用されている

---

### 2.2 変更要求テーブル作成
**ファイル**: `supabase/migrations/20260120000000_prd_v1_3_phase2_change_requests.sql`

> **注記**: Phase 2では3つのテーブルを1つのマイグレーションファイルに統合して作成済み。

#### 実装項目
- [x] `change_requests` テーブル作成
  ```sql
  - id: uuid PRIMARY KEY
  - ticket_id: text UNIQUE NOT NULL (CR-001形式)
  - title: text NOT NULL
  - description: text
  - background: text (背景・目的)
  - expected_benefit: text (期待効果)
  - status: text NOT NULL (open/review/approved/applied)
  - priority: text NOT NULL (low/medium/high)
  - requested_by: text
  - created_at, updated_at: timestamp
  ```
- [x] インデックス作成（ticket_id, status, created_at）
- [x] updated_at自動更新トリガー

#### 確認項目
- [x] マイグレーションファイルを作成済み
- [x] テーブルが正しく作成される（Supabase MCP確認済み: change_requests テーブル存在）
- [x] RLSポリシーが適用されている
  - **対象外**: 認証なしアプリのため RLS ポリシー不要

---

### 2.3 影響範囲テーブル作成
**ファイル**: `supabase/migrations/20260120000000_prd_v1_3_phase2_change_requests.sql`

#### 実装項目
- [x] `change_request_impact_scopes` テーブル作成
  ```sql
  - id: uuid PRIMARY KEY
  - change_request_id: uuid REFERENCES change_requests ON DELETE CASCADE
  - target_type: text (business_requirement/system_requirement/system_function/file)
  - target_id: text (BR-xxx, SR-xxx, SF-xxx, or file path)
  - target_title: text
  - rationale: text (なぜ影響があるか)
  - confirmed: boolean DEFAULT false
  - confirmed_by: text
  - confirmed_at: timestamp
  - created_at, updated_at: timestamp
  ```
- [x] CHECK制約（target_type）
- [x] インデックス作成（change_request_id, target_type+target_id）
- [x] updated_at自動更新トリガー

#### 確認項目
- [x] マイグレーションファイルに含まれている
- [x] 外部キー制約が正しく機能する（Supabase MCP確認済み: FK制約が機能）
- [x] 影響範囲の種別が適切に分類できる（CHECK制約で制限済み）

---

### 2.4 受入条件確認状態テーブル作成
**ファイル**: `supabase/migrations/20260120000000_prd_v1_3_phase2_change_requests.sql`

#### 実装項目
- [x] `change_request_acceptance_confirmations` テーブル作成
  ```sql
  - id: uuid PRIMARY KEY
  - change_request_id: uuid REFERENCES change_requests ON DELETE CASCADE
  - acceptance_criterion_id: text NOT NULL (AC-xxx)
  - acceptance_criterion_source_type: text (business_requirement/system_requirement)
  - acceptance_criterion_source_id: text (BR-xxx/SR-xxx)
  - acceptance_criterion_description: text (非正規化、参照元削除時も保持)
  - acceptance_criterion_verification_method: text (非正規化)
  - status: text NOT NULL (unverified/verified_ok/verified_ng)
  - verified_by: text
  - verified_at: timestamp
  - evidence: text
  - created_at, updated_at: timestamp
  ```
- [x] ユニーク制約: (change_request_id, acceptance_criterion_id)
- [x] CHECK制約（status, source_type）
- [x] インデックス作成（change_request_id, source, status）
- [x] updated_at自動更新トリガー

#### 確認項目
- [x] マイグレーションファイルに含まれている
- [x] 同一変更要求内で受入条件IDが重複しない（複合ユニーク制約確認済み）
- [x] 確認状態の履歴が追跡できる（created_at, updated_at 存在確認済み）

---

## Phase 3: ドメイン層

### 3.1 受入条件型の簡素化
**ファイル**: `lib/data/structured.ts`

> **注記**: Phase 2で実装済み。

#### 実装項目
- [x] `AcceptanceCriterionJson` から status/verified_by/verified_at/evidence を削除
- [x] `defaultAcceptanceCriterion` 関数を更新
- [x] `normalizeAcceptanceCriteriaJson` 関数を更新

#### 確認項目
- [x] 型定義がPRDの設計と一致している
- [x] TypeScriptビルドが成功する

---

### 3.2 変更要求エンティティ作成
**ファイル**: `lib/domain/value-objects.ts`

> **注記**: Phase 2で実装済み（value-objects.tsに追加）。

#### 実装項目
- [x] `ChangeRequest` インターフェースを正式定義
  ```typescript
  interface ChangeRequest {
    id: string;
    ticketId: string; // CR-001
    title: string;
    description: string | null;
    background: string | null;
    expectedBenefit: string | null;
    status: ChangeRequestStatus;
    priority: ChangeRequestPriority;
    requestedBy: string | null;
    createdAt: string;
    updatedAt: string;
  }
  ```
- [x] `ChangeRequestStatus` 型定義 (open/review/approved/applied)
- [x] `ChangeRequestPriority` 型定義 (low/medium/high)

#### 確認項目
- [x] 型定義がDBスキーマと一致している
- [x] 既存の `Ticket` 型との整合性を確認（移行 or 置換の判断）
  - Ticket と ChangeRequest は同一概念（変更要求チケット）
  - 置換（移行）が必要と判断

---

### 3.3 影響範囲値オブジェクト作成
**ファイル**: `lib/domain/value-objects.ts`

> **注記**: Phase 2で実装済み。

#### 実装項目
- [x] `ImpactScope` インターフェース定義
  ```typescript
  interface ImpactScope {
    id: string;
    changeRequestId: string;
    targetType: 'business_requirement' | 'system_requirement' | 'system_function' | 'file';
    targetId: string;
    targetTitle: string;
    rationale: string | null;
    confirmed: boolean;
    confirmedBy: string | null;
    confirmedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
  ```
- [x] `ImpactScopeTargetType` 型定義

#### 確認項目
- [x] 影響範囲の種別がDBスキーマと一致している

---

### 3.4 受入条件確認エンティティ作成
**ファイル**: `lib/domain/value-objects.ts`

> **注記**: Phase 2で実装済み。

#### 実装項目
- [x] `AcceptanceConfirmation` インターフェース定義
  ```typescript
  interface AcceptanceConfirmation {
    id: string;
    changeRequestId: string;
    acceptanceCriterionId: string;
    acceptanceCriterionSourceType: 'business_requirement' | 'system_requirement';
    acceptanceCriterionSourceId: string;
    acceptanceCriterionDescription: string;
    acceptanceCriterionVerificationMethod: string | null;
    status: 'unverified' | 'verified_ok' | 'verified_ng';
    verifiedBy: string | null;
    verifiedAt: string | null;
    evidence: string | null;
    createdAt: string;
    updatedAt: string;
  }
  ```
- [x] `AcceptanceCriterionSourceType` 型定義
- [x] `AcceptanceConfirmationStatus` 型定義

#### 確認項目
- [x] ステータスの3状態がDBスキーマと一致している

---

## Phase 4: データアクセス層

### 4.1 変更要求リポジトリ作成
**ファイル**: `lib/data/change-requests.ts`

> **注記**: 2026-01-20 完了済み。既存の `business-requirements.ts` パターンに準拠。

#### 実装項目
- [x] `listChangeRequests()` - 変更要求一覧取得
- [x] `getChangeRequestById(id)` - 変更要求詳細取得
- [x] `getChangeRequestByTicketId(ticketId)` - チケットIDから取得
- [x] `createChangeRequest(input)` - 変更要求作成
- [x] `updateChangeRequest(id, input)` - 変更要求更新
- [x] `deleteChangeRequest(id)` - 変更要求削除
- [x] `updateChangeRequestStatus(id, status)` - ステータス更新
- [x] `listChangeRequestsByStatus(status)` - ステータスでフィルタ
- [x] `listChangeRequestsByPriority(priority)` - 優先度でフィルタ

#### 確認項目
- [x] TypeScriptビルドが成功する
- [x] CRUD操作が正常に動作する（動作確認完了: verify-phase4-repositories.ts 9テストパス）

---

### 4.2 影響範囲リポジトリ作成
**ファイル**: `lib/data/impact-scopes.ts`

> **注記**: 2026-01-20 完了済み。

#### 実装項目
- [x] `listImpactScopesByChangeRequestId(changeRequestId)` - 変更要求の影響範囲取得
- [x] `createImpactScope(input)` - 影響範囲追加（単件）
- [x] `createImpactScopes(inputs)` - 影響範囲追加（複数）
- [x] `updateImpactScope(id, input)` - 影響範囲更新
- [x] `confirmImpactScope(id, confirmedBy)` - 影響範囲確定
- [x] `deleteImpactScope(id)` - 影響範囲削除（単件）
- [x] `deleteImpactScopesByChangeRequestId(changeRequestId)` - 変更要求の影響範囲を全削除

#### 確認項目
- [x] TypeScriptビルドが成功する
- [x] 影響範囲の追加・削除が正常に動作する（動作確認完了: verify-phase4-repositories.ts 9テストパス）

---

### 4.3 受入条件確認リポジトリ作成
**ファイル**: `lib/data/acceptance-confirmations.ts`

> **注記**: 2026-01-20 完了済み。

#### 実装項目
- [x] `listAcceptanceConfirmationsByChangeRequestId(changeRequestId)` - 変更要求の確認状態一覧取得
- [x] `createAcceptanceConfirmation(input)` - 確認状態追加（単件）
- [x] `createAcceptanceConfirmations(inputs)` - 確認状態追加（複数）
- [x] `updateAcceptanceConfirmation(id, input)` - 確認状態更新
- [x] `updateAcceptanceConfirmationStatus(id, status, verifiedBy, evidence?)` - 確認状態更新
- [x] `deleteAcceptanceConfirmation(id)` - 確認状態削除（単件）
- [x] `deleteAcceptanceConfirmationsByChangeRequestId(changeRequestId)` - 変更要求の確認状態を全削除
- [x] `getAcceptanceConfirmationCompletionStatus(changeRequestId)` - 北極星KPI判定用の完了状態取得

#### 確認項目
- [x] TypeScriptビルドが成功する
- [x] 確認状態の更新が正常に動作する（動作確認完了: verify-phase4-repositories.ts 14テストパス）
- [x] 北極星KPI（全確認済みOK）の判定が正しく動作する（動作確認完了: verify-phase4-repositories.ts 9テストパス）

---

## Phase 5: UI実装

### 5.1 受入条件入力コンポーネント修正
**ファイル**: `components/forms/StructuredAcceptanceCriteriaInput.tsx`

> **注記**: Phase 2で実装済み。

#### 実装項目
- [x] status/verified_by/verified_at/evidence フィールドを削除
- [x] description + verification_method のみの入力UIに簡素化
- [x] 不要なimportを削除（DatePicker, Textarea, date-fns）

#### 確認項目
- [x] TypeScriptビルドが成功する
- [x] 業務要件・システム要件の編集画面で正常に動作する（動作確認完了: Playwrightで受入条件入力フォームを確認）

---

### 5.2 変更要求一覧ページ実装
**ファイル**: `app/tickets/page.tsx`

> **注記**: 2026-01-20 完了済み。

#### 実装項目
- [x] モックデータからDBデータへ切り替え
- [x] フィルタ機能実装（ステータス、検索）
- [x] 削除機能実装（確認ダイアログ付き）
- [x] 北極星KPI達成状況の表示（確認済み率）- Phase 5.7.3で実装済み

#### 確認項目
- [x] 一覧が正しく表示される
- [x] フィルタが正常に動作する
- [x] TypeScriptビルドが成功する
- [x] Playwrightで基本表示を確認

---

### 5.3 変更要求作成ページ実装
**ファイル**: `app/tickets/create/page.tsx`

> **注記**: 2026-01-20 完了済み。

#### 実装項目
- [x] フォームの永続化実装（DB保存）
- [x] ticketId自動生成
- [x] バリデーション実装（必須項目）
- [x] 影響範囲の選択UI - Phase 5.7.1で実装済み

#### 確認項目
- [x] 変更要求が正しく保存される
- [x] 作成後詳細ページへ遷移する
- [x] TypeScriptビルドが成功する

---

### 5.4 変更要求詳細ページ実装
**ファイル**: `app/tickets/[id]/page.tsx`

> **注記**: 2026-01-20 完了済み。

#### 実装項目
- [x] モックデータからDBデータへ切り替え
- [x] 影響範囲表示（簡易実装）
- [x] 北極星KPI達成状況の表示
- [x] 影響範囲確定UI - Phase 5.7.2で実装済み
- [x] 受入条件確認状態表示・更新UI（acceptance-confirmation-panel.tsx 実装済み）

#### 確認項目
- [x] 詳細が正しく表示される
- [x] 受入条件確認パネルが表示される
- [x] TypeScriptビルドが成功する
- [x] Playwrightで基本表示を確認

---

### 5.5 変更要求編集ページ実装
**ファイル**: `app/tickets/[id]/edit/page.tsx`

> **注記**: 2026-01-20 完了済み。

#### 実装項目
- [x] モックデータからDBデータへ切り替え
- [x] 基本フィールドの編集（タイトル、背景、説明、期待効果）
- [x] ステータス/優先度変更
- [x] 影響範囲の編集 - Phase 5.7.1で実装済み

#### 確認項目
- [x] 編集が正しく保存される
- [x] 更新後詳細ページへ遷移する
- [x] TypeScriptビルドが成功する

---

### 5.6 受入条件確認UIコンポーネント作成
**ファイル**: `components/tickets/acceptance-confirmation-panel.tsx`

> **注記**: 2026-01-20 完了済み。

#### 実装項目
- [x] 受入条件一覧表示
- [x] 確認状態（未確認/OK/NG）の切り替えUI
- [x] 確認者・エビデンスの入力
- [x] 一括確認機能（複数項目を一度にOK/NGに）

#### 確認項目
- [x] 確認状態の更新がDBに反映される
- [x] 北極星KPI達成状況がリアルタイムで更新される
- [x] TypeScriptビルドが成功する
- [x] Playwrightで基本表示を確認

### 5.7 影響範囲選択・確定UI実装

> **2026-01-21完了**: 影響範囲選択UI・確定UI・北極星KPI達成状況表示が実装完了。

#### 5.7.1 影響範囲選択UI
**ファイル**: `components/tickets/impact-scope-selector.tsx`, `app/tickets/create/page.tsx`

##### 実装項目
- [x] 業務要件選択UI（階層選択: ビジネス領域→業務タスク→業務要件）
- [x] システム要件選択UI（階層選択: システム領域→システム機能→システム要件）
- [x] 選択時の `change_request_impact_scopes` への保存
- [x] 選択要件の受入条件を `change_request_acceptance_confirmations` へ自動登録

##### 確認項目
- [x] 業務要件が選択できる
- [x] システム要件が選択できる
- [x] 選択後DBに保存される

#### 5.7.2 影響範囲確定UI
**ファイル**: `app/tickets/[id]/page.tsx`

##### 実装項目
- [x] 影響範囲の確定ボタン
- [x] confirmed_by, confirmed_at の記録
- [x] 確定済みは編集不可にする

##### 確認項目
- [x] 確定ボタンで confirmed が true になる
- [x] 確定者が記録される

#### 5.7.3 北極星KPI達成状況表示
**ファイル**: `app/tickets/page.tsx`

##### 実装項目
- [x] 確認済み率の計算・表示
- [x] 北極星KPI達成フラグの表示

##### 確認項目
- [x] 一覧に確認済み率が表示される
- [x] 北極星KPI達成時の表示が正しい

---

## Phase 6: 統合テスト

### エンドツーエンドフロー確認
- [ ] 変更要求の起票 → 影響範囲の確定 → 受入条件確認 → 完了判定のフロー
- [ ] 北極星KPI（全受入条件が確認済みOK）の判定が正しく動作する
- [ ] 受入条件がNGの場合、変更要求が「判定不能」となる

### データ整合性確認
- [ ] 受入条件定義（ベースライン仕様）に確認状態が混在していない
- [ ] 変更要求ごとに独立した確認状態が保持されている
- [ ] 同一受入条件が複数の変更要求で異なる確認状態を持てる

### 既存機能への影響確認
- [ ] 業務要件の編集が正常に動作する
- [ ] システム要件の編集が正常に動作する
- [ ] 既存の受入条件データが失われていない

---

## 完了基準

- [ ] PRDの設計が「ベースライン仕様」と「変更要求」の分離原則に従っている
- [x] 受入条件定義には確認状態が含まれていない（型定義・UI）
- [x] 変更要求チケットで受入条件の確認状態が版管理できる（DBスキーマ・型定義）
- [x] 北極星KPI（全受入条件が確認済みOK）が変更要求単位で判定できる（実装済：Phase 5.7完了）
- [x] アプリケーションがエラーなく起動する（TypeScriptビルド成功）
- [ ] すべての統合テストが通る（実装待ち）

---

## 進捗サマリー（2026-01-20 更新）

### 完了済み
- **Phase 1**: PRD設計更新（受入条件確認状態の分離原則を明確化）
- **Phase 2**: データベーススキーマ設計・実装（マイグレーションファイル作成・適用）
- **Phase 3**: ドメイン層の型定義（ChangeRequest, ImpactScope, AcceptanceConfirmation）
- **Phase 3.1**: 受入条件型の簡素化（AcceptanceCriterionJsonから確認状態削除）
- **Phase 4**: データアクセス層の実装・動作確認完了
  - `lib/data/change-requests.ts` (225行) - 9関数
  - `lib/data/impact-scopes.ts` (207行) - 7関数
  - `lib/data/acceptance-confirmations.ts` (261行) - 9関数
  - `scripts/verify-phase4-repositories.ts` - 全41テストケースパス確認
- **Phase 5.1**: 受入条件入力コンポーネントの簡素化
- **Phase 5.2**: 変更要求一覧ページ（DB連携、検索・フィルタ、削除）
- **Phase 5.3**: 変更要求作成ページ（DB保存）
- **Phase 5.4**: 変更要求詳細ページ（DB連携、受入条件確認状況表示）
- **Phase 5.5**: 変更要求編集ページ（DB更新）
- **Phase 5.6**: 受入条件確認UIコンポーネント（確認状態更新・一括確認）
- **Phase 5.7**: 影響範囲選択・確定UI実装（業務要件・システム要件の階層選択、確定ボタン、北極星KPI達成状況表示）
- **Cardコンポーネント**: ChangeRequest型に対応

### 次のステップ
1. Phase 6: 統合テスト（E2E）
