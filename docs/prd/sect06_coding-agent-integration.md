# 6. コーディングエージェント連携設計

本章では、要件管理DBアプリが保持するコンテキスト（PR→BT→BR→SF→SR→AC→DD）を活用し、コーディングエージェントによる自動改修を安全かつ再現可能に実行するための連携設計を定義する。

## 6.1 目的とスコープ

要件管理DBアプリ側は「影響調査ジョブの投入」「改修指示パッケージの生成」「実行ジョブの管理」「進捗と結果の可視化」を担い、コーディングエージェント側は「影響調査」「改修」「テスト」「PR作成」を担う。

| 対象                       | 役割                                                         |
| -------------------------- | ------------------------------------------------------------ |
| 要件管理DBアプリ           | InvestigationRequest/ModificationPackage生成、チャットUI/タスクUI、結果受信、履歴保管 |
| ジョブAPI / タスク管理     | タスク作成（冪等）、状態/イベント永続化、イベント配信（SSE/WebSocket） |
| コーディングエージェント Worker | 影響調査、改修実行、テスト、PR作成（サンドボックス内でジョブ単位に起動） |

## 6.2 アーキテクチャ方針

実行制御と表示（リアルタイム進捗）を分離し、ジョブの状態とイベントは必ず永続化する。

- 実行はジョブ（task\_id）単位で管理し、状態とイベントは永続ストアを正とする
- Workerは「少なくとも一回」起動されうる前提で冪等に動く
- クライアントは切断/再接続しても、イベントを復元できる

想定する分離構成（例）：

```
┌──────────────────────────────────────────────┐
│ 要件管理DBアプリ（UI）                         │
│ - 要件閲覧/編集                                │
│ - チャットUI / タスクUI                        │
└───────────────────────┬──────────────────────┘
                        │ HTTPS
                        ▼
┌──────────────────────────────────────────────┐
│ ジョブAPI / タスク管理                         │
│ - タスク作成（冪等）                            │
│ - 状態/イベント永続化                           │
│ - イベント配信（SSE/WebSocket）                 │
└───────────────────────┬──────────────────────┘
                        │ 起動トリガ（キュー等）
                        ▼
┌──────────────────────────────────────────────┐
│ コーディングエージェント Worker（エフェメラル）   │
│ - Agent SDK + オーケストレーション               │
│ - サンドボックス化されたワークスペース            │
└──────────────────────────────────────────────┘
```

## 6.3 コーディングエージェント基盤の選択

本番運用（ジョブ制御、権限制御、サンドボックス、Hooks等）を前提に、プログラマティックに制御可能なSDK型の基盤を採用する。

- CLI型の完成品は、ターミナル対話のUXには優れるが、アプリ組み込みとジョブ管理には不向き
- SDK型は、ジョブ制御・検証・権限・ログの統合がしやすい

## 6.4 ジョブ種別

コーディングエージェントへの依頼は、以下の2種類のジョブに分かれる。

| ジョブ種別 | 目的 | 入力 | 出力 | スコープ制約 |
|-----------|------|------|------|-------------|
| 影響調査ジョブ | 変更要求に対する影響範囲の特定 | InvestigationRequest | InvestigationResult | 探索のみ（コード変更なし） |
| 改修ジョブ | 確定した影響範囲に対する実装変更 | ModificationPackage | PR作成 | allow\_pathsで制限 |

## 6.5 影響調査ジョブの入出力定義

### InvestigationRequest（アプリ → エージェント）

```typescript
interface InvestigationRequest {
  // 識別子
  investigation_id: string;
  cr_id: string;
  project_id: string;
  repository_url: string;
  base_branch: string;

  // 探索起点（トップダウンで特定したentry_point群）
  entry_points: {
    dd_id: string;
    sf_id: string;
    entry_point: string;           // ファイルパス
    investigation_hint?: string;   // 「この機能のどこを見るべきか」のヒント
  }[];

  // 探索制約
  exploration: {
    max_depth: number;             // 依存グラフの探索深さ上限（推奨: 5）
    include_patterns: string[];    // 探索対象パターン（例: ["src/**/*.ts", "src/**/*.tsx"]）
    exclude_patterns: string[];    // 除外パターン（例: ["node_modules/**", "**/*.test.ts"]）
    follow_dynamic_imports: boolean; // 動的importも追跡するか
  };

  // 変更要求の文脈（エージェントが影響判断に使う）
  change_context: {
    summary: string;               // 変更要求の概要
    affected_concepts: string[];   // 関連する概念辞書ID（任意）
    expected_change_types: ('logic' | 'data' | 'api' | 'ui' | 'config')[];
  };

  // 参照可能な正本（MCP経由でも取得可能だが、主要なものは同梱）
  requirements_context: {
    product_requirement: ProductRequirement;  // PR（tech_stack_profile含む）
    business_requirements: {
      br_id: string;
      goal: string;
      constraints: string[];
    }[];
    system_requirements: {
      sr_id: string;
      sf_id: string;
      description: string;
      type: 'functional' | 'non-functional' | 'exception' | 'data';
    }[];
    acceptance_criteria: {
      ac_id: string;
      sr_id: string;
      scenario: string;
      given: string;
      when: string;
      then: string;
    }[];
  };

  // 出力設定
  output: {
    include_file_snippets: boolean;  // 影響箇所のコードスニペットを含めるか
    max_files_per_category: number;  // カテゴリごとの最大ファイル数（爆発防止）
    confidence_threshold: number;    // この閾値未満のconfidenceは除外（0.0-1.0）
  };
}
```

### InvestigationResult（エージェント → アプリ）

```typescript
interface InvestigationResult {
  // 識別子
  investigation_id: string;
  cr_id: string;
  status: 'completed' | 'partial' | 'failed';
  completed_at: string;            // ISO 8601

  // 探索メタデータ
  exploration_metadata: {
    total_files_scanned: number;
    total_dependencies_found: number;
    max_depth_reached: number;
    truncated: boolean;            // max_files_per_categoryで切られたか
    truncation_reason?: string;
  };

  // 影響ファイル一覧（allow_pathsの素材）
  affected_files: AffectedFile[];

  // 正本との突合結果
  requirements_mapping: RequirementMapping[];

  // 新規発見（正本に登録されていないが影響がありそうなもの）
  discoveries: Discovery[];

  // 疑義候補（自動でsuspect=trueにすべきリンク）
  suspect_candidates: SuspectCandidate[];

  // エージェントの所見（人間向けサマリ）
  summary: {
    high_impact_areas: string[];   // 特に注意すべき領域
    risk_assessment: string;       // リスクの総合評価
    recommended_actions: string[]; // 推奨アクション
  };
}

interface AffectedFile {
  file_path: string;
  impact_type: 'direct' | 'indirect';
  depth: number;                   // entry_pointからの距離
  confidence: number;              // 0.0-1.0
  change_likelihood: 'high' | 'medium' | 'low';
  reason: string;                  // なぜ影響があると判断したか
  
  // 依存関係の詳細
  dependency_chain: string[];      // entry_pointからこのファイルまでのパス
  dependency_type: 'import' | 'type' | 'runtime' | 'config';
  
  // コードスニペット（output.include_file_snippets=trueの場合）
  snippets?: {
    line_start: number;
    line_end: number;
    content: string;
    relevance: string;             // このスニペットが関連する理由
  }[];
}

interface RequirementMapping {
  file_path: string;
  mapped_to: {
    dd_id?: string;         // 既存のDDにマッピングできた場合
    sf_id?: string;
    sr_ids?: string[];
  };
  mapping_confidence: number;
  mapping_basis: string;           // マッピングの根拠
}

interface Discovery {
  discovery_type: 'unmapped_entry_point' | 'shared_module' | 'unexpected_dependency' | 'circular_dependency';
  file_path: string;
  description: string;
  recommendation: string;          // 正本への登録推奨等
  severity: 'info' | 'warning' | 'critical';
}

interface SuspectCandidate {
  link_id?: string;                // 既存リンクがある場合
  source_id: string;
  target_id: string;
  relation_type: string;
  suspect_reason: string;
  suggested_severity: 'high' | 'medium' | 'low';
  evidence: {
    code_reference?: string;       // 根拠となるコード箇所
    requirement_reference?: string;
  };
}
```

## 6.6 allow\_paths自動決定ロジック

InvestigationResult.affected\_files から allow\_paths を自動生成するルールを定義する。

### 決定フロー

```
InvestigationResult.affected_files
    ↓ フィルタリング
allow_paths候補
    ↓ 閾値チェック（50ファイル超？）
    ↓ Yes → 影響範囲レビューAI（6.7）
    ↓ No → そのまま採用
allow_paths確定
    ↓
ModificationPackage.execution.allow_paths
```

### 自動決定ルール

```typescript
interface AllowPathsDecisionRule {
  // 基本ルール：affected_filesから自動生成
  base_rule: {
    include_direct_impacts: true;      // impact_type='direct'は常に含める
    include_indirect_impacts: true;    // impact_type='indirect'も含める
    confidence_threshold: 0.3;         // これ以上のconfidenceのみ
    max_depth: 5;                      // entry_pointからの距離上限
  };

  // 共通処理の扱い
  shared_module_rule: {
    auto_include: true;                // 依存分析で出てきたら自動で含める
    notify_on_include: true;           // 含めた場合は人間に通知
    require_confirmation_if_count_exceeds: 10; // 共通処理が10ファイル超えたら確認要求
  };

  // 安全弁
  safety_limits: {
    max_total_files: 50;               // allow_pathsの最大ファイル数
    max_directories: 10;               // allow_pathsの最大ディレクトリ数
    escalate_if_exceeds: true;         // 超過したら影響範囲レビューAIに回す
  };
}
```

### 共通処理ディレクトリの定義

プロジェクト設定で以下を定義する。これに該当するファイルは「共通処理」として扱い、通知・確認の対象となる。

```typescript
shared_module_patterns: string[];  // 例: ["src/utils/**", "src/libs/**", "src/shared/**", "src/common/**"]
```

## 6.7 影響範囲レビューAI

allow\_paths候補が閾値（デフォルト50ファイル）を超えた場合、影響範囲レビューAIが起動し、絞り込み提案を行う。

### ImpactReviewRequest（アプリ → 影響範囲レビューAI）

```typescript
interface ImpactReviewRequest {
  investigation_id: string;
  cr_id: string;

  // レビュー対象
  allow_paths_candidate: string[];
  affected_files: AffectedFile[];  // InvestigationResultから

  // 変更要求の文脈
  change_context: {
    summary: string;
    primary_intent: string;        // 変更の主目的
    out_of_scope: string[];        // 明示的にスコープ外としたいもの
  };

  // レビュー方針
  review_policy: {
    aggressiveness: 'conservative' | 'moderate' | 'aggressive';
    // conservative: 疑わしきは含める（安全重視）
    // moderate: バランス（デフォルト）
    // aggressive: 積極的に絞る（コスト重視）
    
    prioritize_by: 'confidence' | 'depth' | 'change_likelihood';
    target_file_count?: number;    // 目標ファイル数（aggressiveの場合に有効）
  };
}
```

### ImpactReviewResult（影響範囲レビューAI → アプリ）

```typescript
interface ImpactReviewResult {
  investigation_id: string;
  cr_id: string;

  // 絞り込み結果
  recommended_allow_paths: string[];
  
  // 除外提案
  exclusion_proposals: {
    file_path: string;
    exclusion_reason: string;
    confidence: number;            // 除外しても問題ない確信度
    risk_if_excluded: string;      // 除外した場合のリスク
    decision: 'exclude' | 'include' | 'human_review';
  }[];

  // カテゴリ別サマリ
  category_summary: {
    category: 'core_logic' | 'shared_module' | 'ui_component' | 'api_layer' | 'config' | 'test';
    file_count: number;
    included_count: number;
    excluded_count: number;
    rationale: string;
  }[];

  // 残存リスク
  residual_risks: {
    risk_type: 'missed_dependency' | 'shared_module_side_effect' | 'indirect_impact';
    description: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;            // リスク軽減策
  }[];

  // 人間への確認事項
  human_review_items: {
    file_path: string;
    question: string;              // 「このファイルは変更対象に含めるべきですか？」
    context: string;               // 判断材料
    default_recommendation: 'include' | 'exclude';
  }[];
}
```

### レビューロジックの方針

```typescript
interface ImpactReviewLogic {
  // 除外判定の基準
  exclusion_criteria: {
    // 自動除外（human_review不要）
    auto_exclude: {
      test_files: true;                    // *.test.ts, *.spec.ts
      type_definition_only: true;          // 型定義のみのファイル（*.d.ts）
      config_if_no_schema_change: true;    // スキーマ変更がない設定ファイル
      depth_exceeds: 7;                    // 依存距離が7を超えるもの
      confidence_below: 0.2;               // confidence 0.2未満
    };

    // 条件付き除外（human_review推奨）
    conditional_exclude: {
      shared_module_if_only_type_dependency: true;  // 型依存のみの共通処理
      indirect_impact_if_no_data_flow: true;        // データフローがない間接影響
      ui_component_if_no_prop_change: true;         // props変更がないUIコンポーネント
    };
  };

  // 包含判定の基準
  inclusion_criteria: {
    // 必ず含める
    must_include: {
      direct_entry_point: true;            // 起点のentry_point
      direct_import_of_entry_point: true;  // entry_pointが直接importしているもの
      data_model_change: true;             // データモデル（型、スキーマ）の変更
      api_contract_change: true;           // API契約の変更
    };

    // 優先的に含める
    prefer_include: {
      business_logic_files: true;          // ビジネスロジックを含むファイル
      state_management: true;              // 状態管理（store, context）
      validation_logic: true;              // バリデーションロジック
    };
  };

  // 爆発抑制のヒューリスティクス
  explosion_control: {
    // 同一ディレクトリから大量に出てきた場合
    same_directory_threshold: 10;          // 同一ディレクトリから10ファイル超
    same_directory_action: 'collapse_to_pattern' | 'human_review' | 'sample';
    
    // 共通処理への依存が多すぎる場合
    shared_module_threshold: 15;
    shared_module_action: 'warn_and_include' | 'human_review' | 'exclude_low_confidence';
  };
}
```

## 6.8 改修指示パッケージ設計

要件管理DBアプリが生成し、コーディングエージェントに渡す「改修指示パッケージ」を定義する。目的は、(1) 意図の伝達、(2) スコープの決定論的制約、(3) トレーサビリティの担保である。

```typescript
interface ModificationPackage {
  // 識別子（冪等キー）
  task_id: string;
  cr_id: string;                      // 変更要求ID
  project_id: string;
  repository_url: string;
  base_branch: string;

  // 実行ポリシー
  execution: {
    working_branch: string;          // 例: "agent/{task_id}"
    allow_paths: string[];           // 変更を許可するパス（スコープ強制）
    deny_paths?: string[];           // 明示的に禁止するパス
    max_runtime_sec: number;
    idempotency_key: string;         // 原則 task_id と同値
  };

  // 要件コンテキスト（トレーサビリティ）
  product_requirement: ProductRequirement;  // PR全体（tech_stack_profile含む）
  business_task: string;
  business_requirements: string[];
  system_functions: string[];
  system_requirements: string[];
  acceptance_criteria: string[];

  // 影響調査・レビューの根拠（トレーサビリティ）
  investigation_refs: {
    investigation_id: string;
    investigation_result_summary: string;
    impact_review_id?: string;           // 影響範囲レビューを実施した場合
    impact_review_result_summary?: string;
  };

  // DD（対象となる設計情報）
  implementation_units: {
    dd_id: string;
    type: 'screen' | 'api' | 'batch' | 'external_if';
    name: string;
    entry_point: string;
    design_details: Record<string, unknown>;  // api_definition, data_model等
  }[];

  // 改修内容
  modification_summary: string;
  modification_details: string;
  targets: {
    dd_id: string;           // 対象のDD
    entry_point: string;            // エントリポイントファイルパス
    description: string;
    related_requirements: string[]; // SR/AC ID
  }[];

  // 制約・ガイドライン
  constraints: string[];
  prohibitions: string[];
  coding_guidelines: string;
  test_commands: string[];

  // 残存リスク（PRレビュー時の参考）
  residual_risks?: {
    risk_type: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;
  }[];

  // 除外されたファイル（明示的な記録）
  excluded_from_scope?: {
    file_path: string;
    exclusion_reason: string;
    excluded_by: 'auto_rule' | 'ai_review' | 'human_decision';
  }[];
}
```

運用上の原則：

- system\_prompt（または同等の指示）は「意図の伝達」に限定し、「スコープ制限の強制」は allow\_paths/deny\_paths 等の決定論的制約で担保する
- 変更対象（targets）はDD（impl\_unit\_id）とリンクし、Change PlanやImpact Reportの自動生成に流用する
- investigation\_refs を通じて「どの時点の調査結果に基づいてスコープを決めたか」を再現可能にする
- product\_requirement を含めることで、エージェントがPRのtech_stack_profileやcoding_conventionsを参照できる

## 6.9 ジョブ実行モデル

実行はジョブ（task\_id）として管理し、状態遷移とイベントを永続化する。

- CREATED → RUNNING → SUCCEEDED / FAILED / NEEDS\_REVIEW
- Worker二重起動が起きても「二重コミット」にならないように、idempotency\_key と状態遷移の整合（CAS等）で無害化する

## 6.10 HITL（Human-in-the-Loop）設計

人間の介入ポイントは「判断」ではなく「検証結果の承認」に寄せる。

| フェーズ               | 処理主体               | 人間の関与           |
| ---------------------- | ---------------------- | -------------------- |
| 影響調査ジョブ投入     | 要件管理DBアプリ       | なし（自動）         |
| 影響調査実行           | コーディングエージェント | なし（自動）         |
| 影響範囲レビュー       | 影響範囲レビューAI     | human\_review\_itemsの確認（閾値超過時） |
| 改修指示パッケージ生成 | 要件管理DBアプリ       | 改修内容の確認・承認（任意） |
| 改修実行               | コーディングエージェント | なし（自動）         |
| テスト/静的解析/ビルド | コーディングエージェント | なし（自動）         |
| PR作成                 | コーディングエージェント | なし（自動）         |
| マージ承認             | 人間                   | 必須                 |
| 検証失敗時             | エスカレーション       | 必須（例外対応）     |

マージ承認の負荷を下げるため、PR作成時に以下を必須成果物として添付する。

| 成果物                         | 目的                                   |
| ------------------------------ | -------------------------------------- |
| Change Plan（変更計画）        | 何をどう変えたかをDD IDと紐付けて列挙 |
| Impact Report（影響調査）      | 依存・影響範囲・リスクを列挙（自動生成） |
| Verification Summary（検証要約） | テスト/静的解析/ビルドの結果を集約     |
| Residual Risks（残存リスク）   | 影響範囲レビューで検出されたリスク     |

## 6.11 Hooks設計（ガードレール）

Hooksは「決定論的なガードレール」として使用し、ワークフロー制御（テスト実行等）には使用しない。

- Bashは許可コマンド集合（allowlist）に一致する場合のみ実行
- ファイル編集は allow\_paths に含まれる場合のみ許可
- deny\_paths と機密ファイルは常に禁止

テスト実行はオーケストレーション層（アプリケーションコード）で制御する。

## 6.12 通信設計

実行制御はHTTPのジョブAPIを主軸とし、進捗表示のためにイベントストリームを用意する。

```
POST   /api/tasks                  # タスク作成（冪等）
GET    /api/tasks/{task_id}        # 状態参照
GET    /api/tasks/{task_id}/events # イベント取得（SSE or pagination）
POST   /api/tasks/{task_id}/retry  # リトライ指示（将来拡張）
```

- WebSocket/SSEは「イベント配信」に限定し、状態の正は永続ストアに置く
- クライアントは last\_event\_id を指定して欠損分を復元できる

## 6.13 エラーハンドリングとエスカレーション

| 失敗パターン   | 検知方法                          | 対応           |
| -------------- | --------------------------------- | -------------- |
| 影響調査失敗   | Workerの実行結果                  | エスカレーション |
| 改修実行失敗   | Workerの実行結果                  | エスカレーション |
| テスト失敗     | 終了コード・出力解析              | エスカレーション |
| 静的解析エラー | Lint/型チェックの終了コード       | エスカレーション |
| ビルド失敗     | ビルドコマンドの終了コード        | エスカレーション |
| スコープ外変更 | allow\_paths と実際のdiff比較     | エスカレーション |
| タイムアウト   | max\_runtime\_sec 到達            | エスカレーション |
| 二重実行       | idempotency\_key / 状態遷移整合   | 無害化（片方をNOOP） |

失敗時は TaskStatus.NEEDS\_REVIEW に更新し、要件管理DBアプリ側のチャットUIにレビュー要求として表示する。

## 6.14 セキュリティ

- サンドボックス化：ワークスペース外へのアクセス禁止、リソース制限、実行時間制限
- ネットワーク制限：許可ドメインのみ接続可能（egress allowlist）
- 認証・認可：サービス間はOIDC/JWT等で認証し、GitHub連携はGitHub App（最小権限・短命トークン）で運用する
- Secret管理：LLM APIキー等はSecret Manager等で管理し、Personal Access Tokenの運用は避ける

## 6.15 プロジェクト設定

影響調査・allow\_paths決定・影響範囲レビューの挙動をプロジェクト単位で設定する。

```typescript
interface ProjectInvestigationSettings {
  // 探索設定
  exploration: {
    default_max_depth: number;           // デフォルト: 5
    default_include_patterns: string[];
    default_exclude_patterns: string[];
  };

  // allow_paths決定ルール
  allow_paths_rule: AllowPathsDecisionRule;

  // 影響範囲レビュー設定
  impact_review: {
    auto_trigger_threshold: number;      // この数を超えたら自動でレビュー起動（デフォルト: 50）
    default_aggressiveness: 'conservative' | 'moderate' | 'aggressive';
    require_human_confirmation: boolean; // human_review_itemsを必須にするか
  };

  // 共通処理ディレクトリの定義
  shared_module_patterns: string[];      // 例: ["src/utils/**", "src/libs/**", "src/shared/**"]
}
```

## 6.16 実装ロードマップ

| Phase           | 主な内容                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1: MVP    | InvestigationRequest/Result、改修指示パッケージ生成、タスク管理（状態/イベント永続化、冪等POST）、Worker実行、スコープ外変更検知、基本Hooks、テスト実行・PR作成、イベント配信（SSEまたはポーリング） |
| Phase 2: 品質向上 | 影響範囲レビューAI、チャットUI統合、影響範囲チェック精度向上（依存解析導入）、エスカレーションフロー整備、監査ログ/メトリクス収集                           |
| Phase 3: 拡張   | 対話的改修（追加指示）、サブエージェント分離、分析→計画→再実行の自動リトライ、WebSocket配信高度化                                       |

## 6.17 決定事項サマリ

| 論点         | 決定                                        | 理由                             |
| ------------ | ------------------------------------------- | -------------------------------- |
| ジョブ種別   | 影響調査ジョブと改修ジョブを分離            | 役割と制約が異なるため明確に分ける |
| allow\_paths決定 | 依存分析で出たファイルは自動で含める + 閾値超過時はレビューAI | 安全性とコストのバランス |
| 実行モデル   | ジョブ（永続状態）+ エフェメラル実行        | 切断・再実行・冪等を前提化       |
| HITL設計     | マージ承認のみ人間、他は自動（閾値超過時のレビュー除く） | 判断のブレを排除しつつ責任分界を明確化 |
| Hooksの用途  | ガードレール（allowlist + パス制約）に限定  | ワークフロー制御はアプリ層で行う |
| 通信方式     | HTTP（ジョブAPI）+ イベント配信（SSE/WebSocket） | 実行制御と表示を分離して堅牢化   |
| GitHub 認証  | GitHub App（最小権限・短命トークン）        | 運用事故を下げる                 |

## 6.18 用語

| 用語               | 定義                                                           |
| ------------------ | -------------------------------------------------------------- |
| InvestigationRequest | 影響調査ジョブの入力。探索起点、探索制約、変更要求の文脈を含む |
| InvestigationResult | 影響調査ジョブの出力。影響ファイル一覧、正本との突合結果、疑義候補を含む |
| 改修指示パッケージ | 改修ジョブの入力。改修に必要な全コンテキストを含む構造化データ |
| 影響範囲レビューAI | allow\_paths候補が爆発した場合に絞り込みを行うAIエージェント |
| オーケストレーション層 | コーディングエージェントの実行フロー（改修→検証→PR作成）を制御するアプリケーションコード |
| エスカレーション   | 自動処理が失敗した場合に人間の介入を要求するプロセス           |
| ジョブ（task）     | 実行単位。状態とイベントを永続化し、冪等性を担保する           |

## 6.19 コーディングエージェントからのフィードバック

コーディングエージェントは「指示された範囲を高精度に実装する」存在だが、実装中に設計への改善提案や不整合の検出を行うことがある。このフィードバックを受け取る仕組みを定義する。

### SuggestionFromAgent

コーディングエージェントから要件管理DBアプリに送られる改善提案のデータモデル。

| フィールド | 必須 | 説明 |
|-----------|------|------|
| suggestion_id | 必須 | 提案の一意識別子 |
| type | 必須 | 提案の分類（design_improvement / implementation_observation / inconsistency_detected） |
| title | 必須 | 提案のタイトル |
| description | 必須 | 提案の詳細 |
| affected_items | 任意 | 影響を受けるDD ID、SR ID等 |
| rationale | 必須 | 根拠（why、evidence） |
| recommended_action | 必須 | 推奨アクション（update_spec / refactor_code / create_ticket / information_only） |
| priority | 必須 | 優先度（critical / high / medium / low） |
| status | 必須 | ステータス（pending / approved / rejected / deferred） |

### SyncCheckRequest / SyncCheckResult

ユーザーがオンデマンドで「コードと正本の同期性をチェックして」と依頼した際に使用する。

SyncCheckRequest:

| フィールド | 必須 | 説明 |
|-----------|------|------|
| check_id | 必須 | チェックの一意識別子 |
| targets | 必須 | チェック対象のDD（dd_id、entry_point、spec） |
| focus_areas | 任意 | チェック観点（structural / implementation / semantic） |

SyncCheckResult:

| フィールド | 必須 | 説明 |
|-----------|------|------|
| check_id | 必須 | 対応するリクエストのID |
| summary | 必須 | チェック結果のサマリー |
| results | 必須 | 各対象の同期状態（synced / out_of_sync）と詳細 |
| recommendations | 任意 | 不一致箇所に対する推奨アクション |

### 運用フロー

1. コーディングエージェントが改修実行中に改善点を発見
2. SuggestionFromAgentを生成し、要件管理DBアプリに送信
3. Mastra Agentがreceive_suggestion Toolで受け取り、一時保存
4. チャットUIに通知を表示（「N件の提案が届いています」）
5. ユーザーはMastra Agentに相談しながら採否を判断
6. 採用する場合は正本を更新、却下する場合は理由を記録

同期チェックは、ユーザーがチャットで「同期チェック」を依頼した場合にのみ実行される（常時監視はしない）。
