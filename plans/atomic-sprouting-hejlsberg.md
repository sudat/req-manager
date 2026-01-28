# ヘルススコアの項目整理（第4版・改訂）

## 概要
業務要件詳細ページのヘルススコアにおいて、システム要件側の指標と統計情報を除外する。

## 課題背景

### 課題1: 業務要件詳細ページで不要な検出ルール
以下の項目はシステム要件側の指標であり、業務要件ページには表示するべきではない：

- **「システム要件に業務要件が紐づいている」**: システム要件側の指標
- **「システム機能にエントリポイントが設定されている」**: システム機能側の指標
- **「システム要件に観点種別が設定されている」**: システム要件側の指標
- **「システム要件に受入条件が設定されている」**: システム要件側の指標

### 課題2: 統計情報の不一致
業務要件詳細ページにシステム側の統計が表示されている：

```
業務要件: 2
システム要件: 2   ← 不要
システム機能: 1   ← 不要
エントリポイント: 2 ← 不要
```

検出ルールが3つなのに統計が4種類表示されているのは不自然。

---

## 変更内容

### 1. 検出ルール（issues）のフィルタリング

**ファイル:** `lib/health-score/index.ts`

#### 対象項目と修正方法

| 項目 | 現在の実装 | 修正内容 |
|------|-----------|---------|
| システム要件に業務要件が紐づいている | 常に表示 | `pageType === 'business'` の場合はスキップ |
| システム機能にエントリポイントが設定されている | 常に表示 | `pageType === 'business'` の場合はスキップ |
| システム要件に観点種別が設定されている | 常に表示 | `pageType === 'business'` の場合はスキップ |
| システム要件に受入条件が設定されている | 常に表示 | `pageType === 'business'` の場合はスキップ |

※ この修正は**完了済み**

### 追加の課題: エントリポイント指標の見直し

**課題:** 現在「システム機能にエントリポイントが設定されている」は`systemFunctions.entryPoints`を見ているが、実際のエントリポイント登録は**実装単位SD**で行われている。

**修正方針:**
- 「実装単位SDにエントリポイントが設定されている」に変更
- 実装単位SDのデータに基づいて計算

```typescript
// 実装単位SDにエントリポイントが設定されている（システム要件ページのみ表示）
if (pageType !== 'business') {
	const implUnitSdsWithEntryPoints = implUnitSds.filter(
		(sd) => ensureArray(sd.entryPoints).length > 0
	).length;
	issues.push(
		createIssue(
			"impl_unit_sds_with_entry_points",
			"実装単位SDにエントリポイントが設定されている",
			"high",
			implUnitSdsWithEntryPoints,
			implUnitSds.length
		)
	);
}
```

### 2. 統計情報（stats）の再設計

**課題:**
- 業務要件ページにシステム側の統計が表示されている
- システム要件ページに不要な統計（システム機能、エントリポイント）が表示されている
- 実装単位SDの統計が欠けている

**期待する統計表示:**

| ページ | 表示する統計 |
|--------|-------------|
| 業務要件詳細 | 業務要件のみ |
| システム要件詳細 | システム要件 + 実装単位SD |
| ダッシュボード | 全統計 |

**ファイル:**
- `lib/health-score/index.ts`
- `components/health-score/health-score-card.tsx`
- `app/(with-sidebar)/business/[id]/[taskId]/page.tsx`
- `app/(with-sidebar)/system-domains/[id]/[srfId]/page.tsx`

#### Step 1: HealthScoreStats型の変更

**ファイル:** `lib/health-score/index.ts`

```typescript
export type HealthScoreStats = {
	businessRequirements: number;
	systemRequirements: number;
	implUnitSds: number;  // 追加（実装単位SD）
	// systemFunctions, entryPoints は削除
};
```

#### Step 2: buildHealthScoreSummaryの入力変更

**ファイル:** `lib/health-score/index.ts`

```typescript
export type HealthScoreInput = {
	businessRequirements?: BusinessRequirementHealthInput[];
	systemRequirements?: SystemRequirementHealthInput[];
	systemFunctions?: SystemFunctionHealthInput[];
	implUnitSds?: ImplUnitSdHealthInput[];  // 追加
	concepts?: ConceptHealthInput[];
	conceptCheckTarget?: 'business' | 'system' | 'all';
	pageType?: 'business' | 'system';
};

// 追加: 実装単位SDの型定義
export type ImplUnitSdHealthInput = {
	id: string;
	name: string;
	entryPoints?: EntryPoint[];
};

export const buildHealthScoreSummary = ({
	businessRequirements = [],
	systemRequirements = [],
	systemFunctions = [],
	implUnitSds = [],  // 追加
	concepts = [],
	conceptCheckTarget = 'business',
	pageType,
}: HealthScoreInput): HealthScoreSummary => {
	// ...

	// エントリポイント指標を実装単位SDに基づいて計算（システム要件ページのみ表示）
	if (pageType !== 'business') {
		const implUnitSdsWithEntryPoints = implUnitSds.filter(
			(sd) => ensureArray(sd.entryPoints).length > 0
		).length;
		issues.push(
			createIssue(
				"impl_unit_sds_with_entry_points",
				"実装単位SDにエントリポイントが設定されている",
				"high",
				implUnitSdsWithEntryPoints,
				implUnitSds.length
			)
		);
	}

	return {
		score,
		level,
		issues,
		warnings,
		stats: {
			businessRequirements: businessRequirements.length,
			systemRequirements: systemRequirements.length,
			implUnitSds: implUnitSds.length,  // 追加
		},
	};
};
```

#### Step 3: HealthScoreCardPropsにpageTypeを追加

**ファイル:** `components/health-score/health-score-card.tsx`

```typescript
type HealthScoreCardProps = {
	title?: string;
	summary: HealthScoreSummary | null;
	loading?: boolean;
	error?: string | null;
	maxIssues?: number;
	showStats?: boolean;
	pageType?: 'business' | 'system';  // 追加
};
```

#### Step 4: statsの表示をpageTypeで制御

```typescript
{showStats && (
	<div className="flex flex-wrap gap-4 text-[12px] text-slate-500">
		{(!pageType || pageType === 'system') && (
			<span>業務要件: {summary.stats.businessRequirements}</span>
		)}
		{(!pageType || pageType === 'business') && (
			<span>システム要件: {summary.stats.systemRequirements}</span>
		)}
		{(!pageType || pageType === 'business') && (
			<span>実装単位SD: {summary.stats.implUnitSds}</span>
		)}
	</div>
)}
```

#### Step 5: 呼び出し元の修正

**業務要件ページ:**
```typescript
// app/(with-sidebar)/business/[id]/[taskId]/page.tsx
const summary = buildHealthScoreSummary({
	businessRequirements: businessReqResult.data ?? [],
	systemRequirements: systemReqResult.data ?? [],
	systemFunctions: [],
	implUnitSds: [],  // 空配列
	concepts: conceptResult.data ?? [],
	conceptCheckTarget: 'business',
	pageType: 'business',
});

<HealthScoreCard
	title="業務タスクヘルススコア"
	summary={healthSummary}
	loading={healthLoading}
	showStats={true}
	pageType="business"  // 追加
/>
```

**システム要件ページ:**
```typescript
// app/(with-sidebar)/system-domains/[id]/[srfId]/page.tsx

// 1. 実装単位SDデータを取得
const [implUnitSds, setImplUnitSds] = useState<ImplUnitSd[]>([]);

// 2. ヘルススコア計算に渡す
const summary = buildHealthScoreSummary({
	businessRequirements: businessReqResult.data ?? [],
	systemRequirements: systemReqResult.data ?? [],
	systemFunctions: [currentSrf],
	implUnitSds: implUnitSds,  // 追加
	concepts: conceptResult.data ?? [],
	conceptCheckTarget: 'system',
	pageType: 'system',
});

<HealthScoreCard
	title="システム機能ヘルススコア"
	summary={healthSummary}
	loading={healthLoading}
	showStats={true}
	pageType="system"  // 追加
/>
```

**ダッシュボード:**
```typescript
// app/(with-sidebar)/dashboard/page.tsx
// 変更なし（pageTypeを渡さない = 全統計表示）
```

#### 実装パターン

```typescript
// システム要件に業務要件が紐づいている（システム要件ページのみ表示）
if (pageType !== 'business') {
    issues.push(
        createIssue(
            "system_requirements_with_business_requirements",
            "システム要件に業務要件が紐づいている",
            "high",
            systemRequirements.filter((req) => req.businessRequirementIds.length > 0).length,
            systemRequirements.length
        )
    );
}

// システム機能にエントリポイントが設定されている（システム要件ページのみ表示）
if (pageType !== 'business') {
    issues.push(
        createIssue(
            "system_functions_with_entry_points",
            "システム機能にエントリポイントが設定されている",
            "high",
            systemFunctions.filter((fn) => ensureArray(fn.entryPoints).length > 0).length,
            systemFunctions.length
        )
    );
}

// システム要件に観点種別が設定されている（システム要件ページのみ表示）
if (pageType !== 'business') {
    issues.push(
        createIssue(
            "system_requirements_with_category",
            "システム要件に観点種別が設定されている",
            "high",
            systemRequirements.filter((req) => req.categoryRaw && allowedCategories.has(req.categoryRaw))
                .length,
            systemRequirements.length
        )
    );
}

// システム要件に受入条件が設定されている（システム要件ページのみ表示）
if (pageType !== 'business') {
    issues.push(
        createIssue(
            "system_requirements_with_acceptance_criteria",
            "システム要件に受入条件が設定されている",
            "high",
            systemRequirements.filter((req) => hasAcceptanceCriteria(req.acceptanceCriteriaJson))
                .length,
            systemRequirements.length
        )
    );
}
```

---

## 影響範囲

### 変更ファイル
- `lib/health-score/index.ts` - 型定義、計算ロジック、エントリポイント指標の変更
- `components/health-score/health-score-card.tsx` - pageType propの追加、表示制御
- `app/(with-sidebar)/business/[id]/[taskId]/page.tsx` - pageType渡し
- `app/(with-sidebar)/system-domains/[id]/[srfId]/page.tsx` - pageType渡し、implUnitSds渡し

### 影響する機能
- 業務要件詳細ページのヘルススコア（検出ルール & 統計）
- システム要件詳細ページのヘルススコア（検出ルール & 統計）
- ダッシュボードのヘルススコア（統計）

### 破壊的変更
- `HealthScoreStats`型の変更（systemFunctions, entryPoints削除、implUnitSds追加）
- 検出ルールIDの変更（`system_functions_with_entry_points` → `impl_unit_sds_with_entry_points`）

---

## 検証方法

### 業務要件詳細ページ
**アクセス先:** http://localhost:3001/business/BIZ-001/TASK-001

**期待結果（検出ルール）:**
- ✅ 業務要件にシステム要件が紐づいている
- ✅ 概念辞書の用語にリンクされている
- ✅ 業務要件に概念が紐づいている

**期待結果（統計情報）:**
- ✅ 業務要件: 2
- ❌ システム要件: （非表示）
- ❌ 実装単位SD: （非表示）

**期待結果（表示されない項目）:**
- ❌ システム要件に業務要件が紐づいている
- ❌ 実装単位SDにエントリポイントが設定されている
- ❌ システム要件に観点種別が設定されている
- ❌ システム要件に受入条件が設定されている
- ❌ エントリポイントに責務が設定されている（前回削除済み）

### システム要件詳細ページ
**アクセス先:** http://localhost:3001/system-domains/AR/SRF-006

**期待結果（検出ルール）:**
- ✅ システム要件に業務要件が紐づいている
- ✅ 実装単位SDにエントリポイントが設定されている（★変更点）
- ✅ 概念辞書の用語にリンクされている
- ✅ システム要件に観点種別が設定されている
- ✅ システム要件に受入条件が設定されている

**期待結果（統計情報）:**
- ❌ 業務要件: （非表示）
- ✅ システム要件: 2
- ✅ 実装単位SD: X （実データに依存）

**期待結果（表示されない項目）:**
- ❌ 業務要件にシステム要件が紺づいている
- ❌ 業務要件に概念が紐づいている
- ❌ エントリポイントに責務が設定されている（前回削除済み）

### ダッシュボード
**アクセス先:** http://localhost:3001/dashboard

**期待結果（統計情報 - 全表示）:**
- ✅ 業務要件: X
- ✅ システム要件: X
- ✅ 実装単位SD: X
