# 基本CRUD（業務・システム機能・概念辞書）チェックリスト

## 作業概要
Supabaseを永続化の正本として、業務一覧/システム機能一覧/概念辞書の基本CRUD（一覧・詳細・追加・編集・削除）を一貫した導線で動作させる。初期データは既存の `lib/mock/data` をseedとして投入し、以降はSupabaseを参照・更新する。

---

## 更新対象ファイルチェックリスト

### 1. Supabaseスキーマ/初期データ準備
**ファイル**: `docs/mock-crud-design.md`, `lib/mock/data/*`

#### 実装項目
- [x] Supabaseに基本テーブルを作成（business_domains, business_tasks, system_functions, concepts）
- [x] businesses -> business_domains へテーブル名を変更
- [x] tasks -> business_tasks へテーブル名を変更
- [x] 参照整合性とインデックス方針を整理（ID採番、created_at/updated_at）
- [x] 既存の `lib/mock/data` をseedとして投入する手順を確立
- [x] Supabase MCPの利用手順（接続・実行・検証）を設計書に明記

#### 確認項目
- [x] Supabase上に想定テーブルと初期データが存在する
- [x] business_domains / business_tasks が参照できる
- [ ] 参照/更新でエラーが出ないことを確認できる

---

### 2. Supabaseデータアクセス層
**ファイル**: `lib/supabase/*`, `lib/data/*`

#### 実装項目
- [x] Supabaseクライアント初期化（環境変数・型定義）
- [x] Business / SystemFunction / Concept のCRUD関数を実装
- [x] 既存の参照関数（getById等）をSupabase参照に差し替える

#### 確認項目
- [ ] 各CRUD関数が正しい型で返る
- [ ] 失敗時のエラーハンドリング方針が統一されている

---

### 3. 業務一覧（Business）CRUD
**ファイル**: `app/business/page.tsx`, `app/business/manual-add/page.tsx`, `app/business/[id]/edit/page.tsx`

#### 実装項目
- [x] 一覧をストア参照に切り替え、検索フィルタを適用
- [x] 一覧に「手動追加」ボタンを追加（既存導線に統一）
- [x] 追加画面で作成→一覧へ戻る導線を実装
- [x] 編集画面を追加し、既存データの更新を反映
- [x] 削除ボタンに確認導線を追加し、削除後は一覧更新
- [x] 業務追加/編集で領域入力を英字＋記号のみ許可（AP/AR/GL 等）
- [x] 業務タスク一覧のヘッダーにbusiness.areaを表示

#### 確認項目
- [ ] 追加/編集/削除が一覧に即時反映される
- [ ] 該当IDが存在しない場合に適切な空表示になる

---

### 3.5 業務タスク（Task）CRUD
**ファイル**: `app/business/[id]/tasks/page.tsx`, `app/business/manual-add/page.tsx`, `app/business/[id]/tasks/[taskId]/page.tsx`, `lib/data/tasks.ts`

#### 実装項目
- [x] business_tasks テーブルをSupabaseに作成しseed投入
- [x] business_tasks テーブル参照に切り替え
- [x] 業務タスク一覧をSupabase参照に切り替え
- [x] 手動追加の保存をSupabase insert + 作成後に一覧へ遷移
- [x] 詳細画面の基本情報をSupabase参照で表示
- [ ] 編集画面をSupabase更新に対応

#### 確認項目
- [ ] 手動追加がDBに保存され、一覧に反映される
- [ ] 詳細画面で追加タスクが表示される
- [ ] 業務一覧（詳細）への戻り導線が正しい業務に戻る

---

### 3.6 業務要件（BusinessRequirement）/システム領域（SystemDomain）
**ファイル**: `app/business/manual-add/page.tsx`, `app/business/[id]/tasks/[taskId]/page.tsx`, `app/settings/system-domains/page.tsx`, `lib/data/business-requirements.ts`, `lib/data/system-domains.ts`

#### 実装項目
- [x] business_requirements / system_domains をSupabaseに追加
- [x] manual-addの業務要件入力をDB保存に接続
- [x] 業務要件の関連概念/関連システム機能/システム領域をダイアログ選択に変更
- [x] 業務タスク詳細で業務要件をSupabase参照で表示
- [x] システム領域マスタの設定画面をSupabase連携に切替
- [x] 業務要件UIから関連要件を削除
- [x] システム領域マスタのコード入力を英字＋記号のみ許可

#### 確認項目
- [ ] 業務要件の追加がDBに保存され、詳細に表示される
- [ ] システム領域の追加/編集/削除が選択ダイアログと設定画面に反映される

---

### 4. システム機能一覧（SystemFunction）CRUD
**ファイル**: `app/system-domains/page.tsx`, `app/system-domains/[id]/functions/page.tsx`, `app/system-domains/[id]/functions/create/page.tsx`, `app/system-domains/[id]/functions/[srfId]/page.tsx`, `app/system-domains/[id]/functions/[srfId]/edit/page.tsx`

#### 実装項目
- [x] 一覧をストア参照に切り替え、フィルタに連動させる
- [x] 新規作成ページを追加し、作成後に一覧へ遷移
- [x] 編集ページの保存をストア更新に差し替える
- [x] 削除ボタンに確認導線を追加
- [x] システム領域一覧の遷移を /system-domains/[id] に変更
- [x] 旧 /system-domains/[id]/functions を新URLへ集約

#### 確認項目
- [ ] 新規作成/編集/削除が一覧と詳細に反映される
- [ ] 詳細ページの未存在時にエラーメッセージが表示される

---

### 5. 概念辞書（Concept）CRUD
**ファイル**: `app/ideas/page.tsx`, `app/ideas/add/page.tsx`, `app/ideas/[id]/page.tsx`, `app/ideas/[id]/edit/page.tsx`

#### 実装項目
- [x] 一覧をストア参照に切り替え、検索に連動させる
- [x] 追加ページの保存処理をストア更新に差し替える
- [x] 編集ページの保存処理をストア更新に差し替える
- [x] 削除ボタンに確認導線を追加

#### 確認項目
- [ ] 追加/編集/削除が一覧と詳細に即時反映される
- [ ] 関連要件の表示が既存ロジックに影響しない

---

### 6. 共通UI/挙動の統一
**ファイル**: `components/ui/*`, `components/layout/*`

#### 実装項目
- [x] 削除確認ダイアログの共通化（ボタン・文言・挙動）
- [ ] 空表示/エラー表示を共通化して見た目を揃える
- [ ] テーブルとツールバーの見た目を既存画面に合わせる

#### 確認項目
- [ ] 各一覧で削除確認が同じUI/文言になる
- [ ] 空状態でもレイアウトが崩れない

---

### 7. 仕様ドキュメント更新
**ファイル**: `docs/prd.md`, `docs/mock-crud-design.md`

#### 実装項目
- [x] CRUDの保存先（Supabase）と制約をPRDに追記
- [x] CRUD設計方針（Supabase構成/ID採番/画面遷移）を設計書に整理
- [x] PRD/設計書を business_domains / business_tasks に更新
- [x] システム領域導線（/system-domains/[id]）を追記

#### 確認項目
- [x] 仕様変更点がPRDと設計書に反映されている

---

## 統合テスト項目

### CRUD動作確認
- [ ] 業務一覧で追加/編集/削除ができる
- [ ] システム機能一覧で追加/編集/削除ができる
- [ ] 概念辞書で追加/編集/削除ができる
- [ ] 業務/システム領域のコード入力が英字＋記号のみ通る

### ページ表示確認
- [ ] 一覧/詳細/編集ページがエラーなく表示される
- [ ] フィルタ・検索の見た目が崩れない
- [ ] システム領域の遷移が /system-domains/[id] で動く

### データ整合性確認
- [ ] 再読み込み後も作成/編集内容が残る
- [ ] 削除後に一覧から消える

---

## 完了基準
- [ ] 上記すべてのチェック項目が完了している
- [ ] 主要画面のCRUD導線が一通り動作する
- [ ] PRD/設計書の更新が完了している
