# PRDフィードバック

## 概要
**作成日**: 2025-01-28
**対象**: docs/PRD.md
**目的**: 純粋な議論として抽出したクリティカルな論点と、その解決方向性の提示

---

## 議論の経緯

### 議論のアプローチ
- PRDをクリティカルな視点でレビュー
- 技術的・運用的な実現可能性に焦点を当てる
- 問題提起だけでなく、解決方向性も併せて提示

### 議論のフォーマット
各論点について以下を整理:
1. **課題**: 何が問題か
2. **根拠**: なぜ問題なのか
3. **解決方向性**: どう解決するか
4. **PRD修正案**: 具体的にどこをどう修正すべきか

---

## 論点一覧

### ✅ 2点目：正本とコードの二重管理問題（重要）

#### 課題
**コード→意図へのフィードバック経路が不足している**

この課題には2つの異なるシナリオがある:

**シナリオ1: エージェントからの改善提案を受け取る口がない**
- コーディングエージェントが実装中に「この設計よりこっちの方がいい」と気づくことがある
- 現行PRDには、この提案をシステム的に受け取る仕組みがない
- コミットメッセージやPRコメントで人間が発見する必要がある
- エージェントからの提案が散逸してしまう可能性がある

**シナリオ2: ズレの検知手法が未定義**
- エージェントが設計に従わずに実装したケースを、どう検知するか
- エントリファイルの位置変更だけでなく、設計との不一致も検知する必要がある
- 全部論理的に出すのは難しい
- オンデマンドでチェックできる仕組みが必要

#### 根拠

**シナリオ1の根拠**:

コーディングエージェントが実装中に気づく可能性のある改善例:
- 「この正規表現、複雑すぎてパフォーマンス悪いからライブラリ使った方がいい」
- 「このAPI、RESTfulじゃないから統合した方がいい」
- 「このバリデーション、実は共通処理にあるから使った方がいい」
- 「実装してみたら、この設計前提が間違ってた気がする」

**シナリオ2の根拠**:

| ズレの種類 | 具体例 | 検知難易度 |
|-----------|--------|----------|
| エントリファイルの位置変更 | `app/api/user/route.ts` → `app/api/users/[id]/route.ts` | 🟢 比較的容易（ファイルパスで判断） |
| 設計に従わない実装 | 「DBトランザクションは必ず張る」→実装で張ってない | 🟡 中程度（コード解析と設計の照合） |
| 暗黙の前提が違う | 設計: 「税計算は共通処理使う」→実装: 「直書き」 | 🟡 中程度（パターンマッチング） |
| 実装が設計より複雑 | 設計: 「シンプルなif文」→実装: 「複雑な状態マシン」 | 🔴 困難（複雑性の定量化が必要） |

#### 解決方向性

**シナリオ1の解決策**: エージェントからの改善提案フロー

Mastra Agent（要件管理DB側のエージェント）が窓口として集約し、チャットUIで第三者的アドバイスを提供する。

```
コーディングエージェント
  実装中に気づき → SuggestionFromAgentを生成
         ↓
Mastra Agent（要件管理DB）
  提案を受信 → 一時保存
         ↓
ユーザーのチャットUI
  📔 通知: 「3件の提案が届いています」
         ↓
[ヘルプ]ボタン → Mastra Agentに相談
         ↓
Agentの第三者的アドバイス
  「コーディングエージェントはこう言っていますが、
   XXの方がいいと思いますね」
```

**メリット**:
- 既存のチャットUIを活用、新しい画面不要
- Mastra AgentがPRや既存の正本を参照して、判断材料を提示
- ユーザーは「全部自分で判断」しなくていい
- 大量の提案が来ても、Agentがフィルタリングしてくれる

**シナリオ2の解決策**: オンデマンド同期チェック

チャットで「コードとの同期性をチェックして」と指示すると:
1. Mastra Agentがチェック対象の実装単位SDを特定
2. チェックリクエストをコーディングエージェントに送信
3. コーディングエージェントがSupabaseからシステム要件・設計を取得
4. エントリファイルのコードを解析し、両者を照合
5. 不一致箇所があればチャットにFB

**メリット**:
- オンデマンド実行なので、必要な時だけチェック
- 無駄な通知がない
- AIの能力を活かした柔軟なチェック
- システムを複雑にしない（既存のチャットUIを活用）

#### PRD修正案

**5章「AIエージェント構成」のTool一覧に追加**:

```typescript
// 既存のTool群に追加
const receiveSuggestionTool = createTool({
  id: 'receive_suggestion',
  description: 'コーディングエージェントからの改善提案を受け取る',
  inputSchema: z.object({
    suggestion: z.object({
      suggestion_id: z.string(),
      type: z.enum(['design_improvement', 'implementation_observation', 'inconsistency_detected']),
      title: z.string(),
      description: z.string(),
      affected_items: z.object({
        impl_unit_id: z.string().optional(),
        sr_ids: z.array(z.string()).optional(),
        entry_point: z.string().optional(),
      }),
      rationale: z.object({
        why: z.string(),
        evidence: z.array(z.string()).optional(),
      }),
      recommended_action: z.object({
        type: z.enum(['update_spec', 'refactor_code', 'create_ticket', 'information_only']),
        details: z.string(),
      }),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
    }),
  }),
  execute: async ({ suggestion }, { context }) => {
    // 提案を一時保存
    await context.saveSuggestion(suggestion);

    // 通知を生成
    return {
      message: 'コーディングエージェントからの提案を受け付けました',
      suggestion_id: suggestion.suggestion_id,
      priority: suggestion.priority,
    };
  },
});

const syncCheckTool = createTool({
  id: 'sync_check',
  description: 'コードと正本（システム要件・設計）の同期性をチェックする',
  inputSchema: z.object({
    target_impl_units: z.array(z.string()).optional().describe('チェック対象の実装単位SD ID'),
    focus_areas: z.array(z.enum(['structural', 'implementation', 'semantic'])).optional(),
    time_range: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
  }),
  execute: async ({ target_impl_units, focus_areas, time_range }, { context }) => {
    // チェック対象の実装単位SDを特定
    const targets = await context.getImplUnits(target_impl_units, time_range);

    // コーディングエージェントにチェックリクエストを送信
    const request: SyncCheckRequest = {
      check_id: generateId(),
      targets: targets.map(t => ({
        impl_unit_id: t.impl_unit_id,
        entry_point: t.entry_point,
        spec: {
          system_requirements: t.system_requirements,
          design: t.design,
        },
      })),
      focus_areas: focus_areas || ['structural', 'implementation'],
    };

    // コーディングエージェントに依頼（実装は6章で定義）
    const response = await context.forwardToCodingAgent(request);

    // 結果をユーザーに分かりやすく提示
    return {
      summary: response.summary,
      findings: response.results,
      recommendations: await generateRecommendations(response.results, context),
    };
  },
});
```

**5章「チャットUIの設計」に追加**:

```markdown
### 5.X 提案管理与同期チェック

#### 提案通知
エージェントからの提案が届いている場合、チャットUIに通知を表示:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📔 3件の提案が届いています                                        │
│                                                                 │
│ 最新: [Critical] 設計の改善提案: 税計算の共通化                  │
│                                                                 │
│ [提案を確認] [あとで見る]                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### ヘルプ機能
[ヘルプ]ボタンでMastra Agentに第三者的アドバイスを求めることができる。

対話例:

```
User: [ヘルプ]ボタンをクリック
「コーディングエージェントから提案が来てるんだけど、どうすればいい？」

Agent: コーディングエージェントからの提案を確認しましたね。
3件の提案がありますが、優先度の高い1件について説明します。

📋 提案: 税計算の共通化
コーディングエージェントは「税計算ロジックが分散しているので、
共通処理として切り出した方が保守性が上がる」と言っています。

💡 私の見解:
これは採用することをおすすめします。理由は以下の通りです：
- PRの品質目標で「保守性」が強調されています
- 今後、税率変更や計算ロジックの変更があった場合、
  共通化されていないと修正箇所が多くなります
- 実装単位SDには「共通処理の検討」という記述があり、
  この提案は設計意図に合致します

[採用して正本更新] [却下] [他の提案も見る]

いかがでしょうか？
```

#### 同期チェッククイックアクション
チャットUIに「コードとの同期性をチェック」クイックアクションを追加。

対話例:

```
User: [コードとの同期性をチェック] をクリック

Agent: 同期チェックを開始します。

対象:
• 最近更新した実装単位SD: 5件
• 期間: 過去7日間

コーディングエージェントに確認依頼を送りました...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 同期チェック完了（所要時間: 約30秒）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 サマリー
チェック対象: 5件
同期済み: 3件 (✓ IU-BIL-010-02, IU-FI-001-01, IU-BIL-020-01)
不一致: 2件 (⚠ IU-BIL-010-01, IU-MM-005-01)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 1/2 IU-BIL-010-01: 請求書発行API

不一致の内訳:
• [Critical] トランザクション処理の欠如
  設計: 「トランザクション必須」
  実際: トランザクションなし

  💡 原因: 共通処理ラッパーを使用していないため
  📝 推奨: コードを修正し、共通処理ラッパーを使用してください

• [Info] エラーハンドリングの追加
  設計: 明示的なエラーハンドリング
  実際: try-catchの使用有

  💡 これは正常です。実装が設計を満たしています。

─────────────────────────────────────────────────

[正本を修正] [コードを修正] [詳細確認]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### クイックアクション一覧（更新）

| アクション | 呼び出されるTool | 動作 |
|-----------|-----------------|------|
| BT登録 | bt_draft | 「業務の説明を入力してください」とプロンプト |
| BR登録 | br_draft | 「達成したい業務要件を説明してください」とプロンプト |
| SF/SR/AC生成 | system_draft | 現在のBRからシステム側要件を一括生成 |
| 影響調査 | impact_analysis | 現在のCRに対して影響分析を開始 |
| 品質チェック | critic_check | 現在表示中の要件をチェック |
| **同期チェック** | **sync_check** | **コードと正本の同期性をチェック** |
```

**6章「コーディングエージェントとの連携」に追加**:

```typescript
// 6章に追加: コーディングエージェントからの提案データモデル
interface SuggestionFromAgent {
  suggestion_id: string;

  // 提案の分類
  type: 'design_improvement' | 'implementation_observation' | 'inconsistency_detected';

  // 提案内容
  title: string;
  description: string;

  // 影響範囲
  affected_items: {
    impl_unit_id?: string;
    sr_ids?: string[];
    entry_point?: string;
  };

  // 根拠
  rationale: {
    why: string;
    evidence?: string[];
  };

  // 推奨アクション
  recommended_action: {
    type: 'update_spec' | 'refactor_code' | 'create_ticket' | 'information_only';
    details: string;
  };

  // 優先度
  priority: 'critical' | 'high' | 'medium' | 'low';

  // ステータス
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
}

// 6章に追加: 同期チェックリクエスト/レスポンス
interface SyncCheckRequest {
  check_id: string;

  targets: {
    impl_unit_id: string;
    entry_point: string;
    spec: {
      system_requirements: object[];
      design: object;
    };
  }[];

  focus_areas?: (
    'structural'      |  // エントリファイルの存在・パス
    'implementation'  |  // 設計に従った実装
    'semantic'          // 意図的な整合性
  )[];
}

interface SyncCheckResponse {
  check_id: string;

  results: {
    impl_unit_id: string;
    status: 'synced' | 'unsynced';

    findings?: {
      category: 'entry_point' | 'implementation' | 'semantic';
      severity: 'critical' | 'warning' | 'info';

      description: string;

      expected: string;
      actual: string;

      suggestion?: string;
      recommended_action: 'update_spec' | 'fix_code' | 'needs_review';
    }[];
  }[];

  summary: {
    total: number;
    synced: number;
    unsynced: number;
    critical_issues: number;
  };
}

// 6章に追加: コーディングエージェントが実装すべき同期チェック処理
async function handleSyncCheckRequest(request: SyncCheckRequest): Promise<SyncCheckResponse> {
  const results = await Promise.all(
    request.targets.map(async (target) => {
      const findings: SyncCheckResponse['results'][0]['findings'] = [];

      // L1: 構造チェック（エントリファイルの存在）
      if (request.focus_areas?.includes('structural')) {
        const exists = await fileExists(target.entry_point);
        if (!exists) {
          findings.push({
            category: 'entry_point',
            severity: 'critical',
            description: 'エントリファイルが存在しません',
            expected: `ファイルが存在する: ${target.entry_point}`,
            actual: 'ファイルが存在しない',
            recommended_action: 'update_spec',
          });
        }
      }

      // L2: 実装パターンチェック（設計に従った実装）
      if (request.focus_areas?.includes('implementation')) {
        const code = await readFile(target.entry_point);

        // トランザクションチェック
        if (target.spec.design.requires_transaction) {
          const hasTransaction = await checkTransactionUsage(code);
          if (!hasTransaction) {
            findings.push({
              category: 'implementation',
              severity: 'critical',
              description: '設計ではトランザクションが必須ですが、実装に含まれていません',
              expected: 'トランザクション処理がある',
              actual: 'トランザクション処理がない',
              suggestion: 'トランザクション処理を追加してください',
              recommended_action: 'fix_code',
            });
          }
        }

        // 認可チェック
        if (target.spec.design.authorization) {
          const hasAuthCheck = await checkAuthorizationInCode(code);
          if (!hasAuthCheck) {
            findings.push({
              category: 'implementation',
              severity: 'critical',
              description: '設計では認可が必須ですが、実装に含まれていません',
              expected: target.spec.design.authorization,
              actual: '認可チェックがない',
              suggested: `${target.spec.design.authorization} のチェックを追加してください`,
              recommended_action: 'fix_code',
            });
          }
        }
      }

      // L3: 意図の照合（意味的な整合性）
      if (request.focus_areas?.includes('semantic')) {
        const code = await readFile(target.entry_point);
        const analysis = await analyzeCodeSemantics(code);

        // 複雑性チェック
        if (analysis.complexity > target.spec.design.complexity * 2) {
          findings.push({
            category: 'semantic',
            severity: 'warning',
            description: '実装が設計よりも過度に複雑です',
            expected: `複雑度: ${target.spec.design.complexity}程度`,
            actual: `複雑度: ${analysis.complexity}`,
            suggested: '設計を見直すか、実装を簡素化してください',
            recommended_action: 'needs_review',
          });
        }

        // 依存関係チェック
        const extraDeps = analysis.dependencies.filter(
          d => !target.spec.design.dependencies.includes(d)
        );
        if (extraDeps.length > 0) {
          findings.push({
            category: 'semantic',
            severity: 'info',
            description: '設計にない依存関係が見つかりました',
            expected: target.spec.design.dependencies.join(', '),
            actual: analysis.dependencies.join(', '),
            suggested: 'これらの依存関係を正本に追加してください',
            recommended_action: 'update_spec',
          });
        }
      }

      return {
        impl_unit_id: target.impl_unit_id,
        status: findings.length === 0 ? 'synced' : 'unsynced',
        findings: findings.length > 0 ? findings : undefined,
      };
    })
  );

  const summary = {
    total: results.length,
    synced: results.filter(r => r.status === 'synced').length,
    unsynced: results.filter(r => r.status === 'unsynced').length,
    critical_issues: results.reduce(
      (acc, r) => acc + (r.findings?.filter(f => f.severity === 'critical').length || 0),
      0
    ),
  };

  return {
    check_id: request.check_id,
    results,
    summary,
  };
}
```

---

### ✅ 3点目：影響調査の精度への疑問

#### 課題
**正本の記述の不完全さがボトルネックになる可能性**

#### 根拠
- コーディングエージェントの意味論的解析なら、コードベースの依存関係は高精度に特定できる
- でも、正本に記載されていない「暗黙の前提」までは検知できない
- 例: コードに `const taxRate = 0.10;` とあるが、「将来変わるかも」って前提が正本に書いてない

具体的な問題:

| ケース | 意味解析で解決できるか | 懸念点 |
|--------|---------------------|--------|
| 文字列ベースの動的インポート | ✅ 解決できる | コメントが不足してると推論の精度が落ちるかも |
| 外部ライブラリのバージョンアップ | ⚠️ 部分的 | ライブラリのコードまでは読まないと影響が不明 |
| **正本に書いてない暗黙の前提** | **❌ 解決できない** | **「〇〇という理由でこの設計にした」がコードからは読めない** |
| ドキュメントとの不整合 | ❌ 解決できない | PRDや外部仕様書との照合は別途必要 |

#### 解決方向性
**変更可能性を前提にした実装ルールの策定**

- 値が変わりうるか先に考える（悲観的設計）
- それをcoding_conventions等に明示
- 影響調査時にも「変更可能項目」として扱う

#### PRD修正案

**3.1 プロダクト要件 - coding_conventions に追加**:

```yaml
coding_conventions:
  # ... 既存のルール ...

  # 追加: 変更可能性の考慮
  changeability:
    # プリミティブな値・計算に使う値の扱い
    primitive_values:
      policy: pessimistic  # 悲観的に「変更可能」と仮定する

      # 以下のカテゴリの値は、変更可能として実装する
      changeable_categories:
        - description: 法的な数値（税率、手数料等）
          implementation: 環境変数またはマスタテーブル
          example: 消費税率 10% → TAX_RATE環境変数

        - description: ビジネスルールに関わる数値（限度額、期間等）
          implementation: 設定テーブルまたは環境変数
          example: 上限金額 100万円 → system_settings.max_amount

        - description: 外部サービスのエンドポイント
          implementation: 環境変数
          example: API URL → EXTERNAL_API_URL

        - description: 固定されていないしきい値
          implementation: 設定として外出し
          example: リトライ回数 3回 → retry_policy.max_attempts

      # 以下の場合はハードコードしてもOK
      hardcode_allowed:
        - description: 技術的な定数（配列サイズ、バッファ等）
        - description: 変更することが自明でない物理・数学定数
        - description: パフォーマンス上の理由でハードコードする必要がある場合（コメント必須）
```

**3.9 実装単位SD - core_logic に追加**:

```yaml
core_logic:
  tax_calculation:
    description: 消費税計算
    formula: "税額 = 税抜金額 × 税率"
    # 追加: 変更可能性を明示
    changeable_factors:
      - name: 税率
        reason: 法改正の可能性あり
        implementation: 環境変数 TAX_RATE から読み込み
    rounding: 切り捨て
    precision: 1円単位
```

**6章 - InvestigationRequest に追加**:

```typescript
interface InvestigationRequest {
  // ... 既存フィールド ...

  // 追加: 変更可能性を考慮した調査範囲
  changeability_context?: {
    // 変更可能として扱う項目のカテゴリ
    assume_changeable: ['legal_values', 'business_rules', 'external_endpoints'];

    // ハードコードされた値も「依存」の可能性があるとして扱う
    conservative_mode: true;  // 悲観モード ON

    // 変更可能項目の検出戦略
    detection_strategy: {
      // 環境変数や設定テーブルを使っている箇所は優先的に調査
      prioritize_configured_values: true,

      // ハードコードされた数値も「変更可能な値の候補」として扱う
      include_hardcoded_values: true,

      // コメントから「将来変更する可能性」を示唆していないか検出
      scan_comments_for_change_hints: true,
    };
  };
}
```

**5章 - impact_analysis Tool にも考慮**:

```typescript
const impactAnalysisTool = createTool({
  execute: async ({ crId, changeDescription, targetIds }, { context }) => {
    // ... 既存実装 ...

    // 変更可能性を考慮した調査範囲を設定
    const investigationRequest = buildInvestigationRequest({
      // ...
      changeability_context: {
        assume_changeable: ['legal_values', 'business_rules'],
        conservative_mode: true,
      },
    });

    return {
      topDownResult,
      investigationRequest,
      // ...
    };
  },
});
```

---

### ✅ 4点目：変更管理ワークフローの実運用上の課題

#### 課題
**UI/UXガイダンスの不足**

#### 根拠
- ステップ数が多い（①〜⑤）ことは安全のためOK
- でも「現在どのステップで何をするべきか」が明示されていない
- ユーザーが迷う可能性が高い

PRDの現状:
- 各ステップで「誰が」「何をするか」は書かれている
- でもUI/UXの観点が不足している

| 観点 | PRDの現状 | 不足している点 |
|------|----------|---------------|
| ステータス遷移の可視化 | `draft → investigating → reviewed → approved → completed` は定義されている | UIでどう表示するか未定 |
| 各ステップの完了条件 | 「high/mediumが閾値以下になったら」とあるが、閾値の定義が不明 | 具体的な数値や条件が未定義 |
| 次のアクションの明示 | なし | 「次に何をクリックすべきか」のガイダンスがない |
| 進捗の把握 | なし | 「あとどのくらいで完了するか」の見通しがない |

#### 解決方向性
**ステータス管理＆UIとしてのガイダンスを明示化**

- ステータス可視化: プログレスバー、各ステップの完了状態
- アクションガイダンス: 各ステータスで「何をすべきか」を明示
- 完了条件の表示: 次のステップに進むために必要な条件
- 遷移プレビュー: 次のステップで何が起きるかを事前に説明

#### PRD修正案

**4.5 変更対応フロー にセクション追加**:

```markdown
### 4.5.X UI/UXガイダンス仕様

#### ステータス可視化
- プログレスバーで全体の進捗を表示
- 各ステップの完了状態（完了/進行中/未着）を視覚的に表現

#### アクションガイダンス
- 各ステータスで「何をすべきか」を明示
- プライマリアクション（次に進むボタン）を目立たせる
- セカンダリアクション（確認、編集等）を明示

#### 完了条件の表示
- 次のステップに進むために必要な条件をリスト表示
- 条件を満たしていない場合は、何が不足しているかを明示

#### 遷移プレビュー
- 次のステップで何が起きるかを事前に説明
- 見積もり時間やロールバック可否を表示

#### UIイメージ

```
┌─────────────────────────────────────────────────────────────────┐
│ CR-2025-001: 消費税端数処理の変更                          [×]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  進捗: ████████░░░░░░░░ 60%                                     │
│                                                                 │
│  ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐       │
│  │ ①   │  →  │ ②   │  →  │ ③   │  →  │ ④   │  →  │ ⑤   │       │
│  │完了 │     │完了 │     │進行中│     │未着 │     │未着 │       │
│  └─────┘     └─────┘     └─────┘     └─────┘     └─────┘       │
│  CR起票      影響調査    疑義解消    承認        実装             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 現在のステータス: reviewed                               │   │
│  │                                                         │   │
│  │ ✓ トップダウン分析完了（8件の候補を特定）                │   │
│  │ ✓ ボトムアップ分析完了（12ファイルに影響）               │   │
│  │ ⚠ 疑義リンク: 2件（medium）の処理が必要                 │   │
│  │                                                         │   │
│  │ [疑義リンクを処理する]     [影響範囲を詳細確認]           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### ステータスごとのUI仕様詳細

```yaml
status_ui:
  draft:
    primary_action: "影響調査を開始する"
    secondary_actions: ["変更内容を編集", "削除"]
    guidance: "影響調査を開始すると、変更範囲の分析が始まります"

  investigating:
    primary_action: "（完了待ち）"
    progress_indicator: "トップダウン分析中... ボトムアップ分析待ち..."
    blocking_issues: "調査完了後に疑義リンクが表示されます"

  reviewed:
    primary_action: "改修を承認してパッケージ生成"
    secondary_actions: ["影響範囲を再確認", "疑義リンクを再チェック"]
    guidance: "影響範囲が確定しました。内容を確認して承認してください"
    summary:
      affected_files: 12
      suspect_links_high: 0
      suspect_links_medium: 2

  approved:
    primary_action: "改修ジョブを投入"
    guidance: "コーディングエージェントに改修指示を送ります"
    package_preview: "パッケージ内容をプレビュー"
```

#### ステータス遷移の完了条件

```yaml
transition_criteria:
  investigating → reviewed:
    conditions:
      - name: 疑義リンク処理完了
        requirement: "suspect_severity: high のリンクが0件"
        requirement: "suspect_severity: medium のリンクが2件以下"
      - name: 影響範囲確定
        requirement: "allow_paths候補が確定している"
    auto_transition: false  # ユーザー明示的操作で遷移

  reviewed → approved:
    conditions:
      - name: ユーザー承認
        requirement: "改修内容を確認し、承認ボタンを押下"
    auto_transition: false
```

#### アクションの優先度付け

```yaml
action_priority:
  reviewed:
    primary:
      - action: 疑義リンクを処理する
        urgency: high
        reason: "承認前に処理が必要"
    secondary:
      - action: 影響範囲を確認する
        urgency: medium
        reason: "承認前の確認"
    tertiary:
      - action: CR内容を編集する
        urgency: low
        warning: "編集すると再調査が必要になります"
```

#### 次のステップへの期待値の提示

```yaml
transition_preview:
  from: reviewed
  to: approved
  what_happens:
    - "改修指示パッケージが生成されます"
    - "コーディングエージェントにジョブが投入されます"
    - "GitHubにPRが作成されます"
  estimated_time: "パッケージ生成: 約30秒、ジョブ投入: 即時"
  rollback_possible: true
```
```

---

## 採用しなかった論点

### ❌ 1点目：要件階層の複雑性
**理由**: 階層の深さ（7層）は設計思想の核心部分なので、今回は判断を保留

- BD→BT→BR、SD→SF→SR→AC→実装単位SD という階層構造
- BRとSFの多対多realizesリンク
- これを管理するオーバーヘッドが大きい可能性
- でも、これがシステムの基本設計なので、今回は判断を保留

### ❌ 5点目：AIエージェントの責務分割
**理由**: 技術選定の詳細は実装フェーズで決定すべき

- アプリ内AI（Mastra Agent）とコーディングエージェント（Claude Agent SDK）の使い分け
- どちらもLLMベースで、機能的に重複する部分がある
- でも、これは技術選定の詳細なので、実装フェーズで決定すべき

---

## 議論を通じて得た知見

`★ Insight ─────────────────────────────────────`
1. 同期の非対称性が根本課題
   - 意図→コード: ユーザーが意図を修正すれば同期OK
   - コード→意図: エージェントが勝手に変えると追従できない

2. 変更可能性を前提にした設計
   - 値が変わりうるか先に考える（悲観的設計）
   - それをルールとして明示する
   - 影響調査時にも考慮する

3. ワークフローの複雑さとナビゲーションの分離
   - ステップ数が多いこと自体は問題じゃない
   - 問題なのは「今何をすべきか」のガイダンス不足
   - UI/UX設計でナビゲーションを明示化する必要がある
`─────────────────────────────────────────────────`

---

## 今後のアクション

1. **PRD管理者が本フィードバックをレビュー**
   - 各修正案について、採用の可否を判断
   - 必要に応じて、追加の議論や調査を行う

2. **PRD.md の修正**
   - 採用する場合は、PRD.md の該当セクションに反映
   - 修正箇所を明確にする（diff等）

3. **ステークホルダーへの共有**
   - 反映後、変更点をステークホルダーに共有
   - 必要に応じて、説明会やドキュメントの更新を行う

4. **次回のレビュー**
   - 本フィードバックで指摘した項目について、次回のレビューで確認

---

## 補足：議論のアプローチについて

今回の議論では、以下の点に注意しました：
- 問題提起だけでなく、具体的な解決方向性も提示
- 技術的な実現可能性に焦点を当てる
- PRDの構造を維持しつつ、必要な追加を最小限に
- 「純粋な議論」として、コードベースの現状は一旦置いておいて、PRDの設計思想に対してフィードバックする

このアプローチにより、PRDの設計思想を維持しつつ、実運用上の課題を明確にできたと考えています。
