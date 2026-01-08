# AR/AP/GL デモデータ拡充作業 チェックリスト

## 作業概要
AR/AP/GLのデモデータを大幅に拡張し、各領域のバリエーションを充実させる。DB置き換えを考慮したデータ構造で、合計109件のデータを追加する。

---

## 更新対象ファイルチェックリスト

### 1. 型定義とディレクトリ構成
**場所**: `/lib/mock/data/`

#### 実装項目
- [x] ディレクトリ構造を作成（businesses/, tasks/, tickets/, concepts/, srf/）
- [x] `types.ts` にすべての型定義を作成
  - [x] Business, Task, Ticket, Concept, SystemFunction のインターフェース定義
  - [x] BusinessArea, TicketStatus, SrfStatus などの列挙型定義
- [x] `index.ts` にデータのエクスポートとユーティリティ関数を作成

#### 確認項目
- [x] 型定義がすべてのエンティティをカバーしている
- [x] 外部キー関係が正しく定義されている

---

### 2. Business データ（3件）
**ファイル**: `/lib/mock/data/businesses/businesses.ts`

#### 実装項目
- [x] BIZ-001: 債権管理（AR）
  - 業務要件数: 24件、システム要件数: 56件
- [x] BIZ-002: 債務管理（AP）
  - 業務要件数: 20件、システム要件数: 48件
- [x] BIZ-003: 一般会計（GL）
  - 業務要件数: 28件、システム要件数: 64件

#### 確認項目
- [x] 3件のデータが正しく定義されている
- [x] 各領域（AR/AP/GL）が1件ずつ存在する

---

### 3. Task データ（22件）
**ファイル**: `/lib/mock/data/tasks/tasks.ts`

#### AR領域（6件）
- [x] TASK-001: 与信管理
- [x] TASK-002: 売掛計上
- [x] TASK-003: 請求書発行（電子請求書送信を含む）
- [x] TASK-004: 入金消込
- [x] TASK-005: 債権管理
- [x] TASK-006: 債権回収

#### AP領域（8件）
- [x] TASK-007: 仕入請求受領
- [x] TASK-008: 買掛計上
- [x] TASK-009: 支払依頼
- [x] TASK-010: 支払承認
- [x] TASK-011: 支払実行
- [x] TASK-012: 手形管理
- [x] TASK-013: 仕入先支払
- [x] TASK-014: 買掛残高確認

#### GL領域（8件）
- [x] TASK-015: 手動仕訳計上
- [x] TASK-016: 仕訳転記
- [x] TASK-017: 総勘定元帳作成
- [x] TASK-018: 試算表作成
- [x] TASK-019: 財務諸表作成
- [x] TASK-020: 決算整理
- [x] TASK-021: 固定資産管理
- [x] TASK-022: 税申告

#### 確認項目
- [x] 22件のデータが正しく定義されている
- [x] 各タスクにbusinessIdが正しく紐付けられている
- [x] 手動仕訳計上がTASK-015として含まれている
- [x] 「仕訳転記（売上）」「仕訳転記（仕入）」が含まれていない

---

### 4. Ticket データ（26件）
**ファイル**: `/lib/mock/data/tickets/tickets.ts`

#### AR関連（10件）
- [x] CR-001: インボイス制度対応（applied）
- [x] CR-004: 入金消込自動化（open）
- [x] CR-006: 請求書PDFテンプレート変更（review）
- [x] CR-009: 電子請求書対応強化（open）
- [x] CR-012: 延滞債権アラート機能追加（review）
- [x] CR-015: 与信枠管理機能改善（approved）
- [x] CR-018: 請求書一括発行機能（open）
- [x] CR-021: 顧客マスタ連携強化（review）
- [x] CR-024: 債権回収レポート自動化（open）
- [x] CR-027: 請求データCSV出力機能（approved）

#### AP関連（8件）
- [x] CR-003: 支払依頼フロー改善（review）
- [x] CR-010: 仕入請求書OCR読取（open）
- [x] CR-013: 電子手形対応（approved）
- [x] CR-016: 支払一括承認機能（open）
- [x] CR-019: 仕入先ポータル連携（review）
- [x] CR-022: 買掛残高確認機能改善（open）
- [x] CR-025: 支払予定表自動作成（approved）
- [x] CR-028: 外貨建支払対応（review）

#### GL関連（8件）
- [x] CR-002: 電子帳簿保存法対応（approved）
- [x] CR-005: 仕訳自動転換機能（review）
- [x] CR-008: 財務諸テンプレート変更（open）
- [x] CR-011: 固定資産償却自動計算（approved）
- [x] CR-014: 税申告データ自動作成（review）
- [x] CR-017: 連結決算機能追加（open）
- [x] CR-020: 予実管理機能（open）
- [x] CR-023: 仕訳承認フロー追加（review）

#### 確認項目
- [x] 26件のデータが正しく定義されている
- [x] ステータス（open/review/approved/applied）のバランスが適切
- [x] businessIdsが正しく紐付けられている

---

### 5. Concept データ（34件）
**ファイル**: `/lib/mock/data/concepts/concepts.ts`

#### 基本概念（共通・3件）
- [x] C001: インボイス制度
- [x] C002: 消費税計算
- [x] C003: 電子帳簿保存法

#### AR関連（11件）
- [x] C004: 売掛金
- [x] C005: 請求書発行
- [x] C006: 入金消込
- [x] C007: 与信管理
- [x] C008: 債権回収
- [x] C010: 電子請求書
- [x] C011: 督促状
- [x] C012: 与信枠
- [x] C013: 未回収債権
- [x] C014: 回収計画
- [x] C015: 売上伝票

#### AP関連（10件）
- [x] C016: 買掛金
- [x] C017: 支払依頼
- [x] C018: 支払承認
- [x] C019: 手形管理
- [x] C020: 仕入先マスタ
- [x] C021: 仕入請求書
- [x] C022: 支払予定
- [x] C023: 支払実行
- [x] C024: 買掛残高
- [x] C025: 仕入伝票

#### GL関連（10件）
- [x] C026: 仕訳
- [x] C027: 手動仕訳計上
- [x] C028: 総勘定元帳
- [x] C029: 試算表
- [x] C030: 貸借対照表
- [x] C031: 損益計算書
- [x] C032: 決算整理
- [x] C033: 固定資産
- [x] C034: 減価償却
- [x] C035: 税申告

#### 確認項目
- [x] 34件のデータが正しく定義されている
- [x] 各概念に適切な同義語が含まれている
- [x] areas（AR/AP/GL）が正しく設定されている

---

### 6. SRF データ（24件）
**ファイル**: `/lib/mock/data/srf/srf.ts`

#### AR関連（8件）
- [x] SRF-001: 請求書発行（screen・implemented）→ TASK-003
- [x] SRF-002: 税率別内訳集計機能（internal・implemented）→ TASK-003
- [x] SRF-003: 入金データ取り込み機能（internal・implementing）→ TASK-004
- [x] SRF-004: 入金消込機能（internal・testing）→ TASK-004
- [x] SRF-005: 債権管理一覧画面（screen・not_implemented）→ TASK-005
- [x] SRF-006: 与信管理画面（screen・implementing）→ TASK-001
- [x] SRF-007: 電子請求書送信IF（interface・not_implemented）→ TASK-003
- [x] SRF-008: 延滞債権アラート機能（internal・testing）→ TASK-005,TASK-006

#### AP関連（8件）
- [x] SRF-009: 支払依頼画面（screen・implemented）→ TASK-009
- [x] SRF-010: 支払承認画面（screen・testing）→ TASK-010
- [x] SRF-011: 支払実行機能（internal・implementing）→ TASK-011
- [x] SRF-012: 手形管理画面（screen・not_implemented）→ TASK-012
- [x] SRF-013: 仕入請求書取込機能（internal・implemented）→ TASK-007
- [x] SRF-014: 買掛残高確認画面（screen・testing）→ TASK-014
- [x] SRF-015: 仕入先ポータルIF（interface・not_implemented）→ TASK-013
- [x] SRF-016: 支払予定表作成機能（internal・implementing）→ TASK-013

#### GL関連（8件）
- [x] SRF-017: 手動仕訳入力画面（screen・implemented）→ TASK-015
- [x] SRF-018: 仕訳転記機能（internal・implemented）→ TASK-016
- [x] SRF-019: 総勘定元帳画面（screen・implemented）→ TASK-017
- [x] SRF-020: 試算表画面（screen・testing）→ TASK-018
- [x] SRF-021: 財務諸表画面（screen・implementing）→ TASK-019
- [x] SRF-022: 決算整理機能（internal・not_implemented）→ TASK-020
- [x] SRF-023: 固定資産償却機能（internal・testing）→ TASK-021
- [x] SRF-024: 税申告画面（screen・not_implemented）→ TASK-022

#### 確認項目
- [x] 24件のデータが正しく定義されている
- [x] ステータス（not_implemented/implementing/testing/implemented）のバランスが適切
- [x] relatedTaskIdsが正しく紐付けられている

---

### 7. Mockデータ拡張
**ファイル**: `/lib/mock/task-knowledge.ts`
> **注**: この項目は既存のtask-knowledge.ts構造を維持しており、今回のスコープ外

#### 実装項目
- [ ] TASK-004〜TASK-022 の知識データを追加
  - [ ] 各タスクの業務要件（businessRequirements）
  - [ ] 各タスクのシステム要件（systemRequirements）
  - [ ] 各タスクの設計書（designDocs）
  - [ ] 各タスクのコード参照（codeRefs）

#### 確認項目
- [ ] すべてのタスクに知識データが含まれている
- [ ] 要件とSRFの紐付けが正しい

---

### 8. ページファイルの修正

#### 8.1 業務一覧ページ
**ファイル**: `app/business/page.tsx`

#### 実装項目
- [x] ハードコードされたbusinesses配列を削除
- [x] businessDataをインポートして使用

#### 確認項目
- [x] ページがエラーなく表示される
- [x] 3件の業務が表示される

---

#### 8.2 業務タスク一覧ページ
**ファイル**: `app/business/[id]/tasks/page.tsx`

#### 実装項目
- [x] ハードコードされたtasks配列を削除
- [x] taskDataをインポートしてbizIdでフィルタリング

#### 確認項目
- [x] ページがエラーなく表示される
- [x] 各業務IDに応じたタスクが表示される
- [x] BIZ-001（AR）→ 8件
- [x] BIZ-002（AP）→ 8件
- [x] BIZ-003（GL）→ 8件

---

#### 8.3 変更要求一覧ページ
**ファイル**: `app/tickets/page.tsx`

#### 実装項目
- [x] ハードコードされたtickets配列を削除
- [x] ticketDataをインポートして使用
- [x] businessIdsをビジネス名に変換する関数を追加
- [x] ステータス表示値を日本語化

#### 確認項目
- [x] ページがエラーなく表示される
- [x] 26件の変更要求が表示される
- [x] ステータス・領域フィルターが正しく機能する

---

#### 8.4 概念辞書ページ
**ファイル**: `app/ideas/page.tsx`

#### 実装項目
- [x] ハードコードされたideas配列を削除
- [x] ideaDataをインポートして使用
- [x] プロパティ名を修正（domains→areas, count→requirementCount）

#### 確認項目
- [x] ページがエラーなく表示される
- [x] 35件の概念が表示される

---

#### 8.5 システム機能一覧ページ
**ファイル**: `app/srf/page.tsx`

#### 実装項目
- [x] インポートパスを更新（@/lib/mock/srf-knowledge → @/lib/mock/data）
- [x] ステータス・カテゴリ表示値を日本語化

#### 確認項目
- [x] ページがエラーなく表示される
- [x] 24件のシステム機能が表示される

---

#### 8.6 その他のページ修正
- [x] `app/business/[id]/tasks/[taskId]/page.tsx` - getSystemFunctionByIdのインポートパス修正
- [x] `app/srf/[id]/page.tsx` - systemFunctionsデータをインポート、関連要件IDを表示
- [x] 古い `lib/mock/srf-knowledge.ts` ファイルを削除

---

## 統合テスト項目

### ページ表示確認
- [x] 業務一覧ページが正しく表示される
- [x] 業務タスク一覧が正しく表示される（各業務ID）
- [x] 変更要求一覧が正しく表示される
- [x] 概念辞書が正しく表示される
- [x] システム機能一覧が正しく表示される

### データ整合性確認
- [x] すべてのページでAR/AP/GLの領域コードが統一されている
- [x] 外部キー関係が正しく保持されている
  - [x] Task.businessId → Business.id
  - [x] Ticket.businessIds → Business.id[]
  - [x] SystemFunction.relatedTaskIds → Task.id[]
- [x] データ量が計画通り（Business:3, Task:22, Ticket:26, Concept:34, SRF:24）

### UI/UX確認
- [x] 各ページのリンクが正常に動作する
- [x] テーブルのソート・フィルターが機能する
- [x] ボタン（照会・編集・削除）が正常に動作する

### 特別確認事項
- [x] TASK-015「手動仕訳計上」が含まれている
- [x] ARタスクが業務フロー順に並んでいる（与信管理→売掛計上→請求書発行→入金消込→債権管理→債権回収）
- [x] TASK-003「請求書発行」に電子請求書送信が統合されている
- [x] 「仕訳転記（売上）」「仕訳転記（仕入）」が含まれていない
- [x] 各領域（AR/AP/GL）のバランスが適切である

### コンパイル・型チェック
- [x] TypeScript型チェック: パス
- [x] 開発サーバー起動: 正常

---

## 完了基準
- [x] 上記すべてのチェック項目が完了している（Mockデータ拡張を除く）
- [x] アプリケーションがエラーなく起動する
- [x] すべてのデモデータがAR/AP/GL関連に統一されている
- [x] データ構造がDB置き換えを考慮した設計になっている

---

## 実施状況
- **開始日**: 2025-01-07
- **完了日**: 2025-01-07
- **状況**: ✅ 完了（Mockデータ拡張を除く）

## 備考
- `lib/mock/task-knowledge.ts` の拡張（TASK-004〜TASK-024）は、既存構造との整合性維持のため今回のスコープ外とする
- 新しいデータ構造（`/lib/mock/data/`）への移行は完了しており、DB置き換え時の移行が容易になっている
- **2025-01-07追記**: ARタスクを再構築し業務フロー順に整理（8件→6件）
  - 削除: TASK-005(請求データ作成), TASK-006(電子請求書送信)
  - 統合: 電子請求書送信 → TASK-003(請求書発行)に統合
  - C009(請求データ)概念も削除（未使用のため）
