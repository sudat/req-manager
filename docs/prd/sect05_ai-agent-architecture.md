# 5. AIエージェント構成

本章では、要件管理DBアプリに組み込むAIエージェントの設計を定義する。コーディングエージェント（Claude Code等）への連携は6章で扱い、本章ではアプリ内で動作する「登録支援」「影響調査」「品質チェック」等のAI機能を対象とする。

## 5章と6章の責務境界

本PRDでは、AI機能を2つの層に分けて設計している。

| 層 | 章 | 技術 | 責務 |
|----|:---:|------|------|
| アプリ内AI | 5章 | Mastra Agent | 登録支援（草案生成）、品質チェック、トップダウン影響分析、InvestigationRequest生成 |
| コーディングエージェント | 6章 | Claude Agent SDK | コード解析、ボトムアップ影響分析、改修実行、PR作成 |

影響調査における連携の流れ：

```
┌─────────────────────────────────────────────────────────────────────┐
│ 5章: アプリ内AI（Mastra Agent）                                      │
│                                                                     │
│  impact_analysis Tool                                               │
│    1. 正本のリンクを辿ってトップダウン分析                            │
│    2. 影響候補のentry_pointを特定                                    │
│    3. InvestigationRequestを生成                                    │
│                        │                                            │
└────────────────────────┼────────────────────────────────────────────┘
                         │ ジョブ投入
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6章: コーディングエージェント（Claude Agent SDK）                    │
│                                                                     │
│  InvestigationRequest を受け取り:                                   │
│    1. entry_pointからコード依存関係を解析                            │
│    2. 影響ファイルを特定（ボトムアップ分析）                          │
│    3. InvestigationResultを返却                                     │
│                        │                                            │
└────────────────────────┼────────────────────────────────────────────┘
                         │ 結果返却
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5章: アプリ内AI（結果の突合）                                        │
│                                                                     │
│    1. トップダウン結果とボトムアップ結果を突合                        │
│    2. 矛盾・不足があれば疑義リンクを生成                              │
│    3. allow_paths候補を生成                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

この分離により、アプリ内AIは「正本ベースの分析」に集中し、コーディングエージェントは「コードベースの分析と実装」に集中できる。

---

## 5.1 設計思想

### 単一Agent・複数Tool構成

従来は機能ごとに独立したAIエージェント（要件整形AI、影響調査AI、Critic AI等）を想定していたが、以下の理由から「単一のAgent + 機能別Tool群」の構成を採用する。

| 観点 | 独立Agent構成 | 単一Agent + Tool群 |
|------|--------------|-------------------|
| コードベース | エージェントごとに分散 | 1つのAgentコードで集中管理 |
| コンテキスト共有 | エージェント間で受け渡し必要 | セッション内で自然に維持 |
| 機能の組み合わせ | 別々に呼び出し | 同一チャット内で連続実行可能 |
| PR参照 | 各エージェントで個別実装 | Agent起動時に1回注入 |

この設計により、ユーザーは1つのチャットUIから「BT登録 → BR登録 → SF/SR/AC生成 → 影響調査」といった一連の作業を、文脈を維持したまま進められる。

### 登録方式の併存

要件管理DBアプリは、すべてのデータに対して2つの登録方式を提供する。

| 方式 | 用途 | UI |
|------|------|-----|
| マニュアル登録 | 内容が明確、手打ちしたい場合 | 従来のフォーム画面 |
| チャット登録 | 曖昧な入力を整形したい、文章で指示したい場合 | AIチャットUI |

チャット登録はマニュアル登録を代替するものではなく、ユーザーの好みや状況に応じて選べる補助手段である。どちらの方式でも、最終的に登録されるデータの形式は同じ。

---

## 5.2 アーキテクチャ

### 技術選定

AIエージェント基盤としてMastraを採用する。Mastraは以下の機能を提供し、本設計の要件を満たす。

| Mastra機能 | 本設計での用途 |
|-----------|---------------|
| Agent | 統合AIエージェントの実装 |
| Tools | 機能別Tool（登録支援、影響調査等）の定義 |
| Workflow | 複数Toolの連携フロー定義 |
| Memory | チャットセッション内のコンテキスト維持 |
| Structured Output | DB登録用のYAML/JSON生成 |

### 全体構成

```
┌─────────────────────────────────────────────────────────────────┐
│ 要件管理DBアプリ（Next.js）                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐                            │
│  │ マニュアル    │    │ AIチャット   │                            │
│  │ 登録画面     │    │ UI          │                            │
│  └──────┬──────┘    └──────┬──────┘                            │
│         │                  │                                    │
│         │                  ▼                                    │
│         │         ┌───────────────────────────────────┐        │
│         │         │ 統合Agent（Mastra）                │        │
│         │         │                                   │        │
│         │         │  ┌─────────────────────────────┐  │        │
│         │         │  │ Tool群                      │  │        │
│         │         │  │ ・bt_draft（BT草案生成）     │  │        │
│         │         │  │ ・br_draft（BR草案生成）     │  │        │
│         │         │  │ ・system_draft（SF/SR/AC）  │  │        │
│         │         │  │ ・dd_draft（DD）│ │        │
│         │         │  │ ・impact_analysis（影響調査）│  │        │
│         │         │  │ ・impact_review（範囲レビュー）│ │        │
│         │         │  │ ・critic_check（品質チェック）│ │        │
│         │         │  │ ・concept_extract（概念抽出）│  │        │
│         │         │  │ ・db_design（DB設計支援）   │  │        │
│         │         │  │ ・test_generate（テスト生成）│  │        │
│         │         │  └─────────────────────────────┘  │        │
│         │         │                                   │        │
│         │         │  ┌─────────────────────────────┐  │        │
│         │         │  │ Context Provider             │  │        │
│         │         │  │ ・PR（tech_stack_profile等）  │  │        │
│         │         │  │ ・現在の階層位置              │  │        │
│         │         │  │ ・既存要件・概念辞書          │  │        │
│         │         │  └─────────────────────────────┘  │        │
│         │         └───────────────────────────────────┘        │
│         │                  │                                    │
│         ▼                  ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 正本API（Supabase）                                      │   │
│  │ ・草案の一時保存（draft状態）                             │   │
│  │ ・確定後の正本登録                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Agent定義

```typescript
import { Agent } from '@mastra/core';

export const requirementsAgent = new Agent({
  name: 'requirements-agent',
  instructions: `
    あなたは要件管理DBの登録支援AIです。
    ユーザーの自然言語入力を、構造化された要件（BT/BR/SF/SR/AC/DD）に整形します。
    
    ## 行動原則
    - 草案を生成するが、勝手にDBに保存しない（ユーザーの確定操作を待つ）
    - 曖昧な入力は明確化のための質問をする
    - 生成した草案の根拠と未確定事項を明示する
    - PRのtech_stack_profileとcoding_conventionsに従う
    
    ## コンテキスト
    起動時に以下が注入されます：
    - プロダクト要件（PR）
    - 現在の階層位置（BD/BT/BR/SD/SF等）
    - 関連する既存要件
    - 概念辞書
  `,
  model: {
    provider: 'anthropic',
    name: 'claude-sonnet-4-20250514',
  },
  tools: {
    btDraftTool,
    brDraftTool,
    systemDraftTool,
    ddDraftTool,
    impactAnalysisTool,
    criticCheckTool,
    conceptExtractTool,
    commitDraftTool,
    searchRequirementsTool,
    listBusinessDomainsTool,
    getLinksTool,
    getContextTool,
    getProductRequirementTool,
  },
});
```

---

## 5.3 Tool一覧

統合Agentが使用するToolを定義する。各Toolは特定の機能を担い、旧設計のエージェント（要件整形AI、影響調査AI等）を包含する。

### 登録支援Tool群（実装済み）

| Tool名 | 入力 | 出力 | 責務 |
|--------|------|------|------|
| bt_draft | 自然文、BD ID、projectId | BT草案、概念候補 | 業務タスクの草案生成 |
| br_draft | 自然文、BT ID、projectId | BR草案 | 業務要件の草案生成 |
| system_draft | BR ID群、additionalContext、projectId | SF/SR/AC草案 | システム側要件の一括草案生成 |
| dd_draft | SF ID、自然文、projectId | DD草案（構造化I/O含む） | DD（Design Document）の草案生成 |
| concept_extract | targetId、projectId | 概念候補リスト | テキストから概念を抽出 |

### 分析・検証Tool群（実装済み / Phase 5以降）

| Tool名 | 入力 | 出力 | 責務 | 実装状況 |
|--------|------|------|------|---------|
| impact_analysis | CR ID、projectId | 影響BR/SF/SR/AC、疑義リンク | トップダウン影響分析（CR → BR → SF → SR → AC） | 実装済み |
| critic_check | targetIds、checkLevel | 指摘リスト、修正案 | 曖昧さ・矛盾・漏れの検出 | 実装済み |
| impact_review | allow_paths候補 | 絞り込み提案、残存リスク | N:N爆発時の影響範囲レビュー | Phase 5 |
| db_design | SR/AC、既存データモデル | 論理データモデル案、制約案 | データ設計の補完・検証 | Phase 5以降 |
| test_generate | AC、テスト方針 | テストケース、テストデータ案 | ACからテストを自動生成 | Phase 5以降 |

### ユーティリティTool群（実装済み）

| Tool名 | 入力 | 出力 | 責務 |
|--------|------|------|------|
| commit_draft | draftId、type、content | 正本ID | 草案の正本登録（確定） |
| search_requirements | 検索クエリ、projectId | 要件リスト | 既存要件の全文検索 |
| list_business_domains | projectId | BD一覧 | 業務領域一覧取得 |
| get_links | 要件ID | リンクリスト | 要件間リンクの取得 |
| get_context | なし | PR、現在位置、既存要件 | コンテキスト情報の取得 |
| get_product_requirement | projectId | PR全体 | 技術スタック・コーディング規約の取得 |

### 同期・フィードバックTool群（Phase 5以降）

コーディングエージェントとの双方向フィードバックを実現するためのTool群。Phase 5以降で実装予定。

| Tool名 | 入力 | 出力 | 責務 |
|--------|------|------|------|
| receive_suggestion | SuggestionFromAgent | 受付確認、通知 | コーディングエージェントからの改善提案を受け取る |
| sync_check | 対象DD ID（任意）、チェック観点（任意） | 同期チェック結果、不一致箇所、推奨アクション | コードと正本（システム要件・設計）の同期性をオンデマンドでチェック |

---

## 5.4 Tool定義詳細

### bt_draft（BT草案生成）

```typescript
const btDraftTool = createTool({
  id: 'bt_draft',
  description: '業務タスク（BT）の草案を生成する',
  inputSchema: z.object({
    naturalLanguageInput: z.string().describe('業務の説明（自然文）'),
    bdId: z.string().describe('親となる業務領域ID'),
    generateBR: z.boolean().optional().describe('BRも同時に生成するか'),
  }),
  execute: async ({ naturalLanguageInput, bdId, generateBR }, { context }) => {
    // 1. コンテキスト取得
    const pr = await context.getProductRequirement();
    const existingBTs = await context.getBTsByBD(bdId);
    const concepts = await context.getConceptDictionary();
    
    // 2. LLMで草案生成
    const btDraft = await generateWithLLM({
      template: 'bt_draft',
      input: naturalLanguageInput,
      context: { pr, existingBTs, concepts },
    });
    
    // 3. 概念候補を抽出
    const conceptCandidates = await extractConcepts(btDraft, concepts);
    
    // 4. BRも生成する場合
    let brDrafts = [];
    if (generateBR) {
      brDrafts = await generateWithLLM({
        template: 'br_draft_from_bt',
        input: btDraft,
        context: { pr },
      });
    }
    
    // 5. 未確定事項を抽出
    const uncertainties = extractUncertainties(btDraft, brDrafts);
    
    return {
      btDraft,
      brDrafts,
      conceptCandidates,
      uncertainties,
      previewAvailable: true,
    };
  },
});
```

### system_draft（SF/SR/AC一括生成）

```typescript
const systemDraftTool = createTool({
  id: 'system_draft',
  description: 'BR群からSF/SR/ACを一括生成する',
  inputSchema: z.object({
    brIds: z.array(z.string()).describe('対象BR IDのリスト'),
    additionalContext: z.string().optional().describe('追加の指示や制約'),
  }),
  execute: async ({ brIds, additionalContext }, { context }) => {
    // 1. コンテキスト取得
    const pr = await context.getProductRequirement();
    const brs = await context.getBRsByIds(brIds);
    const existingSFs = await context.getRelatedSFs(brIds);
    
    // 2. PRのtech_stack_profileを参照して生成
    const systemDrafts = await generateWithLLM({
      template: 'system_draft',
      input: { brs, additionalContext },
      context: {
        pr,
        existingSFs,
        techStack: pr.tech_stack_profile,
        codingConventions: pr.coding_conventions,
      },
    });
    
    // 3. ACはSRのtypeに応じたGWTテンプレートを使用
    for (const sf of systemDrafts.sfs) {
      for (const sr of sf.srs) {
        sr.acs = await generateACsByType(sr, pr);
      }
    }
    
    // 4. DDのentry_pointはcoding_conventionsに従う
    for (const sf of systemDrafts.sfs) {
      sf.implUnits = await generateImplUnitPaths(sf, pr.coding_conventions);
    }
    
    // 5. realizesリンクを生成
    const realizesLinks = generateRealizesLinks(brs, systemDrafts.sfs);
    
    return {
      sfDrafts: systemDrafts.sfs,
      realizesLinks,
      uncertainties: systemDrafts.uncertainties,
      previewAvailable: true,
    };
  },
});
```

### impact_analysis（影響調査）

```typescript
const impactAnalysisTool = createTool({
  id: 'impact_analysis',
  description: '変更要求に対する影響範囲を分析する',
  inputSchema: z.object({
    crId: z.string().describe('変更要求ID'),
    changeDescription: z.string().describe('変更内容の説明'),
    targetIds: z.array(z.string()).optional().describe('明示的な対象要件ID'),
  }),
  execute: async ({ crId, changeDescription, targetIds }, { context }) => {
    // 1. トップダウン分析（正本ベース）
    const topDownResult = await analyzeTopDown({
      crId,
      changeDescription,
      targetIds,
      requirements: await context.getRequirements(),
      links: await context.getLinks(),
    });
    
    // 2. コーディングエージェント向けInvestigationRequest生成
    const investigationRequest = buildInvestigationRequest({
      crId,
      entryPoints: topDownResult.affectedEntryPoints,
      changeContext: {
        summary: changeDescription,
        affected_concepts: topDownResult.relatedConcepts,
        expected_change_types: topDownResult.expectedChangeTypes,
      },
      requirementsContext: {
        product_requirement: await context.getProductRequirement(),
        business_requirements: topDownResult.affectedBRs,
        system_requirements: topDownResult.affectedSRs,
        acceptance_criteria: topDownResult.affectedACs,
      },
    });
    
    // 3. 疑義候補を抽出
    const suspectCandidates = detectSuspectLinks(topDownResult);
    
    return {
      topDownResult,
      investigationRequest,
      suspectCandidates,
      nextStep: 'コーディングエージェントに調査ジョブを投入してください',
    };
  },
});
```

### critic_check（品質チェック）

```typescript
const criticCheckTool = createTool({
  id: 'critic_check',
  description: '要件の曖昧さ・矛盾・漏れを検出する',
  inputSchema: z.object({
    targetIds: z.array(z.string()).describe('チェック対象の要件ID'),
    checkLevel: z.enum(['quick', 'standard', 'thorough']).optional(),
  }),
  execute: async ({ targetIds, checkLevel = 'standard' }, { context }) => {
    const targets = await context.getRequirementsByIds(targetIds);
    const pr = await context.getProductRequirement();
    
    // 検証ルールを適用
    const issues = [];
    
    // 1. 曖昧性チェック
    for (const target of targets) {
      const ambiguities = checkAmbiguity(target);
      issues.push(...ambiguities);
    }
    
    // 2. 検証可能性チェック（AC向け）
    for (const ac of targets.filter(t => t.type === 'ac')) {
      const verifiability = checkVerifiability(ac);
      issues.push(...verifiability);
    }
    
    // 3. 整合性チェック（リンク間）
    const links = await context.getLinksByTargets(targetIds);
    const inconsistencies = checkConsistency(targets, links);
    issues.push(...inconsistencies);
    
    // 4. PRとの整合性チェック
    const prMismatches = checkPRAlignment(targets, pr);
    issues.push(...prMismatches);
    
    // 5. 致命度でソート
    issues.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    
    // 6. 修正案を生成
    const suggestions = await generateSuggestions(issues, targets);
    
    return {
      issues,
      suggestions,
      summary: {
        critical: issues.filter(i => i.severity === 'critical').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
      },
    };
  },
});
```

---

## 5.5 コンテキスト注入

チャットセッション開始時に、以下のコンテキストをAgentに自動注入する。これにより、ユーザーは毎回「Next.jsで開発している」「請求領域の話をしている」等の前提を説明する必要がない。

### 注入されるコンテキスト

| コンテキスト | 内容 | 用途 |
|-------------|------|------|
| product_requirement | PR全体（tech_stack_profile、coding_conventions含む） | 技術選定、命名規則の遵守 |
| current_location | 現在のUI位置（例：BD-BIL > BT-BIL-001） | 親子関係の自動設定 |
| related_requirements | 現在位置に関連する既存要件 | 重複回避、参照提案 |
| concept_dictionary | 概念辞書（プロジェクト全体） | 用語の統一、概念リンク |
| recent_drafts | 同一セッションで生成した未確定草案 | 連続作業の文脈維持 |

### 注入のタイミング

```typescript
// チャットUI起動時
async function initializeChatSession(location: UILocation): Promise<ChatSession> {
  const context = await buildContext(location);
  
  const session = await requirementsAgent.createSession({
    initialContext: {
      product_requirement: context.pr,
      current_location: {
        type: location.type,  // 'bd' | 'bt' | 'br' | 'sd' | 'sf' | 'sr' | 'cr'
        id: location.id,
        breadcrumb: location.breadcrumb,
      },
      related_requirements: context.relatedRequirements,
      concept_dictionary: context.concepts,
    },
    systemMessage: buildSystemMessage(location),
  });
  
  return session;
}

// 位置に応じたシステムメッセージ
function buildSystemMessage(location: UILocation): string {
  switch (location.type) {
    case 'bd':
      return `業務領域「${location.name}」に業務タスクを追加します。どのような業務を登録しますか？`;
    case 'bt':
      return `業務タスク「${location.name}」に業務要件を追加します。この業務で達成したいことは何ですか？`;
    case 'cr':
      return `変更要求「${location.name}」の影響調査を行います。変更内容を教えてください。`;
    // ...
  }
}
```

---

## 5.6 チャットUIの設計

### 画面構成

```
┌─────────────────────────────────────────────────────────────────┐
│ AIアシスタント - BD-BIL（請求）                          [×]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ クイックアクション                                      │   │
│  │ [BT登録] [BR登録] [SF/SR/AC生成] [影響調査] [品質チェック] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ チャット履歴                                            │   │
│  │                                                         │   │
│  │ System: BD-BIL（請求）に業務タスクを追加します。         │   │
│  │         どのような業務を登録しますか？                   │   │
│  │                                                         │   │
│  │ User: 請求書を発行してメールで送る業務                   │   │
│  │                                                         │   │
│  │ Agent: BT草案を生成しました。                           │   │
│  │        ┌─────────────────────────────────┐              │   │
│  │        │ 草案プレビュー               │              │   │
│  │        │ BT-BIL-002: 請求書発行・送付    │              │   │
│  │        │ [詳細を見る]                    │              │   │
│  │        └─────────────────────────────────┘              │   │
│  │        [確定] [編集] [BRも生成]                          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [メッセージを入力...]                           [送信]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### クイックアクション

クイックアクションは、よく使う操作をワンクリックで実行するためのショートカット。押下すると、対応するToolが呼び出され、必要に応じてAgentが追加質問を行う。

| アクション | 呼び出されるTool | 動作 |
|-----------|-----------------|------|
| BT登録 | bt_draft | 「業務の説明を入力してください」とプロンプト |
| BR登録 | br_draft | 「達成したい業務要件を説明してください」とプロンプト |
| SF/SR/AC生成 | system_draft | 現在のBRからシステム側要件を一括生成 |
| 影響調査 | impact_analysis | 現在のCRに対して影響分析を開始 |
| 品質チェック | critic_check | 現在表示中の要件をチェック |
| 同期チェック | sync_check | コードと正本の同期性をチェック |

### 草案プレビュー

Agentが生成した草案は、チャット内に埋め込まれたプレビューカードとして表示する。プレビューカードから以下の操作が可能。

| 操作 | 動作 |
|------|------|
| 詳細を見る | 草案の全フィールドをモーダルで表示 |
| 確定 | commit_draft Toolを呼び出し、正本に登録 |
| 編集 | マニュアル登録画面を草案データで開く |
| やり直し | 草案を破棄し、再生成を依頼 |

### 草案の状態管理

草案は以下の状態を持つ。

```
draft（未確定）→ committed（確定済み）
       ↓
   discarded（破棄）
```

同一セッション内で生成された草案は、セッションが閉じられるまで保持される。セッション終了時に未確定の草案がある場合、ユーザーに確認を求める。

---

## 5.7 草案確定フロー

### 単一草案の確定

```
User: 請求書発行の業務を登録して

Agent: [bt_draft Tool呼び出し]
       BT草案を生成しました。
       
       [草案プレビュー: BT-BIL-002]
       
       [確定] [編集] [BRも生成]

User: [確定]をクリック

Agent: [commit_draft Tool呼び出し]
       BT-BIL-002を正本に登録しました。
       
       続けてBRを追加しますか？
       [BRを追加] [終了]
```

### 一括生成の確定

```
User: この業務に対してSF/SR/ACを作って

Agent: [system_draft Tool呼び出し]
       SF/SR/ACの草案を生成しました。
       
       [草案プレビュー]
       ├─ SF-BIL-020: 請求書送付機能
       │   ├─ SR-BIL-020: 請求書をメールで送付できる
       │   │   ├─ AC-BIL-020-01: 正常系
       │   │   └─ AC-BIL-020-02: 異常系
       │   └─ DD:
       │       ├─ IU-BIL-020-01: 送付画面
       │       └─ IU-BIL-020-02: 送付API
       └─ realizesリンク: BR-BIL-002 → SF-BIL-020
       
       [全て確定] [個別に確認] [やり直し]

User: [個別に確認]をクリック

Agent: では順番に確認していきます。
       
       まずSF-BIL-020について：
       [草案詳細: SF-BIL-020]
       
       [確定] [編集] [スキップ]
```

### 確定前の品質チェック

一括確定時は、自動でcritic_checkを実行し、問題があれば警告を表示する。

```
User: [全て確定]をクリック

Agent: [critic_check Tool呼び出し]
       確定前にチェックを実行しました。
       
       1件の警告があります：
       - AC-BIL-020-02の「エラー時」の定義が曖昧です
         → 「メール送信失敗時」に修正することを推奨
       
       [警告を無視して確定] [修正してから確定]
```

---

## 5.8 設計決定ログ

Agentが行った推論や補完は「設計決定ログ」として保存する。これにより、後から「なぜこの設計になったか」を追跡できる。

### ログ構造

```typescript
interface DesignDecisionLog {
  decision_id: string;
  created_at: string;
  created_by: 'agent' | 'human';
  
  // 何についての決定か
  context: {
    target_type: 'bt' | 'br' | 'sf' | 'sr' | 'ac' | 'impl_unit';
    target_id: string;
    field?: string;  // 特定フィールドについての決定の場合
  };
  
  // 決定内容
  decision: string;
  
  // 根拠
  rationale: {
    type: 'pr_reference' | 'ac_reference' | 'convention' | 'inference' | 'user_input';
    reference?: string;  // 参照元のID等
    explanation: string;
  };
  
  // 状態
  status: 'proposed' | 'confirmed' | 'rejected';
  confirmed_by?: string;
  confirmed_at?: string;
}
```

### ログの生成タイミング

| シーン | ログ生成 |
|--------|---------|
| 草案生成時 | Agentが推論で補完した箇所にproposed状態でログを付与 |
| 確定時 | proposed状態のログをconfirmedに更新 |
| 編集時 | 人間が変更した箇所にhumanソースでログを追加 |

### 例

```yaml
decision_id: DEC-2025-001
created_at: "2025-01-25T10:30:00Z"
created_by: agent

context:
  target_type: impl_unit
  target_id: IU-BIL-020-02
  field: entry_point

decision: "エントリポイントを /api/billing/invoices/[id]/send.ts に設定"

rationale:
  type: pr_reference
  reference: PR-001.coding_conventions.directory_structure
  explanation: |
    PRのcoding_conventionsでfeature-based構造が指定されているため、
    /api/billing/ 配下にAPIを配置。
    動的ルーティングには[id]を使用（Next.js App Router規約）。

status: confirmed
confirmed_by: user-123
confirmed_at: "2025-01-25T10:35:00Z"
```

---

## 5.9 エラーハンドリング

### Tool実行失敗時

```
User: SF/SR/ACを生成して

Agent: [system_draft Tool呼び出し]
       
       生成中にエラーが発生しました。
       
       原因：対象のBRが見つかりません。
       現在の位置（BT-BIL-001）に関連するBRを先に登録してください。
       
       [BRを登録] [別のBTを選択]
```

### 曖昧な入力時

```
User: 請求関連の機能を追加して

Agent: 「請求関連の機能」をもう少し具体的に教えてください。
       
       例えば：
       - 請求書を発行する
       - 請求書を顧客にメールで送る
       - 入金を消し込む
       - 請求残高を確認する
       
       どのような業務を追加しますか？
```

### コンテキスト不足時

```
User: これのテストを作って

Agent: どの要件のテストを生成しますか？
       
       現在表示中の要件：
       - SR-BIL-001: 請求書PDFに登録番号を出力
       - SR-BIL-002: 請求書をメールで送付
       
       [SR-BIL-001] [SR-BIL-002] [両方]
```

---

## 5.10 UXと少人数開発への効果

本設計が目指すUXと少人数開発への効果を整理する。

### UXへの効果

| 効果 | 実現方法 |
|------|---------|
| 迷いの除去 | コンテキスト自動注入により、前提説明が不要 |
| やり直しの削減 | critic_checkによる事前検証、草案状態での編集 |
| 結果の見える化 | 草案プレビュー、設計決定ログ |
| 柔軟な作業フロー | 自然言語でもクイックアクションでも同じことができる |

### 少人数開発への効果

| 効果 | 実現方法 |
|------|---------|
| 専門家不足の補完 | PRに従った一貫性のある生成、品質チェックの自動化 |
| 手戻りの局所化 | 草案段階での検証、影響調査の標準化 |
| 自動検証の標準化 | critic_check、test_generateによる品質の下限確保 |
| 属人性の排除 | 設計決定ログによる判断根拠の可視化 |

### 共通原則

すべてのToolに共通する行動原則：

| 原則 | 理由 |
|------|------|
| 勝手に確定しない | 誤登録防止、人間の検証機会確保 |
| 根拠と未確定を分けて提示する | 判断の透明性、編集箇所の明確化 |
| PRに従う | プロジェクト全体の一貫性確保 |
| 曖昧な入力は明確化を促す | 品質の下限確保、手戻り防止 |
