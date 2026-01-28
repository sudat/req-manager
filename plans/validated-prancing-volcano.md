# 要件リンク画面 UI改善計画

## 背景・目的

要件リンク画面（`/links`）のユーザビリティ向上のため、以下の改善を実施する：

1. **更新日時ソート**: 最新のリンクが上に来るように
2. **要件名表示**: IDではなく要件名を表示
3. **リンク化**: ソース/ターゲットをクリックして該当ページへ遷移
4. **ローディング表示改善**: フィルタ切り替え時、テーブル部分だけをローディング状態に

---

## 現状の課題

| 課題 | 現状 |
|------|------|
| ソート順 | `created_at` 昇順（古い順） |
| 表示内容 | タイプとIDのみ（例: `SR: abc123`） |
| リンク | なし |
| ローディング | ページ全体（ヘッダー含む）がスケルトンになる |

---

## 実装設計

### 1. 更新日時ソート（★☆☆）

**変更ファイル**: `lib/data/requirement-links.ts`

```typescript
// 89行目を変更
// 現状: .order("created_at", { ascending: true });
// 変更後: .order("updated_at", { ascending: false });
```

---

### 2. 要件名表示（★★☆）

**新規ファイル**: `hooks/use-requirement-titles.ts`

```typescript
// 機能:
// 1. リンクからBR/SRのIDを収集
// 2. listBusinessRequirementsByIds / listSystemRequirementsByIds で一括取得
// 3. Map<`${type}:${id}`, { title, taskId?, srfId? }> を返す
```

**変更ファイル**: `app/(with-sidebar)/links/page.tsx`

```tsx
// hook使用
const titles = useRequirementTitles(links, currentProjectId);

// 表示変更（339-347行目）
<td className="px-4 py-3 text-sm">
  <div className="font-medium text-slate-900">
    {titles.get(`${link.sourceType}:${link.sourceId}`)?.title || `${link.sourceType.toUpperCase()}: ${link.sourceId}`}
  </div>
  <div className="text-xs text-slate-500">
    {link.sourceType.toUpperCase()}: {link.sourceId}
  </div>
</td>
```

---

### 3. リンク化（★★☆）

**調査結果**: BR/SRは一意で、IDからtaskId/srfIdが取得可能

| タイプ | 一意性 | URL例 |
|--------|--------|-------|
| BR | ✓ 一意 | `/business/{businessId}/{taskId}` |
| SR | ✓ 一意 | `/system-domains/{domainId}/{srfId}` |

**実装方針**:

`listBusinessRequirementsByIds` / `listSystemRequirementsByIds` で取得したデータに `taskId`/`srfId`/`businessId` が含まれているため、タイトル取得時にこれらの情報もMapに保持します。

```typescript
type RequirementTitleInfo = {
  title: string;
  taskId?: string;       // for BR
  businessId?: string;   // for BR
  srfId?: string;        // for SR
};
```

**URL生成**:

```typescript
function getRequirementUrl(type: string, id: string, info: RequirementTitleInfo): string {
  if (type === 'br' && info.businessId && info.taskId) {
    return `/business/${info.businessId}/${info.taskId}`;
  }
  if (type === 'sr' && info.srfId) {
    return `/system-domains/${info.srfId}`;
  }
  return '#';
}
```

---

### 4. ローディング表示改善（★☆☆）

**現状の問題**: フィルタ切り替え時にページ全体（ヘッダー含む）がスケルトンになる

**変更ファイル**: `app/(with-sidebar)/links/page.tsx`

**実装方針**:
- ヘッダー（タイトル・説明）とフィルターバーは常に表示
- テーブル部分だけをローディング状態にする
- `loading`状態の早期returnを削除し、テーブル内で条件分岐

**変更内容**:
```tsx
// 現状（93-104行目）: loading時にページ全体をスケルトンに
if (loading || projectLoading) {
  return (
    <div className="flex-1 min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// 変更後: ヘッダーとフィルターは常に表示、テーブルのみローディング
// 1. loading時の早期returnを削除
// 2. テーブル部分でloading判定
{loading ? (
  <div className="bg-white rounded-lg border border-slate-200 p-8">
    <div className="animate-pulse space-y-3">
      <div className="h-12 bg-slate-200 rounded"></div>
      <div className="h-12 bg-slate-200 rounded"></div>
      <div className="h-12 bg-slate-200 rounded"></div>
    </div>
  </div>
) : (
  // 通常のテーブル表示
)}
```

---

## 推奨実装順序

### Phase 1: 更新日時ソート
- 難易度: ★☆☆
- 変更: 1箇所の文字列変更

### Phase 2: 要件名表示
- 難易度: ★★☆
- 新規hook作成・表示変更

### Phase 3: リンク化
- 難易度: ★★☆
- BR/SRはIDからtaskId/srfIdが取得可能
- LinkコンポーネントでURL生成

---

## 変更ファイル一覧

| ファイル | 変更内容 | Phase |
|---------|---------|-------|
| `lib/data/requirement-links.ts` | `.order("updated_at", { ascending: false })` | 1 |
| `hooks/use-requirement-titles.ts` | **新規**: タイトル・メタデータ取得hook | 2, 3 |
| `app/(with-sidebar)/links/page.tsx` | hook使用・表示変更・リンク化・ローディング改善 | 2, 3, 4 |

---

## 懸念点と対策

| 懸念点 | 対策 |
|--------|------|
| N+1クエリ問題 | 一括取得APIを使用 |
| タイトル取得失敗 | フォールバック表示（ID表示） |
| URL構築に必要な情報 | BR/SRは一意で、IDからtaskId/srfIdが取得可能 |

---

## 検証方法

### Phase 1: 更新日時ソート
1. `/links` ページを開く
2. 更新日時の降順（最新が上）で表示されることを確認

### Phase 2: 要件名表示
1. ソース/ターゲット列に要件名が表示されることを確認
2. IDは小さくグレーアウトして表示されることを確認

### Phase 3: リンク化
1. BR/SRの要件名をクリック
2. 該当ページ（業務タスク詳細 or システム機能詳細）へ遷移することを確認

### Phase 4: ローディング表示改善
1. フィルタ（全件/疑義のみ）を切り替える
2. ヘッダーとフィルターバーが表示されたままであることを確認
3. テーブル部分だけがスケルトンローディングになることを確認
