# Phase1 基盤構築（PRD 11.2 準拠）

最終更新: 2026-01-25

---

## 1. エグゼクティブサマリー

### 目的
PRD 第11章 Phase1 のチェックリストを詳細化し、必要な成果物・検証項目まで落とし込む。

### 対象フェーズ
- Phase 1: 基盤構築

### 期待成果物（抜粋）
- Next.js 16(App Router) + Tailwind + shadcn/ui の基盤
- Supabase 接続設定と DB スキーマ (PRD 11.2 1-5〜1-8)
- BetterAuth メール認証
- RLS ポリシー（プロジェクト単位のアクセス制御）
- 共通レイアウト + サイドメニュー

---

## 2. 前提・方針
- 既存実装を最大限活かし、差分のみ改修する（YAGNI）
- 変更は Phase1 範囲に限定し、Phase2 以降の機能は実装しない（KISS）

---

## 3. 詳細チェックリスト（Phase1）

### 3.1 プロジェクト基盤
- [x] 1-1. Next.js 16 (App Router) のプロジェクト構成を確認/必要なら整備
  - 現状: Next.js 16.1.1 + App Router（`package.json`）→ PRD修正で16を正とする
  - 成果物: `app/` ルーティング、`next.config` 基本設定
  - 検証: `bun run dev` で起動する
- [x] 1-2. Tailwind CSS + shadcn/ui 設定の有無確認と不足補完
  - 現状: `app/globals.css` + `postcss.config.mjs` + `components.json`
  - 成果物: `tailwind.config.*`, `globals.css`, `components.json`
  - 検証: 既存ページでユーティリティクラス適用確認

### 3.2 認証・環境設定
- [x] 1-3. Supabase プロジェクト接続設定を確認
  - 現状: `.env*` に SUPABASE 変数、`lib/supabase/client.ts` あり
  - 成果物: `.env*` / クライアント初期化ユーティリティ
  - 検証: Supabase に疎通できること

### 3.3 DB スキーマ
- [x] 1-5. DBスキーマ作成（projects, product_requirements）
  - 対応: `supabase/migrations/20260125090000_prd_v1_4_phase1_missing_tables.sql`
  - 成果物: マイグレーション or SQL
  - 検証: テーブルと主要カラムが作成されている
- [x] 1-6. DBスキーマ作成（業務側: business_domains, business_tasks, business_requirements）
  - 現状: CRUD実装・既存チェックリストで作成済み記録あり
  - 成果物: マイグレーション or SQL
  - 検証: 外部キー/制約が正しく設定されている
- [x] 1-7. DBスキーマ作成（システム側: system_domains, system_functions, system_requirements, acceptance_criteria, impl_unit_sds）
  - 対応: `supabase/migrations/20260125090000_prd_v1_4_phase1_missing_tables.sql`
  - 成果物: マイグレーション or SQL
  - 検証: 主要テーブルの依存関係が成立
- [x] 1-8. DBスキーマ作成（concepts, requirement_links）
  - 対応: `supabase/migrations/20260125090000_prd_v1_4_phase1_missing_tables.sql`
  - 成果物: マイグレーション or SQL
  - 検証: links の参照関係が成立

### 3.4 セキュリティ

### 3.5 UI基盤
- [x] 1-10. 共通レイアウト・サイドメニュー実装
  - 現状: `app/(with-sidebar)/layout.tsx` + `components/layout/*`
  - 成果物: `app/layout.tsx` / レイアウトコンポーネント
  - 検証: 主要画面で共通レイアウトが適用される

---

## 4. 依存関係メモ
- 1-3 Supabase 接続が先行（1-5〜1-9 の前提）
- 1-4 認証は RLS 検証に必要

---

## 5. 完了条件（Phase1）
- ログイン/ログアウトが可能
- サイドメニューから各画面遷移が可能
- DB スキーマが PRD Phase1 と一致
- RLS によりプロジェクト境界が保護される

---

## 6. 検証チェック（M1 相当）
- [x] プロジェクト一覧が表示される（動作確認済み）
- [x] 新規プロジェクトを作成できる（動作確認済み）
- [x] サイドメニューが表示され、各画面に遷移できる（動作確認済み）

---

## 7. Phase6（MVP後）へ移動した項目

MVPでは不要のため、PRDのPhase6へ移動。

- [x] 6-1. BetterAuth メール認証の設定確認・不足改修
  - 現状: BetterAuth 依存/設定/画面が未確認（環境変数も未設定）
  - 成果物: 認証設定ファイル、ログイン/サインアップ導線
  - 検証: ログイン・ログアウト動作
- [x] 6-2. RLS ポリシー設定（プロジェクト単位のアクセス制御）
  - 現状: docs で設計はあるが、migration に policy 実装が見当たらない
  - 成果物: RLS 有効化 + policy
  - 検証: プロジェクトスコープ外の参照が拒否される
