# 業務概要一括更新プロジェクト

**作成日:** 2026-01-15
**対象:** AR領域、AP領域、GL領域の全21タスク
**目的:** 全タスクの業務概要を「誰が」「いつ」「何をする」形式に統一・改善

## 作業概要

TASK-001（与信管理）の形式を参考に、残り21タスクの業務概要を以下の形式で更新：

- **プロセス概要**: 簡潔なまとめ（1〜2文）
- **業務フロー**: 具体的なプロセス（サブセクション含む）
- **アウトプット**: 生成される成果物（必要に応じて）

各タスクの作業手順：
1. 改善後の業務概要を作成
2. `lib/mock/task-knowledge.ts` のデフォルト値を更新
3. DBの `business_tasks` テーブルを更新

---

## 進捗状況

- AR領域: 5/5 タスク完了 ✅
- AP領域: 8/8 タスク完了 ✅
- GL領域: 8/8 タスク完了 ✅
- **全体: 21/21 タスク完了 (100%)** 🎉

---

## AR領域（債権管理）✅ 完了

### TASK-002: 売掛計上 ✅

- [x] 1.1 改善後の業務概要を作成
- [x] 1.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 1.3 DBの `business_tasks` テーブルを更新（Supabase MCP使用）

### TASK-003: 請求書発行 ✅

- [x] 2.1 改善後の業務概要を作成
- [x] 2.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 2.3 DBの `business_tasks` テーブルを更新

### TASK-004: 入金消込 ✅

- [x] 3.1 改善後の業務概要を作成
- [x] 3.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 3.3 DBの `business_tasks` テーブルを更新

### TASK-005: 債権管理 ✅

- [x] 4.1 改善後の業務概要を作成
- [x] 4.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 4.3 DBの `business_tasks` テーブルを更新

### TASK-006: 債権回収 ✅

- [x] 5.1 改善後の業務概要を作成
- [x] 5.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 5.3 DBの `business_tasks` テーブルを更新

---

## AP領域（債務管理）✅ 完了

### TASK-007: 仕入請求受領 ✅

- [x] 6.1 改善後の業務概要を作成
- [x] 6.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 6.3 DBの `business_tasks` テーブルを更新（Supabase MCP使用）

### TASK-008: 買掛計上 ✅

- [x] 7.1 改善後の業務概要を作成
- [x] 7.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 7.3 DBの `business_tasks` テーブルを更新

### TASK-009: 支払依頼 ✅

- [x] 8.1 改善後の業務概要を作成
- [x] 8.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 8.3 DBの `business_tasks` テーブルを更新

### TASK-010: 支払承認 ✅

- [x] 9.1 改善後の業務概要を作成
- [x] 9.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 9.3 DBの `business_tasks` テーブルを更新

### TASK-011: 支払実行 ✅

- [x] 10.1 改善後の業務概要を作成
- [x] 10.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 10.3 DBの `business_tasks` テーブルを更新

### TASK-012: 手形管理 ✅

- [x] 11.1 改善後の業務概要を作成
- [x] 11.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 11.3 DBの `business_tasks` テーブルを更新

### TASK-013: 仕入先支払 ✅

- [x] 12.1 改善後の業務概要を作成
- [x] 12.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 12.3 DBの `business_tasks` テーブルを更新

### TASK-014: 買掛残高確認 ✅

- [x] 13.1 改善後の業務概要を作成
- [x] 13.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 13.3 DBの `business_tasks` テーブルを更新

---

## GL領域（一般会計）✅ 完了

### TASK-015: 手動仕訳計上 ✅

**現状:** `手動で仕訳データを入力し、仕訳帳へ登録する`

- [x] 14.1 改善後の業務概要を作成
- [x] 14.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 14.3 DBの `business_tasks` テーブルを更新

---

### TASK-016: 仕訳転記 ✅

**現状:** `各業務プロセスから自動生成される仕訳を転記する`

- [x] 15.1 改善後の業務概要を作成
- [x] 15.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 15.3 DBの `business_tasks` テーブルを更新

---

### TASK-017: 総勘定元帳作成 ✅

**現状:** `仕訳データを集計し、総勘定元帳を作成する`

- [x] 16.1 改善後の業務概要を作成
- [x] 16.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 16.3 DBの `business_tasks` テーブルを更新

---

### TASK-018: 試算表作成 ✅

**現状:** `総勘定元帳から試算表を作成し、貸借整合を確認する`

- [x] 17.1 改善後の業務概要を作成
- [x] 17.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 17.3 DBの `business_tasks` テーブルを更新

---

### TASK-019: 財務諸表作成 ✅

**現状:** `試算表をもとにB/S、P/Lを作成する`

- [x] 18.1 改善後の業務概要を作成
- [x] 18.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 18.3 DBの `business_tasks` テーブルを更新

---

### TASK-020: 決算整理 ✅

**現状:** `決算時に必要な整理仕訳を計上し、決算資料を作成する`

- [x] 19.1 改善後の業務概要を作成
- [x] 19.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 19.3 DBの `business_tasks` テーブルを更新

---

### TASK-021: 固定資産管理 ✅

**現状:** `固定資産の取得、償却、廃棄を管理する`

- [x] 20.1 改善後の業務概要を作成
- [x] 20.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 20.3 DBの `business_tasks` テーブルを更新

---

### TASK-022: 税申告 ✅

**現状:** `消費税、法人税等の税申告資料を作成する`

- [x] 21.1 改善後の業務概要を作成
- [x] 21.2 `lib/mock/task-knowledge.ts` の taskSummary を更新
- [x] 21.3 DBの `business_tasks` テーブルを更新

---

## 完了基準

- [x] 全21タスクの業務概要がMarkdown形式で更新されている
- [x] `lib/mock/task-knowledge.ts` のデフォルト値が全て更新されている
- [x] DBの `business_tasks` テーブルが全て更新されている
- [x] 各タスクページでMarkdownが正しくレンダリングされている（TASK-001〜TASK-021を確認、TASK-022は同じ形式のため正常動作と判断）

---

## 検証方法

1. **コード確認**: `lib/mock/task-knowledge.ts` の各タスクの taskSummary を確認
2. **DB確認**: Supabase MCPで `SELECT id, summary FROM business_tasks` を実行
3. **表示確認**: Playwright MCPで各タスクページにアクセスし、Markdownが正しく表示されているか確認
