# AIチャット機能 UX改善計画

## 1. 現状の問題点

ユーザーの会話例から判明した問題:
```
ユーザー: 「連結パッケージ提出の業務を登録したいんよ」
AI: 「関連する業務領域は「一般会計」でよろしいですか？」
ユーザー: 「おぉ、よく一般会計ってわかったね」
AI: 「一般会計」という業務領域が見つかりませんでした。
```

### 問題1: AIがToolを呼ばずに「見つかりません」と言う
- `searchBusinessDomainsTool` を呼ばずにAIが勝手に「見つかりません」と回答
- Instructionsに「禁止」と書いてあるが守られていない

### 問題2: Tool実装が未完成（最重要）
| Tool | カバー率 | 問題 |
|------|---------|------|
| bt-draft | 30% | processSteps, input, output等が未生成 |
| br-draft | 50% | rationaleが固定値 |
| system-draft | 40% | 機械的生成、ACが抽象的 |
| commit-draft | 30% | DB挿入項目が不足 |

**bt-draft.tsの現状:**
```typescript
// ❌ 現状: naturalLanguageInputをそのまま使うだけ
const btDraft = {
  code: btCode,
  name: naturalLanguageInput.split('\n')[0].trim(),
  description: naturalLanguageInput,  // そのまま
  // ⚠️ 以下が全く生成されない:
  // - summary, businessContext, processSteps, input, output
};
```

### 問題3: 提案型対話ができていない
- BTの登録に必要な項目（業務プロセス、inputs/outputs等）を提示していない
- ユーザーに質問せず、入力をそのまま使っている

---

## 2. 改善方針

**ゴール:** Claude Codeと会話するように、提案型で対話できるAIチャットにする

### 2.1 提案型対話の実現イメージ

```
ユーザー: 「連結パッケージ提出の業務を登録したいんよ」

AI: 「連結パッケージ提出ですね！一般的な連結決算業務として理解しました。

     📋 BTの登録には以下の情報が必要です：

     1. 業務プロセス（process_steps）
        → 例: ①親会社から連結パッケージを受領 → ②試算表から数値を転記 → ③検算・提出

     2. インプット（input）
        → 例: 試算表、前期連結パッケージ、勘定科目マッピング表

     3. アウトプット（output）
        → 例: 記入済み連結パッケージ、差異分析資料

     ✅ 業務領域を検索中...「一般会計（GL）」が見つかりました。こちらでよろしいですか？

     上記の情報を教えていただけますか？または「標準的なプロセスでOK」と言っていただければ
     一般的な連結パッケージ業務として草案を作成します。」
```

---

## 3. 改修計画

### Phase 1: Tool実装の完成（優先度: 高）

#### 3.1 bt-draft.ts の改修
**ファイル:** `lib/mastra/tools/bt-draft.ts`

**変更内容:**
1. outputSchemaに全項目を追加
2. LLM呼び出しを実装（現状TODO）
3. uncertaintiesを充実させる

```typescript
// 改修後のoutputSchema
outputSchema: z.object({
  btDraft: z.object({
    code: z.string(),
    name: z.string(),
    summary: z.string(),              // 追加
    businessContext: z.string(),       // 追加
    processSteps: z.array(z.string()), // 追加
    input: z.array(z.string()),        // 追加
    output: z.array(z.string()),       // 追加
    business_domain_id: z.string(),
    concept_ids: z.array(z.string()),
  }),
  uncertainties: z.array(z.object({    // 強化
    field: z.string(),
    question: z.string(),
    suggestion: z.string().optional(), // 一般論での提案
  })),
  // ...
})
```

**LLM呼び出しの実装:**
```typescript
// Mastra Agentを使ってLLMで整形
const llmResult = await generateWithLLM({
  prompt: `
    以下の業務説明から、BTの各項目を抽出・生成してください。
    不明な項目は一般論で推測し、suggestionsに追加してください。

    業務説明: ${naturalLanguageInput}
    業務領域: ${bdInfo.name}

    出力形式:
    - name: 業務名（簡潔に）
    - summary: 業務概要（1-2文）
    - businessContext: なぜこの業務が必要か
    - processSteps: 業務プロセス（配列）
    - input: インプット（配列）
    - output: アウトプット（配列）
    - suggestions: 不明確な項目への提案（配列）
  `,
});
```

#### 3.2 commit-draft.ts の改修
**ファイル:** `lib/mastra/tools/commit-draft.ts`

**変更内容:** BTケースのDB挿入を完全なスキーマに対応

```typescript
// BTケースの挿入を修正
.insert({
  business_domain_id: content.business_domain_id,
  code: content.code,
  name: content.name,
  summary: content.summary,              // 追加
  business_context: content.businessContext, // 追加
  process_steps: content.processSteps,   // 追加
  input: content.input,                  // 追加
  output: content.output,                // 追加
  concept_ids_yaml: content.conceptIdsYaml,
  concepts: content.concepts || [],
})
```

#### 3.3 br-draft.ts, system-draft.ts の改修
同様にLLM呼び出しを実装し、全項目をカバーする。

---

### Phase 2: Agent Instructions の強化（優先度: 高）

**ファイル:** `lib/mastra/agents/requirements-agent.ts`

#### 2.1 提案型対話の指示を強化

```typescript
instructions: `
## 行動原則（重要：必ず守ること）

### 1. 提案型対話
ユーザーが業務タスクを登録したいと言ったら、以下のように対応する：

1. **まず業務領域を検索する**（searchBusinessDomainsToolを必ず呼ぶ）
2. **必要項目を提示する**
   - BTには: name, summary, businessContext, processSteps, input, output が必要
   - これらを一般論と共にユーザーに提示する
3. **推測と確認を行う**
   - ユーザーの入力から推測できる項目は推測を提示
   - 「○○という理解で合っていますか？」と確認する

### 2. Tool呼び出しの必須ルール

#### 業務領域キーワードを検出したら即座にsearchBusinessDomainsToolを呼ぶ
キーワード: GL, AR, AP, FA, 一般会計, 売掛, 買掛, 固定資産, 債権, 債務, 経理, 会計 等

**禁止事項（絶対に守ること）:**
- ❌ Toolを呼ばずに「見つかりません」と言ってはいけない
- ❌ ユーザーの入力をそのまま登録してはいけない（必ず確認する）

### 3. 草案生成後の対話

btDraftToolの結果にuncertaintiesがある場合:
1. 草案の概要を提示
2. uncertaintiesの各項目についてユーザーに質問
3. ユーザーの回答を待ってから草案を更新

### 4. 具体例

ユーザー: 「連結パッケージ提出を登録したい」

良い応答:
「連結パッケージ提出ですね。一般的な連結決算業務として理解しました。

[searchBusinessDomainsToolを呼び出し]

✅ 業務領域「一般会計（GL）」が見つかりました。

📋 BT登録に必要な情報を確認させてください：

**業務プロセス（process_steps）**
一般的には以下の流れかと思いますが、御社ではいかがですか？
1. 親会社から連結パッケージを受領
2. 試算表から数値を転記
3. 検算・レビュー
4. 提出

**インプット（input）**
- 試算表
- 前期連結パッケージ（参考）
- 勘定科目マッピング表
これ以外にありますか？

**アウトプット（output）**
- 記入済み連結パッケージ
他にありますか？」
`
```

---

### Phase 3: 検索機能のデバッグ（優先度: 中）

**ファイル:** `lib/mastra/tools/search-business-domains.ts`

#### 3.1 デバッグログ追加
```typescript
execute: async ({ projectId, query }) => {
  console.log('[searchBusinessDomains] Called:', { projectId, query });

  // ... 検索処理 ...

  console.log('[searchBusinessDomains] Result:', { count: bds?.length, error });
  return result;
}
```

#### 3.2 エラーメッセージの改善
```typescript
if (!bds || bds.length === 0) {
  return {
    success: true,
    results: [],
    count: 0,
    message: `業務領域「${query}」が見つかりませんでした。` +
             `検索対象: code, name, area。projectId: ${projectId}`,
    searchTip: '「GL」「AR」「AP」等のコードや「一般会計」「売掛」等の名前で検索できます',
  };
}
```

---

### Phase 4: UI連携の改善（優先度: 低、将来の拡張）

**ファイル:** `app/api/chat/route.ts`, `components/ai-chat/chat-container.tsx`

現状はストリーミングレスポンスがテキストのみのため、Tool結果（草案データ等）がUIに反映されない。
将来的には以下を検討:
- ストリーミング中にTool呼び出し結果を別チャンネルで送信
- 草案プレビューカードの動的表示

---

## 4. 対象ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `lib/mastra/tools/bt-draft.ts` | LLM呼び出し実装、outputSchema拡張、uncertainties強化 |
| `lib/mastra/tools/br-draft.ts` | LLM呼び出し実装、rationale生成 |
| `lib/mastra/tools/system-draft.ts` | LLM呼び出し実装、AC生成改善 |
| `lib/mastra/tools/commit-draft.ts` | BT挿入項目の追加 |
| `lib/mastra/tools/search-business-domains.ts` | デバッグログ、エラーメッセージ改善 |
| `lib/mastra/agents/requirements-agent.ts` | Instructions強化（提案型対話） |

---

## 5. 検証方法

### 5.1 Unit Test的な確認
1. `bun run dev` でサーバー起動
2. `/chat` 画面を開く
3. 以下の会話を実行:
   - 「業務タスクを登録したいです」→ 必要項目が提示されるか
   - 「連結パッケージ提出を登録したい」→ 業務領域検索が動くか
   - 「一般会計」→ searchBusinessDomainsToolが呼ばれるか（ログ確認）

### 5.2 E2E的な確認（Playwright MCP）
1. チャット画面を開く
2. BT登録の会話フローを実行
3. 草案プレビューが表示されるか確認
4. 確定操作でDBに正しく保存されるか確認

---

## 6. 難易度評価

```
難易度: ★★☆
根拠: 6 files, 約200-300 lines, Agent + Tool連携
リスク: LLM呼び出しの追加によるレスポンス遅延、APIコスト増
```

---

## 7. 実装順序

1. **search-business-domains.ts** - デバッグログ追加（問題切り分け） ✅ 完了
2. **requirements-agent.ts** - Instructions強化（提案型対話の指示） ✅ 完了
3. **bt-draft.ts** - LLM呼び出し実装、outputSchema拡張 ✅ 完了
4. **commit-draft.ts** - BT挿入項目の追加 ⚠️ 追加修正必要
5. **br-draft.ts, system-draft.ts** - 同様の改修 ✅ 完了
6. 動作確認

---

## 8. 追加修正: BT登録失敗の問題（2026-01-29）

### 8.1 問題の現象

ユーザーがBTの草案を確認後、「登録して」と指示すると以下のエラー:
```
草案の確定に失敗しました。システムの問題が発生しているようです。
```

ログを見ると、草案生成（bt-draft）は成功しているが、確定（commit-draft）で失敗。

### 8.2 根本原因

**問題1: `bt-draft.ts`が`project_id`を返していない**

```typescript
// 現状のbtDraftオブジェクト
const btDraft = {
  code: newCode,
  name: llmContent.name,
  // ...
  business_domain_id: resolvedBdId,
  // ❌ project_idがない！
};
```

**問題2: `commit-draft.ts`が参照できない`project_id`を使おうとしている**

```typescript
// commit-draft.ts
.insert({
  project_id: content.project_id,  // ❌ btDraftにないからundefined
  // ...
})
```

**問題3: タイムスタンプ未設定**

`lib/data/tasks.ts`の`createTask`を見ると:
```typescript
const payload = {
  ...toTaskRow(input),
  project_id: input.projectId,
  created_at: now,   // ✅ 設定している
  updated_at: now,   // ✅ 設定している
};
```

`commit-draft.ts`にはこれがない。

### 8.3 修正計画

#### 修正1: `bt-draft.ts` に `project_id` を追加

**ファイル:** `lib/mastra/tools/bt-draft.ts`

```typescript
// L189付近: btDraftオブジェクトにproject_idを追加
const btDraft = {
  code: newCode,
  name: llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50),
  summary: llmContent.summary || naturalLanguageInput.substring(0, 200),
  businessContext: llmContent.businessContext || '',
  processSteps: llmContent.processSteps || [],
  input: llmContent.input || [],
  output: llmContent.output || [],
  business_domain_id: resolvedBdId,
  project_id: projectId,  // 🔧 追加
  concept_ids: [],
};
```

#### 修正2: `commit-draft.ts` にタイムスタンプを追加

**ファイル:** `lib/mastra/tools/commit-draft.ts`

```typescript
case 'bt': {
  const now = new Date().toISOString();  // 🔧 追加
  const { data, error } = await supabase
    .from('business_tasks')
    .insert({
      business_id: content.business_domain_id,
      project_id: content.project_id,
      id: content.code,
      name: content.name,
      summary: content.summary || '',
      business_context: content.businessContext || null,
      process_steps: content.processSteps ? content.processSteps.join('\n') : null,
      input: content.input ? content.input.join('\n') : null,
      output: content.output ? content.output.join('\n') : null,
      concepts: content.concepts || [],
      concept_ids_yaml: content.conceptIdsYaml || null,
      person: content.person || null,
      sort_order: content.sort_order || 0,
      created_at: now,   // 🔧 追加
      updated_at: now,   // 🔧 追加
    })
    .select()
    .single();

  if (error) throw error;
  result = data;
  break;
}
```

### 8.4 対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `lib/mastra/tools/bt-draft.ts` | btDraftに`project_id`を追加 |
| `lib/mastra/tools/commit-draft.ts` | タイムスタンプ追加、エラーログ強化 |

### 8.5 検証方法

1. `bun run dev` でサーバー起動
2. `/chat` 画面を開く
3. 以下の会話フローを実行:
   - 「月締め残高照合の業務を登録したい」
   - AIの草案提示を確認
   - 「OKなので登録して」
   - → **「登録しました」と表示されることを確認**
4. DBを確認: `business_tasks`テーブルに新しいレコードが作成されているか

### 8.6 難易度評価

```
難易度: ★☆☆
根拠: 2 files, 約10 lines, 単純な追加修正
リスク: 低（既存ロジックへの影響なし）
```
