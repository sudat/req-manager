# Phase2 正本管理（手動登録）詳細チェックリスト

最終更新: 2026-01-25

---

## 1. エグゼクティブサマリー

### 目的
PRD 11.2 Phase2（正本管理）の詳細計画。既存実装の再利用を前提に、未実装/不足の差分を埋める。

### 対象フェーズ
- Phase 2: 正本管理（手動登録）

### 主要成果物
- BD/BT/BR/SD/SF/SR/AC/実装単位SDのCRUD画面
- PR編集画面（基本情報/技術スタック・規約）
- /settings プロジェクト設定（PRD 6.15）

---

## 2. 前提・方針
- 既存UI/データ層の再利用を優先し、差分のみ改修する（YAGNI/KISS）
- PRDに記載された入力項目を網羅し、未定義は意思決定タスクとして明示する

---

## 3. 詳細チェックリスト（Phase2）

### 3.1 プロジェクト一覧・作成（2-1）
- [x] 既存UIの動作確認（一覧/作成/削除）
- [x] 作成後のプロジェクト切替と永続化（localStorage/cookie）
- [x] エラー表示/空表示の統一
- [x] 主要導線（ダッシュボード戻り、編集遷移）を確認
- [x] 検証: 一覧表示・新規作成・編集遷移が正常

### 3.2 PR編集（基本情報タブ）（2-2）
- [x] PRデータモデル定義（product_requirements）
- [x] PR取得/保存のデータ層接続
- [x] 入力UI（target_users / experience_goals / quality_goals / design_system / ux_guidelines）
- [x] バリデーション（空許容ルール、保存時の必須チェック）
- [x] 検証: PRの読み込み/更新が保存される

### 3.3 PR編集（技術スタック・規約タブ）（2-3）
- [x] tech_stack_profile 入力UI（JSONで実装）
- [x] coding_conventions / forbidden_choices 入力UI
- [x] 保存形式（jsonb）の整形/検証
- [x] 検証: 保存→再読込で保持される

### 3.4 業務領域（BD）CRUD（2-4）
- [x] 一覧・作成・編集・削除のDB連携確認
- [x] 入力制約（area: 英字+記号のみ）
- [x] 検証: CRUDが即時反映

### 3.5 業務タスク（BT）CRUD（2-5）
- [x] 詳細/作成/編集画面のDB連携確認
- [x] sort_order反映と並び順
- [x] 検証: CRUDが即時反映

### 3.6 業務要件（BR）フォーム（2-6）
- [x] BT詳細内のBRフォーム確認（追加/編集/削除）
- [x] acceptance_criteria_json / legacy 同期
- [x] 関連概念・関連領域の選択UI確認
- [x] 検証: BR保存・再読込が一致

### 3.7 システム領域（SD）CRUD（2-7）
- [x] 一覧・作成・編集・削除のDB連携確認
- [x] 入力制約（id: 英字+記号のみ）
- [x] 検証: CRUDが即時反映

### 3.8 システム機能（SF）CRUD（2-8）
- [x] 一覧/詳細/作成/編集/削除のDB連携確認
- [x] deliverables対応の保存/表示
- [x] entry_points の表示/更新
- [x] design_policy の入力/表示追加
- [x] 検証: CRUDと詳細表示が一致

### 3.9 システム要件（SR）フォーム（2-9）
- [x] SF詳細内のSRフォーム確認（追加/編集/削除）
- [x] category / relatedDeliverableIds の整合
- [x] SRの受入条件入力は廃止し、ACで管理する方針に統一
- [x] 検証: SR保存・再読込が一致

### 3.10 受入基準（AC）フォーム（2-10）
- [x] ACテーブル利用方針の決定（SR内jsonbとの関係整理）
- [x] AC CRUDのデータ層接続
- [x] GWTテンプレート入力UI
- [ ] 検証: ACが保存され、SRとの紐づきが正しい

### 3.11 実装単位SD（2-11）
- [x] impl_unit_sds CRUDのデータ層接続
- [x] SF詳細内の実装単位SDフォーム追加
- [x] entry_points / design_policy / details の入力UI
- [ ] 検証: 保存・再読込が一致

### 3.12 プロジェクト設定（/settings）（2-12）
- [x] 設定保存先の設計決定（projects jsonb 追加）
- [x] ProjectInvestigationSettings のデータモデル定義
- [x] 入力UI（PRD 6.15）
  - exploration: default_max_depth / include_patterns / exclude_patterns
  - allow_paths_rule: base_rule / shared_module_rule / safety_limits
  - impact_review: auto_trigger_threshold / default_aggressiveness / require_human_confirmation
  - shared_module_patterns
- [x] 保存/再読込の動作確認
- [x] 検証: /settingsで編集→保持

---

## 4. 依存関係メモ
- 2-2/2-3 は product_requirements のデータ層が前提
- 2-10 ACはSRとの紐づき仕様決定が必要
- 2-12 /settings はデータモデル決定が前提

---

## 5. 完了条件（Phase2 / M2）
- PR編集（基本情報/技術スタック）が保存できる
- BD→BT→BR および SD→SF→SR→AC→実装単位SD が手動で登録できる
- /settings にプロジェクト設定が保存できる

---

## 6. 検証チェック（M2 相当）
- [ ] PRを編集し、保存できる（tech_stack_profile含む）
- [ ] BD→BT→BRの階層を手動で作成・編集・削除できる
- [ ] SD→SF→SR→AC→実装単位SDの階層を手動で作成・編集・削除できる
- [ ] ACのGWT形式（Given-When-Then）で入力できる
- [ ] 各画面でパンくずリストが正しく表示される
- [x] /settings でプロジェクト設定が保存・再読込できる
