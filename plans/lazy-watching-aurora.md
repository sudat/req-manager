# コード簡素化実装計画

## 対象ファイル（高・中優先の5ファイル）

| ファイル | Before | After | 削減率 |
|----------|--------|-------|--------|
| `useSystemFunctionForm.ts` | 690行 | 80行 | -88% |
| `[taskId]/page.tsx` | 464行 | 120行 | -74% |
| `impl-unit-sd-list.tsx` | 359行 | 80行 | -78% |
| `useSystemFunctionCreate.ts` | 323行 | 150行 | -54% |
| `system-requirements.ts` | 388行 | 300行 | -23% |

**合計**: 2224行 → 約1685行（新規ファイル含む）

---

## 難易度評価

```
難易度: ★★☆
根拠: 5 files, 約2200行 → 約1600行, 12新規ファイル作成
リスク: 公開インターフェース維持が必須、save関数分割のトランザクション整合性
```

---

## 実装順序

1. **lib/data/system-requirements.ts** - 他から参照されるため最初
2. **impl-unit-sd-list.tsx** - 独立コンポーネント
3. **useSystemFunctionCreate.ts** - 共通バリデーション抽出
4. **useSystemFunctionForm.ts** - 抽出したユーティリティ使用
5. **[taskId]/page.tsx** - 最後

---

## 1. useSystemFunctionForm.ts (690行 → 80行)

### 新規ファイル

| ファイル | 行数 | 内容 |
|----------|------|------|
| `.../edit/hooks/useSystemFunctionFormState.ts` | 80 | 状態管理（category, status, title, summary等） |
| `.../edit/hooks/useSystemFunctionFormActions.ts` | 100 | アクション（addDesignItem, removeCodeRef等） |
| `.../edit/hooks/useSystemFunctionDataFetch.ts` | 150 | データフェッチuseEffect |
| `lib/utils/system-functions/validate-system-function.ts` | 50 | バリデーション |
| `lib/utils/system-functions/save-system-function.ts` | 120 | 保存処理5関数 |

### 簡素化後の構造
```typescript
export function useSystemFunctionForm(srfId: string) {
  const state = useSystemFunctionFormState();
  const actions = useSystemFunctionFormActions(srfId, state);
  const { loading, error } = useSystemFunctionDataFetch(srfId, state);

  const save = useCallback(async (systemDomainId: string) => {
    const validationError = validateSystemFunctionForm(...);
    if (validationError) return false;
    return saveSystemFunction(...);
  }, [...]);

  return { state, actions: { ...actions, save } };
}
```

---

## 2. [taskId]/page.tsx (464行 → 120行)

### 新規ファイル

| ファイル | 行数 | 内容 |
|----------|------|------|
| `.../[taskId]/components/TaskLoadingStatus.tsx` | 25 | ローディング表示 |
| `.../[taskId]/components/TaskSummaryCard.tsx` | 80 | サマリー + MarkdownBlock等 |
| `.../[taskId]/components/RequirementsSection.tsx` | 40 | 要件セクション |
| `.../[taskId]/components/BusinessRequirementsSection.tsx` | 30 | 業務要件セクション |

---

## 3. impl-unit-sd-list.tsx (359行 → 80行)

### 新規ファイル

| ファイル | 行数 | 内容 |
|----------|------|------|
| `components/forms/impl-unit-sd/ImplUnitSdCard.tsx` | 100 | カードコンポーネント |
| `components/forms/entry-points/EntryPointsInlineEditor.tsx` | 130 | エントリポイントエディタ |

---

## 4. useSystemFunctionCreate.ts (323行 → 150行)

### 新規ファイル

| ファイル | 行数 | 内容 |
|----------|------|------|
| `lib/utils/system-functions/create-system-function.ts` | 80 | 作成処理 |

### 共有
- `validate-system-function.ts`（1で作成済み）を使用

---

## 5. system-requirements.ts (388行 → 300行)

### 変更内容
- `buildProjectFilteredQuery` ヘルパー追加（15行）
- 4箇所の重複クエリ構築を共通化
- `updateSystemRequirement`を45行に短縮

---

## 新規ファイル一覧（12ファイル）

```
lib/utils/system-functions/
├── validate-system-function.ts    # 50行
├── save-system-function.ts        # 120行
└── create-system-function.ts      # 80行

app/(with-sidebar)/system-domains/[id]/[srfId]/edit/hooks/
├── useSystemFunctionFormState.ts   # 80行
├── useSystemFunctionFormActions.ts # 100行
└── useSystemFunctionDataFetch.ts   # 150行

app/(with-sidebar)/business/[id]/[taskId]/components/
├── TaskLoadingStatus.tsx           # 25行
├── TaskSummaryCard.tsx             # 80行
├── RequirementsSection.tsx         # 40行
└── BusinessRequirementsSection.tsx # 30行

components/forms/
├── impl-unit-sd/ImplUnitSdCard.tsx              # 100行
└── entry-points/EntryPointsInlineEditor.tsx     # 130行
```

---

## 影響範囲

### インポート変更が必要なファイル
- `app/(with-sidebar)/system-domains/[id]/[srfId]/edit/page.tsx`
- `app/(with-sidebar)/system-domains/[id]/create/page.tsx`
- `impl-unit-sd-list.tsx`を使用している全ファイル

### 公開インターフェース
- **維持**: `useSystemFunctionForm`, `useSystemFunctionCreate`の戻り値型
- **維持**: `ImplUnitSdList`のprops、`SystemRequirement`型

---

## 検証方法

1. **TypeScriptコンパイル**: `bun run build` でエラーなし
2. **E2Eテスト**: Playwright MCPで以下の画面を確認
   - システム機能編集画面 (`/system-domains/[id]/[srfId]/edit`)
   - システム機能作成画面 (`/system-domains/[id]/create`)
   - タスク詳細画面 (`/business/[id]/[taskId]`)
3. **行数確認**: 各ファイルが基準内に収まっていること
