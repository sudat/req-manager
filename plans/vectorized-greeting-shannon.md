# 似た概念識別機能 実装計画

## 概要

AIチャットでBT/BR草案を生成する際、LLMが抽出した概念候補について、既存概念との**意味的な類似度**をLLMで判定し、似た概念を提案する機能を実装する。

---

## 採用手法

**LLMによる意味的類似度判定**

- 理由: 文字列類似度ライブラリ不要、既存の `callOpenAI` 関数を再用、意味的な類似度判定が可能
- 閾値: **2段階**
  - **除外閾値: 90%以上** - 別概念の可能性が低いため、候補から除外
  - **提示閾値: 70%-89%** - 類似概念としてユーザーに提示
- コスト: 完全一致がない場合のみLLMを呼び出すため、追加コストは最小限

---

## 難易度

```
難易度: ★★☆ / ★★★
根拠: 3 files, ~120 lines, 2 components
```

---

## Critical Files

| ファイル | 変更内容 |
|----------|----------|
| `lib/data/concepts.ts` | `findSimilarConcepts()` 関数を追加 |
| `lib/mastra/tools/bt-draft.ts` | 概念照合ロジックを拡張（類似一致を追加） |
| `lib/mastra/tools/br-draft.ts` | 概念照合ロジックを拡張（類似一致を追加） |
| `components/ai-chat/concept-suggestion/types.ts` | `ConceptCandidate` 型を拡張 |
| `components/ai-chat/concept-suggestion/concept-suggestion-card.tsx` | 類似概念バッジと情報表示を追加 |

---

## Step 1: lib/data/concepts.ts に類似概念検索関数を追加

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/data/concepts.ts`

完全一致がない場合に、LLMを使って類似概念を検索する関数を追加。
**90%以上の類似度の概念は除外**（候補から表示しない）。

```typescript
/**
 * LLMを使って類似概念を検索
 *
 * @param term - 検索対象の用語
 * @param existingConcepts - 既存概念のリスト
 * @param minThreshold - 提示する類似度の下限（デフォルト70%）
 * @param maxThreshold - 除外する類似度の上限（デフォルト90%）
 * @returns 類似した概念の配列（類似度降順）
 */
export async function findSimilarConcepts(
  term: string,
  existingConcepts: Array<{ id: string; name: string; definition: string }>,
  minThreshold = 0.7,
  maxThreshold = 0.9
): Promise<Array<{ id: string; name: string; definition: string; similarityScore: number }>> {
  if (existingConcepts.length === 0) {
    return [];
  }

  const { callOpenAI } = await import('@/lib/mastra/utils/llm-helpers');

  const conceptsList = existingConcepts
    .map(c => `- ${c.name}: ${c.definition}`)
    .join('\n');

  const llmPrompt = `
以下の用語に類似した既存概念を選び、類似度スコア（0-100）をつけてください。

【対象用語】${term}

【既存概念】
${conceptsList}

【出力形式（JSON）】
[
  {
    "id": "概念ID",
    "name": "概念名",
    "similarityScore": 85
  }
]

【判定基準】
- 類似度スコア: 0-100で、意味的にどれくらい似ているか
- ${maxThreshold * 100}点以上の概念は出力しないでください（除外対象）
- ${minThreshold * 100}点未満の概念は出力しないでください（類似度不足）
- 用語が完全に異なる場合は空配列を返してください
`;

  const llmResponse = await callOpenAI<{
    similarConcepts?: Array<{ id: string; name: string; similarityScore: number }>;
  }>({
    systemPrompt: 'あなたは概念の意味的類似度を判定する専門家です。',
    userPrompt: llmPrompt,
    jsonMode: true,
  });

  const results = (llmResponse.content.similarConcepts || [])
    .filter(c => c.similarityScore >= minThreshold * 100 && c.similarityScore < maxThreshold * 100)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .map(c => {
      const originalConcept = existingConcepts.find(ec => ec.id === c.id);
      return {
        id: c.id,
        name: c.name,
        definition: originalConcept?.definition || '',
        similarityScore: c.similarityScore,
      };
    });

  return results;
}
```

---

## Step 2: lib/mastra/tools/bt-draft.ts を修正

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/bt-draft.ts`

概念照合ロジックを拡張して、類似一致を追加。

```typescript
// インポート追加
import { getConceptsLookupMap, findSimilarConcepts } from '@/lib/data/concepts';

// execute関数内、既存概念配列を取得
const conceptMap = await getConceptsLookupMap(projectId);
const existingConceptsArray = Array.from(conceptMap.values());

// 概念照合ロジック（第213-231行を置き換え）
const rawConcepts = llmContent.concepts || [];
const conceptCandidates: Array<{
  term: string;
  context: string;
  isExisting: boolean;
  existingDefinition?: string;
  suggestion?: string;
  matchType?: 'exact' | 'similar' | 'new';
  similarConcept?: { id: string; name: string; definition: string; similarityScore: number };
}> = [];

for (const term of rawConcepts) {
  const existing = conceptMap.get(term.toLowerCase());

  if (existing) {
    // 完全一致
    conceptCandidates.push({
      term,
      context: `業務タスク「${llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50)}」で使用`,
      isExisting: true,
      existingDefinition: existing.definition,
      suggestion: `既存概念「${existing.name}」として登録済みです`,
      matchType: 'exact',
    });
  } else {
    // 完全一致がない場合、類似概念を検索
    // 90%以上は除外、70%-89%を提示
    const similarConcepts = await findSimilarConcepts(term, existingConceptsArray, 0.7, 0.9);

    if (similarConcepts.length > 0) {
      // 類似一致（最も類似度が高い概念を採用）
      const topSimilar = similarConcepts[0];
      conceptCandidates.push({
        term,
        context: `業務タスク「${llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50)}」で使用`,
        isExisting: false,
        suggestion: `類似概念「${topSimilar.name}」が見つかりました（類似度: ${topSimilar.similarityScore}%）`,
        matchType: 'similar',
        similarConcept: topSimilar,
      });
    } else {
      // 新規概念（類似概念がなかった、または90%以上で除外された）
      conceptCandidates.push({
        term,
        context: `業務タスク「${llmContent.name || naturalLanguageInput.split('\n')[0].substring(0, 50)}」で使用`,
        isExisting: false,
        suggestion: '概念辞書に登録することを検討してください',
        matchType: 'new',
      });
    }
  }
}
```

---

## Step 3: lib/mastra/tools/br-draft.ts を修正

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/lib/mastra/tools/br-draft.ts`

BT Draftと同様のロジックを適用。

```typescript
// インポート追加
import { getConceptsLookupMap, findSimilarConcepts } from '@/lib/data/concepts';

// execute関数内、既存概念配列を取得
const conceptMap = await getConceptsLookupMap(bt.project_id);
const existingConceptsArray = Array.from(conceptMap.values());

// 概念照合ロジック（第144-162行を置き換え）
const rawConcepts = llmContent.concepts || [];
const conceptCandidates: Array<{
  term: string;
  context: string;
  isExisting: boolean;
  existingDefinition?: string;
  suggestion?: string;
  matchType?: 'exact' | 'similar' | 'new';
  similarConcept?: { id: string; name: string; definition: string; similarityScore: number };
}> = [];

for (const term of rawConcepts) {
  const existing = conceptMap.get(term.toLowerCase());

  if (existing) {
    conceptCandidates.push({
      term,
      context: `業務要件「${requirement}」で使用`,
      isExisting: true,
      existingDefinition: existing.definition,
      suggestion: `既存概念「${existing.name}」として登録済みです`,
      matchType: 'exact',
    });
  } else {
    // 完全一致がない場合、類似概念を検索
    // 90%以上は除外、70%-89%を提示
    const similarConcepts = await findSimilarConcepts(term, existingConceptsArray, 0.7, 0.9);

    if (similarConcepts.length > 0) {
      // 類似一致（最も類似度が高い概念を採用）
      const topSimilar = similarConcepts[0];
      conceptCandidates.push({
        term,
        context: `業務要件「${requirement}」で使用`,
        isExisting: false,
        suggestion: `類似概念「${topSimilar.name}」が見つかりました（類似度: ${topSimilar.similarityScore}%）`,
        matchType: 'similar',
        similarConcept: topSimilar,
      });
    } else {
      // 新規概念（類似概念がなかった、または90%以上で除外された）
      conceptCandidates.push({
        term,
        context: `業務要件「${requirement}」で使用`,
        isExisting: false,
        suggestion: '概念辞書に登録することを検討してください',
        matchType: 'new',
      });
    }
  }
}
```

---

## Step 4: types.ts を修正

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ai-chat/concept-suggestion/types.ts`

`ConceptCandidate` 型を拡張。

```typescript
/**
 * 概念候補のマッチタイプ
 */
export type ConceptMatchType = 'exact' | 'similar' | 'new';

/**
 * 概念候補
 */
export interface ConceptCandidate {
  term: string;
  context: string;
  isExisting: boolean;
  existingDefinition?: string;
  suggestion?: string;

  // 類似概念関連（新規追加）
  matchType?: ConceptMatchType;
  similarConcept?: {
    id: string;
    name: string;
    definition: string;
    similarityScore: number; // 0-100
  };
}
```

---

## Step 5: concept-suggestion-card.tsx を修正

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ai-chat/concept-suggestion/concept-suggestion-card.tsx`

バッジ表示と類似概念情報エリアを追加。

```typescript
// バッジ表示の拡張（第31-45行を置き換え）
{candidate.matchType === 'exact' ? (
  <Badge
    variant="outline"
    className="border-green-200 bg-green-50 text-green-700 text-[11px] px-2 py-0.5"
  >
    既存概念
  </Badge>
) : candidate.matchType === 'similar' ? (
  <Badge
    variant="outline"
    className="border-purple-200 bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5"
  >
    似た概念 ({candidate.similarConcept?.similarityScore}%)
  </Badge>
) : (
  <Badge
    variant="outline"
    className="border-blue-200 bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5"
  >
    新規候補
  </Badge>
)}

// 類似概念情報エリアの追加（第90行の後に追加）
{candidate.matchType === 'similar' && candidate.similarConcept && (
  <div className="mb-3 p-3 rounded bg-purple-50 border border-purple-100">
    <div className="flex items-start gap-2">
      <BookOpen className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-[11px] font-medium text-purple-800 mb-1">
          似た概念が見つかりました
        </div>
        <div className="text-[13px] font-medium text-purple-900 mb-1">
          {candidate.similarConcept.name}
        </div>
        <div className="text-[12px] text-purple-700 mb-2">
          {candidate.similarConcept.definition}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/ideas/${candidate.similarConcept.id}`}
            className="text-[12px] text-purple-600 hover:text-purple-800 underline"
          >
            詳細を確認
          </Link>
          <span className="text-[11px] text-purple-500">
            類似度: {candidate.similarConcept.similarityScore}%
          </span>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## Step 6: アイコンインポートの追加

**ファイル**: `/usr/local/src/dev/wsl/personal-pj/req-manager/components/ai-chat/concept-suggestion/concept-suggestion-card.tsx`

```typescript
import { Check, X, Clock, BookOpen, AlertCircle, Link as LinkIcon } from 'lucide-react';
```

---

## 検証手順

### 1. テストデータ準備

Supabase でテスト用の既存概念を登録：

```sql
-- 「売掛金」と非常に類似した概念（90%以上、除外対象）
INSERT INTO public.concepts (id, name, definition, synonyms, project_id)
VALUES
  ('C-00038', '売掛債権', '商品やサービスを提供した対価として将来回収される金銭債権', ARRAY['売掛金', '売上債権'], 'f7f85d50-7587-464b-90b8-5c85807e748c');

-- 「売掛金」と中程度に類似した概念（70%-89%、提示対象）
INSERT INTO public.concepts (id, name, definition, synonyms, project_id)
VALUES
  ('C-00039', '営業債権', '営業活動によって生じた金銭債権', ARRAY['売掛債権'], 'f7f85d50-7587-464b-90b8-5c85807e748c');
```

### 2. E2Eテスト - 除外ケース（90%以上）

1. BD詳細画面を開く
2. 「AIで追加」をクリック
3. 「売掛金」を含む業務説明を入力
4. **期待結果**: 「売掛金」は候補として表示されない（「売掛債権」と類似しすぎているため除外）

### 3. E2Eテスト - 提示ケース（70%-89%）

1. BD詳細画面を開く
2. 「AIで追加」をクリック
3. 「営業債権管理」を含む業務説明を入力
4. **期待結果**: 「営業債権」が類似概念として表示される（紫バッジ、類似度70%-89%）

### 4. 新規概念テスト

類似概念がない用語（例: 「発注管理」）を入力し、「新規候補」バッジが表示されることを確認。

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| LLM APIコスト増加 | 完全一致がない場合のみ呼び出し、類似概念が複数あても上位1件のみ返す |
| レスポンス遅延 | 非同期で並列処理（`Promise.all`）で実行 |
| LLMの判定不安定 | 閾値を70%に設定、プロンプトで明確な判定基準を指定 |

---

## 優先順位

```
1. 完全一致（既存） -> isExisting: true, matchType: 'exact'
2. 類似一致 70%-89%（新規） -> isExisting: false, matchType: 'similar', similarConcept: {...}
3. 高類似度 90%以上 -> 候補から除外（表示しない）
4. 類似度 70%未満 -> isExisting: false, matchType: 'new'
```
