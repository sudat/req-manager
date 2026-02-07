# 要件管理DB - 開発概要

> **目的**: コーディングエージェント（Claude Code等）による基幹業務システム開発を支援する要件管理システム  
> **対象読者**: 開発者・AIエージェント  
> **元ドキュメント**: `docs/PRD.md`

---

## 1. 基本思想

### 1.1 コーディングエージェントの能力仮定

| できること | 自発的にはやらないこと |
|-----------|---------------------|
| 指示された範囲を高精度に実装 | 指示範囲外への波及影響の検出 |
| 受入条件を満たすコード修正 | 変更対象として明示されていないファイルの修正 |
| 指示範囲内での整合性維持 | 業務要件や設計意図に基づく「本来直すべき範囲」の判断 |

**本ツールの役割**: この「波及影響の見落とし」を防ぐ

### 1.2 設計思想

- 「不完全な仕様を前提とした設計」を採用
- 人間は業務判断に集中、詳細設計・テスト生成はAIに委任
- Critic Loop（受入基準→テスト→検証→修正）で品質を担保

---

## 2. 要件階層構造

### 2.1 全体構造

```
プロダクト要件（PR）
  ├─ ターゲットユーザー
  ├─ 体験目標
  ├─ 品質目標
  ├─ デザインシステム
  ├─ UXガイドライン
  └─ 開発前提（Tech Stack / Coding Constraints）

業務領域（BD）
 └─ 業務タスク（BT）
      └─ 業務要件（BR）
           ↓ realizes（参照）
システム領域（SD）
 └─ システム機能（SF）
      ├─ システム要件（SR）
      │    └─ 受入基準（AC）
      └─ 実装単位SD
            └─ 実装（Code）← entry_pointで参照
```

### 2.2 各層の定義

| 層 | ID例 | 記述者 | 記述内容 |
|---|------|--------|---------|
| PR | PR-001 | PO/PdM | ターゲット、体験目標、品質目標、技術スタック |
| BD | BD-BIL | 業務担当 | 業務の大分類（請求・在庫管理等） |
| BT | BT-BIL-001 | 業務担当 | 「いつ誰が何をするか」の業務プロセス |
| BR | BR-BIL-0001-0001 | BA/業務 | ケイパビリティ（～できる/できないこと）とその制約 |
| SD | SD-BIL | SE/AI | システム機能の集計単位（ドメイン境界） |
| SF | SF-BIL-010 | SE/AI | 機能の箱。SRと実装単位SDを紐付ける |
| SR | SR-BIL-001 | SE/AI | システムとして何を保証すべきか |
| AC | AC-BIL-001-01 | QA/AI | GWT形式の受入基準 |
| 実装単位SD | IU-BIL-010-01 | AI/SE | 画面/API/バッチごとの設計・entry_point |

### 2.3 ID体系

| プレフィックス | 意味 | 採番例 |
|--------------|------|--------|
| PR-xxx | プロダクト要件 | PR-001 |
| BD-{DOMAIN} | 業務領域 | BD-BIL（請求）|
| BT-{DOMAIN}-xxx | 業務タスク | BT-BIL-001 |
| BR-{DOMAIN}-{BT-xxx}-xxx | 業務要件 | BR-BIL-0001-0001 |
| SD-{DOMAIN} | システム領域 | SD-BIL |
| SF-{DOMAIN}-xxx | システム機能 | SF-BIL-010 |
| SR-{DOMAIN}-xxx | システム要件 | SR-BIL-001 |
| AC-{DOMAIN}-xxx-yy | 受入基準 | AC-BIL-001-01 |
| IU-{DOMAIN}-xxx-yy | 実装単位SD | IU-BIL-010-01 |
| CR-yyyy-xxx | 変更要求 | CR-2025-001 |

---

## 3. 変更管理・影響調査

### 3.1 変更対応フロー

```
draft → investigating → reviewed → approved → completed
                ↓
            rejected
```

| ステータス | 意味 | 次のアクション |
|-----------|------|---------------|
| draft | 起票済、影響調査前 | 影響調査を開始 |
| investigating | 影響調査中 | 調査結果を確認 |
| reviewed | 調査完了、疑義解消済 | 改修を承認/却下 |
| approved | 改修承認済 | 改修指示パッケージ生成 |
| completed | 改修完了 | - |

### 3.2 影響調査の双方向アプローチ

| 分析方法 | 強み | 弱み |
|---------|------|------|
| トップダウン（正本）| 業務要件レベルでの影響が分かる | リンクが不完全だと漏れる |
| ボトムアップ（コード）| 実際の依存関係を正確に把握 | 業務影響が分からない |

**ボトムアップの逆流提案例**:
1. トップダウンで SR-BIL-001 → `/app/billing/invoice/` を特定
2. コード解析で共通処理 `TaxService.ts` を検出
3. ボトムアップで `/app/purchasing/` も同じサービスを使用していることを発見
4. AIが提案: 「仕入計上にも影響します。BR-MM-001も影響範囲に含めますか？」

### 3.3 要件間リンク

| relation_type | 意味 | 方向 | 例 |
|--------------|------|------|-----|
| realizes | 業務要件をシステム機能が実現 | BR → SF | BR-BIL-001 → SF-BIL-010 |
| depends_on | 前提として依存 | 任意 → 任意 | SR-BIL-002 → SR-FI-001 |
| derives_from | 派生・詳細化 | 詳細 → 元 | 実装単位SD → SF |
| conflicts_with | 矛盾する可能性 | 双方向 | 排他的仕様の明示 |

### 3.4 疑義リンク（suspect）

| 重大度 | 条件 | 対応 |
|--------|------|------|
| high | 誤りがあると要件の誤実装や設計判断ミスに直結 | CR承認前にゼロにする |
| medium | 誤りがあると手戻りが増える | 優先的に解消 |
| low | 改善余地・情報不足のレベル | 警告に留める |

---

## 4. AIエージェント構成

### 4.1 層構成

| 層 | 技術 | 責務 |
|----|------|------|
| アプリ内AI | Mastra Agent | 登録支援、トップダウン影響分析、InvestigationRequest生成 |
| コーディングエージェント | Claude Agent SDK | コード解析、ボトムアップ分析、改修実行、PR作成 |

### 4.2 主要Tool一覧

| Tool名 | 用途 |
|--------|------|
| bt_draft | BT草案生成 |
| br_draft | BR草案生成 |
| system_draft | SF/SR/AC一括生成 |
| impl_unit_draft | 実装単位SD草案生成 |
| impact_analysis | 影響調査（トップダウン）|
| impact_review | 影響範囲レビュー（絞り込み）|
| critic_check | 品質チェック（曖昧さ・矛盾検出）|
| concept_extract | 概念辞書候補抽出 |

### 4.3 コンテキスト注入

チャットセッション開始時に自動注入されるコンテキスト:

| コンテキスト | 内容 | 用途 |
|-------------|------|------|
| product_requirement | PR全体 | 技術スタック、コーディング規約の参照 |
| current_location | 現在のUI位置（BD/BT等）| 親子関係の自動設定 |
| related_requirements | 関連する既存要件 | 重複回避、参照提案 |
| concept_dictionary | 概念辞書 | 用語の統一 |

---

## 5. コーディングエージェント連携

### 5.1 ジョブ種別

| ジョブ種別 | 目的 | 入力 | 出力 |
|-----------|------|------|------|
| 影響調査ジョブ | 影響範囲の特定 | InvestigationRequest | InvestigationResult |
| 改修ジョブ | 実装変更 | ModificationPackage | PR作成 |

### 5.2 InvestigationRequest 主要フィールド

```typescript
{
  investigation_id: string;  // 調査ID
  cr_id: string;             // 変更要求ID
  entry_points: [{           // 探索起点
    impl_unit_id: string;
    entry_point: string;     // ファイルパス
  }];
  exploration: {
    max_depth: number;       // 推奨: 5
    include_patterns: string[];  // 例: ["src/**/*.ts"]
    exclude_patterns: string[];  // 例: ["node_modules/**"]
  };
  change_context: {
    summary: string;         // 変更要求の概要
    affected_concepts: string[];
    expected_change_types: ('logic'|'data'|'api'|'ui'|'config')[];
  };
  requirements_context: {
    product_requirement: PR; // tech_stack_profile含む
    business_requirements: BR[];
    system_requirements: SR[];
    acceptance_criteria: AC[];
  };
}
```

### 5.3 InvestigationResult 主要フィールド

```typescript
{
  investigation_id: string;
  status: 'completed' | 'partial' | 'failed';
  affected_files: [{
    file_path: string;
    impact_type: 'direct' | 'indirect';
    depth: number;           // entry_pointからの距離
    confidence: number;      // 0.0-1.0
    change_likelihood: 'high' | 'medium' | 'low';
    reason: string;
  }];
  requirements_mapping: [...];  // 正本との突合結果
  discoveries: [...];           // 新規発見
  suspect_candidates: [...];    // 疑義候補
}
```

### 5.4 allow_paths自動決定ルール

| ルール | 設定値 |
|--------|--------|
| confidence_threshold | 0.3以上 |
| max_depth | 5 |
| max_total_files | 50（超えたら影響範囲レビューAIへ）|
| max_directories | 10 |

**共通処理ディレクトリの扱い**:
- `src/utils/**`, `src/libs/**`, `src/shared/**` 等は「共通処理」として特別扱い
- 10ファイル超で自動含めの場合は人間に通知

### 5.5 ModificationPackage 主要フィールド

```typescript
{
  task_id: string;           // 冪等キー
  cr_id: string;
  execution: {
    working_branch: string;  // 例: "agent/{task_id}"
    allow_paths: string[];   // 変更許可パス（スコープ強制）
    deny_paths?: string[];   // 明示的禁止パス
  };
  product_requirement: PR;   // tech_stack_profile含む
  implementation_units: [{   // 対象実装単位SD
    impl_unit_id: string;
    entry_point: string;
    design_details: {...};
  }];
  modification_summary: string;
  modification_details: string;
  constraints: string[];     // 制約・ガイドライン
  residual_risks?: [...];    // 残存リスク（PRレビュー時参考）
}
```

---

## 6. 技術アーキテクチャ

### 6.1 技術選定

| コンポーネント | 技術 |
|--------------|------|
| フロントエンド | Next.js 16 (App Router) |
| UIライブラリ | shadcn/ui + Tailwind |
| バックエンド | Hono (Supabase Edge Functions) |
| データベース | Supabase (PostgreSQL) |
| ベクトル検索 | pgvector |
| アプリ内AI | Mastra |
| LLM | Claude (Anthropic API) |
| コーディングエージェント | Claude Agent SDK |
| 認証 | BetterAuth |

### 6.2 データベース主要テーブル

| テーブル | 内容 |
|---------|------|
| projects | プロジェクト |
| product_requirements | PR |
| business_domains | 業務領域（BD）|
| business_tasks | 業務タスク（BT）|
| business_requirements | 業務要件（BR）|
| system_domains | システム領域（SD）|
| system_functions | システム機能（SF）|
| system_requirements | システム要件（SR）|
| acceptance_criteria | 受入基準（AC）|
| impl_unit_sds | 実装単位SD |
| concepts | 概念辞書 |
| requirement_links | 要件間リンク（疑義管理含む）|
| change_requests | 変更要求（CR）|
| investigation_results | 影響調査結果 |
| design_decisions | 設計決定ログ |

### 6.3 権限モデル（MVP）

| ロール | 権限 |
|--------|------|
| owner | 組織設定、プロジェクト作成・削除、メンバー管理、全操作 |
| editor | 要件の作成・編集、CR起票、影響調査実行、改修指示パッケージ生成 |
| viewer | 要件の閲覧のみ |

---

## 7. 開発時の参照ポイント

### 7.1 実装時の確認順序

1. **PR確認**: `product_requirement.yml` → `tech_stack_profile`, `coding_conventions`
2. **エントリポイント確認**: 対象の実装単位SD → `entry_point`
3. **受入基準確認**: 関連AC → GWT形式の検証条件
4. **影響範囲確認**: `graph/requirements-links.json` → 波及リンク

### 7.2 entry_pointの指定ルール

**登録するもの**（機能のエントリポイント）:
- `src/features/billing/pages/InvoiceIssuePage.tsx`
- `src/features/billing/api/issueInvoice.ts`
- `jobs/invoice-pdf-batch.ts`

**登録しないもの**（共通処理）:
- `src/utils/taxCalculation.ts`
- `src/libs/pdfGenerator.ts`

### 7.3 技術スタックプロファイル（例）

```yaml
tech_stack_profile:
  policy:
    unspecified_fields: agent_decides
  frontend:
    framework: Next.js
    language: TypeScript
    styling: Tailwind
    ui_library: shadcn/ui
  backend:
    runtime: Node.js
    framework: Hono
  database:
    provider: Supabase
  auth:
    provider: BetterAuth
  constraints:
    must_use:
      - Supabase Row Level Security
      - Zod
    must_not_use:
      - jQuery
      - Moment.js
```

### 7.4 受入基準（AC）のGWT形式

```yaml
ac_id: AC-001
sr_id: SR-001
scenario: "売上計上が正しく行われる"

given:
  description: "受注が確定している"
  preconditions:
    - "受注ステータスが「確定」"
    - "請求先が与信OK"

when:
  description: "売上計上処理を実行する"
  trigger: "日次バッチ実行"

then:
  description: "売上が正しく計上される"
  expected_outcomes:
    - "売上計上結果を売上照会で確認できる"
    - "売上金額 = 受注金額"
```

### 7.5 SRのtype分類

| type | 観点 | ACのテンプレート |
|------|------|-----------------|
| functional | 機能 | 状態変化、出力データ |
| data | データ | データ形式、整合性、計算結果 |
| exception | 例外 | エラー表示、ロールバック、ログ |
| non-functional | 非機能 | 応答時間、スループット、可用性 |

---

## 8. 用語集

| 用語 | 定義 |
|------|------|
| PR | プロダクト要件 - プロジェクト全体の前提・技術スタック |
| BD | 業務領域 - 業務タスクの集計単位 |
| BT | 業務タスク - 「いつ誰が何をするか」の業務プロセス |
| BR | 業務要件 - ケイパビリティ（～できる/できないこと）とその制約 |
| SD | システム領域 - システム機能の集計単位（ドメイン境界）|
| SF | システム機能 - ユーザーから見える機能の単位 |
| SR | システム要件 - システムが保証すべき仕様 |
| AC | 受入基準 - GWT形式の検証可能な条件 |
| 実装単位SD | 画面/API/バッチごとの設計・entry_point |
| CR | 変更要求 - 正本に対する変更の起点 |
| realizes | BR → SF の「実現する」リンク |
| suspect | リンクの疑義フラグ（レビュー待ち）|
| allow_paths | 改修ジョブで変更を許可するファイルパス |
| entry_point | コード解析の起点となるファイルパス |
| InvestigationRequest | 影響調査ジョブの入力 |
| InvestigationResult | 影響調査ジョブの出力 |
| ModificationPackage | 改修ジョブの入力（全コンテキスト含む）|

---

## 9. 参考リンク

- 詳細PRD: `docs/PRD.md`
- 技術選定: PRD 8章
- AIエージェント設計: PRD 5章
- コーディングエージェント連携: PRD 6章
- 画面設計: PRD 9章
