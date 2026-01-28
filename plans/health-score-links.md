# ヘルススコア リンク機能 + パンくず修正 実装プラン

## 難易度評価
```
難易度: ★★☆
根拠: 4 files, 約250行, 既存コンポーネント拡張メイン
リスク: ヘルススコアカードの既存動作への影響が軽微、Breadcrumbは追加のみ
```

---

## 要件

### 1. ヘルススコアからの直接リンク（クリティカル）
- ヘルススコアカードの各ルール項目をクリック可能にする
- クリックで該当する要件の一覧画面にフィルタ付きで遷移する
- 違反している要件のみを一覧表示する

### 2. パンくず欠落の修正（軽微）
- `/ideas/[id]/page.tsx` に Breadcrumb を追加する

---

## 実装方針

### 方針：URLクエリパラメータによるフィルタリング
`/links/page.tsx` で使用している `useSearchParams` + フィルタモードのパターンを活用し、
各一覧画面（`/business`, `/system-domains`）にURLパラメータでフィルタを渡す。

```
例:
- /business?filter=missing_sr_link → システム要件未紐付けの業務要件のみ表示
- /system-domains?filter=missing_acceptance → 受入条件未設定のシステム要件のみ表示
```

---

## 修正ファイル一覧

### 新規作成: なし

### 修正ファイル:
1. `/lib/health-score/index.ts` - ルールIDとフィルタのマッピング定義を追加
2. `/components/health-score/health-score-card.tsx` - クリック機能とリンクを追加
3. `/app/(with-sidebar)/business/page.tsx` - フィルタパラメータ対応を追加
4. `/app/(with-sidebar)/system-domains/page.tsx` - フィルタパラメータ対応を追加
5. `/app/(with-sidebar)/ideas/[id]/page.tsx` - Breadcrumb を追加

---

## 詳細設計

### Step 1: ルールIDとフィルタのマッピング定義

**ファイル**: `/lib/health-score/index.ts`

```typescript
// 新規追加
export type HealthIssueFilter = {
  filterParam: string;
  targetPath: 'business' | 'system-domains';
  label: string;
};

export const healthIssueFilters: Record<string, HealthIssueFilter> = {
  business_requirements_with_system_requirements: {
    filterParam: 'missing_sr_link',
    targetPath: 'business',
    label: 'システム要件未紐付け',
  },
  system_requirements_with_business_requirements: {
    filterParam: 'missing_br_link',
    targetPath: 'system-domains',
    label: '業務要件未紐付け',
  },
  impl_unit_sds_with_entry_points: {
    filterParam: 'missing_entrypoint',
    targetPath: 'system-domains',
    label: 'エントリポイント未設定',
  },
  concept_terms_with_links: {
    filterParam: 'missing_concept',
    targetPath: 'business',
    label: '概念未紐付け',
  },
  business_requirements_with_concepts: {
    filterParam: 'missing_concept_br',
    targetPath: 'business',
    label: '業務要件概念未紐付け',
  },
  system_requirements_with_category: {
    filterParam: 'missing_category',
    targetPath: 'system-domains',
    label: '観点種別未設定',
  },
  system_requirements_with_acceptance_criteria: {
    filterParam: 'missing_acceptance',
    targetPath: 'system-domains',
    label: '受入条件未設定',
  },
};
```

---

### Step 2: HealthScoreCard にクリック機能を追加

**ファイル**: `/components/health-score/health-score-card.tsx`

**変更点**:
1. Props に `onIssueClick?: (issueId: string) => void` を追加
2. 各 issue の `<li>` に `cursor-pointer` スタイルと `onClick` ハンドラーを追加
3. 完了率 100% 未満の場合のみクリック可能に見せる

```tsx
// Props 追加
type HealthScoreCardProps = {
  // 既存...
  onIssueClick?: (issueId: string) => void;
};

// JSX 変更
<li
  key={issue.id}
  className={`flex items-center justify-between gap-3 text-[12px] text-slate-600 p-2 rounded bg-slate-50 hover:bg-slate-100 transition-colors ${
    issue.completed < issue.total && onIssueClick ? 'cursor-pointer' : ''
  }`}
  onClick={() => issue.completed < issue.total && onIssueClick?.(issue.id)}
>
```

---

### Step 3: Dashboard でクリックハンドラーを実装

**ファイル**: `/app/(with-sidebar)/dashboard/page.tsx`

**変更点**:
1. `healthIssueFilters` をインポート
2. クリックハンドラー `handleIssueClick` を実装
3. `HealthScoreCard` に `onIssueClick` を渡す

```tsx
import { healthIssueFilters } from "@/lib/health-score";
import { useRouter } from "next/navigation";

// コンポーネント内
const router = useRouter();

const handleIssueClick = (issueId: string) => {
  const filter = healthIssueFilters[issueId];
  if (!filter) return;
  router.push(`/${filter.targetPath}?filter=${filter.filterParam}`);
};

// JSX
<HealthScoreCard
  onIssueClick={handleIssueClick}
  // 既存props...
/>
```

---

### Step 4: /business にフィルタ対応を追加

**ファイル**: `/app/(with-sidebar)/business/page.tsx`

**変更点**:
1. `useSearchParams` で `filter` パラメータを取得
2. フィルタに応じたビジネスロジックでタスクをフィルタリング
3. フィルタ適用中であることをUIで表示

```tsx
import { useSearchParams } from "next/navigation";

// コンポーネント内
const searchParams = useSearchParams();
const healthFilter = searchParams?.get("filter");

// フィルタロジック（既存の filtered に追加）
const filtered = useMemo(() => {
  let result = items;

  // ヘルススコアフィルタ適用
  if (healthFilter === 'missing_sr_link') {
    result = result.filter(task => !task.relatedSystemRequirementIds || task.relatedSystemRequirementIds.length === 0);
  } else if (healthFilter === 'missing_concept' || healthFilter === 'missing_concept_br') {
    result = result.filter(task => !task.conceptIds || task.conceptIds.length === 0);
  }

  // 既存の検索フィルタ...
}, [items, query, healthFilter]);

// フィルタ表示（検索ボックスの下など）
{healthFilter && (
  <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-md text-[13px] text-amber-800">
    ヘルススコア フィルタ適用中: {healthFilter}
    <Link href="/business" className="ml-3 underline hover:no-underline">クリア</Link>
  </div>
)}
```

---

### Step 5: /system-domains にフィルタ対応を追加

**ファイル**: `/app/(with-sidebar)/system-domains/page.tsx`

**変更点**: `/business` と同様のパターンで実装

```tsx
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const healthFilter = searchParams?.get("filter");

// システム機能に対するフィルタロジック
// - missing_br_link: businessRequirementIds が空
// - missing_entrypoint: entryPoints が空
// - missing_category: categoryRaw が null または許可外
// - missing_acceptance: acceptanceCriteriaJson が空

// フィルタ表示も同様
```

---

### Step 6: ideas/[id]/page.tsx に Breadcrumb を追加

**ファイル**: `/app/(with-sidebar)/ideas/[id]/page.tsx`

**変更点**:
1. 既存の ArrowLeft リンクを Breadcrumb に置き換え
2. インポート追加

```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// 既存の ArrowLeft リンク部分を以下に置き換え
<Breadcrumb className="mb-4">
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link href="/ideas">概念辞書</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>{concept?.name ?? '...'}</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

## 検証方法

### 1. ヘルススコアリンクの検証
1. ダッシュボード (`/dashboard`) を開く
2. ヘルススコアカードを展開する
3. いずれかのルール項目（完了率 < 100% のもの）をクリックする
4. 該当する一覧画面に遷移し、URL に `?filter=xxx` が含まれていることを確認
5. 違反している要件のみが表示されていることを確認
6. 各アイテムをクリックして詳細画面に遷移できることを確認

### 2. パンくずの検証
1. 任意の概念詳細画面 (`/ideas/[id]/page.tsx`) を開く
2. パンくずが表示され、「概念辞書」へのリンクが機能することを確認

### 3. フィルタクリアの検証
1. フィルタ適用中の一覧画面で「クリア」リンクをクリックする
2. フィルタが解除され、全件表示に戻ることを確認

---

## 実装順序

1. `/lib/health-score/index.ts` - マッピング定義追加
2. `/components/health-score/health-score-card.tsx` - クリック機能追加
3. `/app/(with-sidebar)/dashboard/page.tsx` - クリックハンドラー実装
4. `/app/(with-sidebar)/business/page.tsx` - フィルタ対応追加
5. `/app/(with-sidebar)/system-domains/page.tsx` - フィルタ対応追加
6. `/app/(with-sidebar)/ideas/[id]/page.tsx` - Breadcrumb 追加
