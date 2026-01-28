# requirement_links活用とBR↔SR整合性修正

## 作業概要

PRDの中核課題「**波及影響の見落とし**」を防ぐため、`requirement_links`テーブルをBR↔SR関係のSOT（Single Source of Truth）として活用し、疑義リンク機能を有効化する。

### 難易度
```
難易度: ★★☆
根拠: 5-7 files, 約300 lines, データ層・UI両方に影響
リスク: 既存データの不整合発生の可能性（マイグレーション時）
```

### スコープ
- **Phase 1-2**: データ移行と読み取り層（今回実装）
- **Phase 3-4**: 書き込み層とUI管理画面（後続実装予定）
- **Phase 5**: 配列カラム廃止（最終段階）

### 設計原則
- **DRY**: requirement_linksを単一情報源とする
- **YAGNI**: Phase 1-2で動作確認してから拡張
- **KISS**: 段階的移行でリスク最小化

---

## Phase 1: データマイグレーション

### 1.1 事前確認（ドライラン）
- [x] Supabase MCPで移行対象件数を確認
  ```sql
  SELECT COUNT(*) as total_relations
  FROM system_requirements, unnest(business_requirement_ids) as br_id
  WHERE array_length(business_requirement_ids, 1) > 0;
  ```
- [x] 件数が想定通りか確認（目視） → 127件確認
- [x] 実行前のrequirement_links件数を記録 → 0件（空テーブル）

### 1.2 本番マイグレーション実行
- [x] SR.businessRequirementIds → requirement_linksへの移行SQL実行
  ```sql
  INSERT INTO requirement_links (project_id, source_type, source_id, target_type, target_id, link_type, suspect)
  SELECT
    project_id,
    'sr' as source_type,
    id as source_id,
    'br' as target_type,
    unnest(business_requirement_ids) as target_id,
    'derived_from' as link_type,
    false as suspect
  FROM system_requirements
  WHERE array_length(business_requirement_ids, 1) > 0
  ON CONFLICT DO NOTHING;
  ```
- [x] マイグレーション完了件数を確認 → 127件
- [x] 想定件数と一致するか検証 → ✅ 一致

### 1.3 結果確認
- [x] requirement_linksテーブルのレコード数確認
  ```sql
  SELECT COUNT(*) FROM requirement_links WHERE link_type = 'derived_from';
  ```
- [x] サンプルで5件程度のリンクを目視確認（source_id/target_idが正しいか） → ✅ 正常
- [x] 不整合データがないか確認（存在しないBR/SR IDを参照していないか） → ✅ 問題なし

---

## Phase 2: 読み取り層の移行

### 2.1 高レベルAPI追加（lib/data/requirement-links.ts）
- [x] `listBrIdsBySrId(srId, projectId)` 関数実装
  - SR IDから関連BR IDsを取得
  - requirement_linksテーブルをクエリ
  - 返り値: `string[]`
- [x] `listSrIdsByBrId(brId, projectId)` 関数実装
  - BR IDから関連SR IDsを取得
  - requirement_linksテーブルをクエリ
  - 返り値: `string[]`
- [x] `listSuspectLinks(projectId)` 関数実装
  - suspect=trueのリンク一覧取得
  - 返り値: `RequirementLink[]`
- [x] エラーハンドリング追加（Supabaseクエリ失敗時） → サイレントフェイル方式
- [x] 型定義の整合性確認 → ✅ OK

### 2.2 トランスフォーマー更新（lib/data/transformers/related-requirements-transformer.ts）
- [x] `buildSysReqToBizReqsMapFromLinks()` 関数実装
  - systemRequirementIds配列からBRマップを構築
  - requirement_linksベースの新関数
  - 返り値: `Map<string, string[]>`
  - Promise.allで並列取得
- [x] `buildSysReqToBizReqsMapHybrid()` 関数実装
  - 移行期間用のハイブリッド関数
  - `useLinks`フラグで切り替え
  - requirement_links優先、フォールバックで配列カラム
- [x] 既存の`buildSysReqToBizReqsMap()`は変更なし（後方互換性維持）
- [ ] テスト用のモックデータで動作確認 → Phase 2.4で実施
- [x] エッジケース処理（空配列、nullチェック） → ✅ OK

### 2.3 フック更新（hooks/use-related-requirements-data.ts）
- [x] requirement_linksからの読み取りオプション追加
  - 新しい`useRequirementLinks`フラグ導入
  - デフォルトはfalse（移行期間中）
- [x] 既存フックに新関数を統合
  - `buildSysReqToBizReqsMapHybrid()`を使用
  - フラグ切り替えで動作確認
- [x] 型定義更新（返り値の型が変わっていないか確認） → ✅ OK
- [x] エラー時のフォールバック処理 → ハイブリッド関数内で自動フォールバック

### 2.4 Phase 2 統合テスト
- [x] 配列カラムの値とrequirement_linksの値が一致するか検証
  - 全56件で完全一致確認（100%）
  - 不一致: 0件、不足: 0件
- [x] TypeScript型チェック
  - Phase 2追加コードの型エラー: 0件
  - 既存コードの型エラー: 無関係（Phase 2影響なし）
- [x] データ層の正しさ検証
  - マイグレーション: ✅ 127件成功
  - 高レベルAPI: ✅ 実装完了
  - トランスフォーマー: ✅ ハイブリッド関数実装完了
  - フック層: ✅ オプション追加完了
- [x] 業務タスク詳細画面でBR→SR関係が正しく表示されることを確認
  - ✅ 手動確認完了（既存動作に問題なし）
- [x] システム機能詳細画面でSR→BR関係が正しく表示されることを確認
  - ✅ 手動確認完了（http://localhost:3000/system-domains/AR/SRF-001）
  - リグレッションテスト合格

---

## Phase 3: 書き込み層の移行（後続実装予定）

### 3.1 保存時の同期処理更新（lib/data/task-sync.ts）
- [x] `syncBrSrLinksToRequirementLinks()` 関数実装
  - SR単位でループ、requirement_linksを更新
  - 既存リンク削除→新規リンク挿入のロジック（delete → insert方式）
  - トランザクション対応は今後検討（Phase 4以降）
- [x] エラーハンドリング追加 → try-catchで例外捕捉
- [x] ログ出力追加（デバッグ用） → console.log/errorで記録

### 3.2 保存フック更新（useTaskSave.ts）
- [x] `syncBrSrLinksToRequirementLinks()`の呼び出し追加
  - `syncSystemRequirements()`の直後に挿入
  - `syncedSystemRequirements`を渡す
- [x] 移行期間中は配列カラムへの書き込みも維持
  - 既存の`syncLegacyBusinessRequirementLinks()`と`syncSystemRequirementLinks()`は維持
  - 配列カラムとrequirement_links両方を更新
- [x] エラー時の処理（部分的な保存失敗をどう扱うか）
  - エラー発生時は`setSaveError()`で表示、処理中断
- [x] 保存成功時のトースト通知 → 既存の成功フローを維持

### 3.3 Phase 3 統合テスト
- [x] BRを編集→保存後、requirement_linksにレコードが作成されることを確認
  - ✅ TASK-001で実施、正常に作成
- [x] SR関係を追加→保存後、リンクが正しく作成されることを確認
  - ✅ updated_atが最新日時で更新確認
- [x] SR関係を削除→保存後、リンクが削除されることを確認
  - ✅ 関連BR減らして保存→正しく反映
- [x] 配列カラムとrequirement_linksの両方が更新されることを確認
  - ✅ 整合性チェックで全件「✅ 一致」
- [ ] エラー時にロールバックされることを確認
  - 今後実装（Phase 4以降でトランザクション対応）

---

## Phase 4: 要件リンク管理画面（後続実装予定）

### 4.1 ナビゲーション追加
- [x] サイドバーに「要件リンク」メニュー追加（sidebar.tsx）
  - アイコン: Link2
  - href: `/links`
  - ラベル: 「要件リンク」
- [ ] ダッシュボードに疑義リンクカード追加
  - 疑義リンク件数を表示
  - クリックで `/links?filter=suspect` へ遷移

### 4.2 要件リンク一覧ページ（app/(with-sidebar)/links/page.tsx）
- [x] 新規ページファイル作成
- [x] レイアウト設計（ヘッダー、フィルター、テーブル）
- [x] フィルター機能実装
  - ✅ 全件 / 疑義のみ
  - リンク種別・ソース種別は後回し（Phase 4.3で実装）
- [x] ローディング状態の実装
- [ ] ページネーション実装（50件/ページ） → 後回し

### 4.3 リンク一覧テーブル（詳細機能）
- [x] 基本テーブル実装（page.tsx内）
  - ソース・ターゲット・リンク種別・疑義・更新日時
- [ ] 要件の詳細情報表示（summaryなど） → Phase 4.6で統合時に実装
- [ ] ソート機能実装 → 後回し（Phase 4.8後に必要なら追加）
- [ ] バッチ選択機能実装 → 後回し
- [ ] 一括確認ボタン実装 → 後回し
- [ ] 行クリックで詳細モーダル表示 → 後回し

### 4.4 疑義バッジコンポーネント（suspect-link-badge.tsx）
- [ ] 新規コンポーネントファイル作成
- [ ] バッジデザイン実装（警告色、アイコン）
- [ ] ツールチップで理由表示
- [ ] クリックで詳細表示

### 4.5 疑義検出ロジック（lib/data/suspect-detection.ts）
- [ ] 新規ファイル作成
- [ ] `markRelatedLinksSuspect()` 関数実装
  - SR/BR変更時に関連リンクをsuspect=trueに
  - suspect_reasonに変更内容を記録
- [ ] トリガー実装（summary変更時）
  - BR/SR保存時のフック追加
  - 変更前後の差分を検出
- [ ] トリガー実装（acceptance_criteria変更時）
  - 同様に変更検出
- [ ] エラーハンドリング

### 4.6 既存画面への疑義バッジ追加
- [ ] SystemRequirementsSection.tsx に疑義バッジ追加
  - BusinessRequirementLink内に表示
  - suspect=trueのリンクにバッジ
- [ ] BusinessRequirementCard.tsx に疑義バッジ追加
  - 関連SR表示に疑義バッジ
  - クリックで詳細表示

### 4.7 ダッシュボード統合（dashboard/page.tsx）
- [ ] 疑義リンク件数カード追加
  - `listSuspectLinks()`で件数取得
  - クリックで `/links?filter=suspect` へ
- [ ] カードデザイン実装（警告色、アイコン）
- [ ] ローディング状態の実装

### 4.8 Phase 4 統合テスト
- [ ] `/links`ページにアクセスして全リンクが表示されることを確認
- [ ] サイドバーから「要件リンク」でアクセスできることを確認
- [ ] フィルター機能が正しく動作することを確認
- [ ] SR/BRを編集→関連リンクがsuspect=trueになることを確認
- [ ] ダッシュボードに疑義リンク件数が表示されることを確認
- [ ] `/links?filter=suspect`で疑義リンクのみ表示されることを確認
- [ ] 「確認して維持」でsuspect=falseになることを確認
- [ ] Playwright MCPで全画面の動作確認

---

## Phase 5: 配列カラム廃止（最終段階、後日実施）

### 5.1 フィーチャーフラグON
- [ ] 環境変数 `USE_REQUIREMENT_LINKS=true` を設定
- [ ] 全画面でrequirement_linksのみ使用するよう切り替え
- [ ] 配列カラムへの読み取りを完全停止
- [ ] 1週間程度運用してバグがないか確認

### 5.2 配列カラム書き込み停止
- [ ] `syncLegacyBusinessRequirementLinks()`削除
- [ ] `syncSystemRequirementLinks()`削除
- [ ] 配列カラムへの書き込みコード完全削除
- [ ] 保存処理のテスト

### 5.3 配列カラム削除（最終）
- [ ] Supabase MCPでDDL実行
  ```sql
  ALTER TABLE business_requirements DROP COLUMN related_system_requirement_ids;
  ALTER TABLE system_requirements DROP COLUMN business_requirement_ids;
  ```
- [ ] 型定義から該当フィールド削除
- [ ] 全コード検索で配列カラム参照がないか確認
- [ ] 最終テスト

---

## 完了条件

### Phase 1-2 完了条件（今回）
- [x] すべてのPhase 1-2タスクが完了している
- [x] 手動での動作確認が成功している（リグレッションテスト合格）
- [x] BR↔SR関係が既存通り正しく表示される
- [x] 既存機能に影響がない（リグレッションなし）
- [x] データ整合性100%（配列カラムとrequirement_linksが完全一致）

✅ **Phase 1-2 完了！** (2026-01-27)

### 全Phase 完了条件（最終）
- [ ] すべてのPhase 1-5タスクが完了している
- [ ] 配列カラムが完全に削除されている
- [ ] 疑義リンク機能が正常に動作している
- [ ] `/links`管理画面が運用可能な状態
- [ ] ドキュメント更新完了

---

## メモ・備考

### 設計判断
- **requirement_linksを正とする**: 移行期間中は配列カラムは参照用のみ
- **疑義検出タイミング**: summary/acceptance_criteria変更時のみ（削除は含まない）
- **バックアップ不要**: 開発環境のため

### リスク対策
- Phase 1-2で一旦停止して動作確認
- 移行期間中は両ソース同期書き込み
- エラー時は既存の配列カラムにフォールバック

### 関連ファイル
- `lib/data/requirement-links.ts`
- `lib/data/transformers/related-requirements-transformer.ts`
- `lib/data/task-sync.ts`
- `hooks/use-related-requirements-data.ts`
- `components/system-domains/system-requirements-section.tsx`
- `app/(with-sidebar)/business/[id]/[taskId]/business-requirement-card.tsx`
