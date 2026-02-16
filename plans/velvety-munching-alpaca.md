# シーケンス図初期表示サイズ変更とDD詳細ダイアログ修正

## Context

ユーザーからの報告:
1. 「初期表示を2倍にして」 - 現在1.5倍だが、さらに大きくしたい
2. DdDetailDialogで「DDの取得に失敗しました」エラーが発生

## 課題1: 初期表示サイズを2倍に変更

### 現状
`components/schema/SchemaViewer.tsx` で `initialScale={1.5}` に設定されている

### 変更内容
```diff
- initialScale={1.5}
+ initialScale={2}
```

### 変更ファイル
- `components/schema/SchemaViewer.tsx`

---

## 課題2: DdDetailDialog エラー調査

### エラー内容
```
DDの取得に失敗しました
    at DdDetailDialog.useEffect.fetchDd (components/schema/DdDetailDialog.tsx:40:17)
```

### エラー発生箇所
- **クライアント**: `components/schema/DdDetailDialog.tsx:40`
  ```tsx
  const response = await fetch(
    `/api/design-documents/${ddId}?projectId=${projectId}`
  );

  if (!response.ok) {
    throw new Error("DDの取得に失敗しました");
  }
  ```

- **API**: `app/api/design-documents/[ddId]/route.ts:26-34`
  ```tsx
  const { data: dd, error } = await getDesignDocumentById(params.ddId, projectId);

  if (error || !dd) {
    console.error("Failed to fetch design document:", error);
    return NextResponse.json(
      { error: "DesignDocument not found" },
      { status: 404 }
    );
  }
  ```

### 原因分析

1. **ddMapping の生成元**: `lib/utils/design-documents/sideeffects-to-mermaid.ts:148-150`
   ```typescript
   const ddMapping = Object.fromEntries(
     parsed.map((item) => [item.alias, item.dd.id] as const)
   );
   ```

2. **シーケンス図API**: `app/api/schema/sequence/route.ts:44-47`
   ```typescript
   const { data: dds, error: ddError } = await listDesignDocumentsBySrfId(
     srfId,
     projectId || undefined  // ← undefined が渡される可能性
   );
   ```

3. **CRUD操作**: `lib/data/crud-factory.ts:166-183`
   ```typescript
   const getById = async (id: string, projectId?: string): Promise<DataResult<Entity>> => {
     // ...
     if (projectId) {
       query = query.eq(projectIdColumn, projectId);
     }
     const { data, error } = await query.maybeSingle();
     // ...
   };
   ```

### 仮説
- `projectId` が正しく渡っていない可能性
- `listDesignDocumentsBySrfId` が `projectId || undefined` を渡しているため、projectIdがない場合に全プロジェクトのDDを取得している可能性
- 一方、`getDesignDocumentById` は `projectId` が必須で、フィルタリングを行う

### デバッグ手順

1. **DdDetailDialog でログ出力**: 渡される `ddId` と `projectId` をコンソールに出力
2. **APIルートでログ出力**: 受け取る `params.ddId` と `projectId` をコンソールに出力
3. **Supabaseクエリを確認**: `getDesignDocumentById` で実際に発行されるクエリを確認

### 修正案

#### 方案A: DdDetailDialog でエラーハンドリング強化
```tsx
// ddMapping に含まれるが、DBに存在しない場合のフォールバック
if (!response.ok) {
  console.error(`DD fetch failed: ddId=${ddId}, projectId=${projectId}, status=${response.status}`);
  throw new Error("DDの取得に失敗しました");
}
```

#### 方案B: APIルートで詳細なエラーログ
```tsx
console.log(`Fetching DD: ddId=${params.ddId}, projectId=${projectId}`);
const { data: dd, error } = await getDesignDocumentById(params.ddId, projectId);
console.log(`DD fetch result:`, { dd, error });
```

#### 方案C: シーケンス図APIでprojectIdを必須にする
```tsx
if (!projectId) {
  return NextResponse.json(
    { error: "projectId is required" },
    { status: 400 }
  );
}
```

### 推奨アプローチ
1. まずデバッグログを追加して原因を特定する
2. 原因に応じて適切な修正を適用する

---

## Implementation Plan

### Phase 1: 初期表示サイズ変更
1. `components/schema/SchemaViewer.tsx` の `initialScale` を 1.5 → 2 に変更

### Phase 2: デバッグログ追加
1. `app/api/design-documents/[ddId]/route.ts` に詳細ログを追加
2. `components/schema/DdDetailDialog.tsx` にログを追加
3. ブラウザで動作確認し、ログから原因を特定

### Phase 3: 根本修正
1. 特定された原因に応じて修正を適用

---

## Critical Files

- `components/schema/SchemaViewer.tsx` - initialScale設定
- `app/api/design-documents/[ddId]/route.ts` - DD取得API
- `components/schema/DdDetailDialog.tsx` - DD詳細ダイアログ
- `lib/utils/design-documents/sideeffects-to-mermaid.ts` - ddMapping生成
- `lib/data/crud-factory.ts` - getById実装
- `lib/data/design-documents.ts` - getDesignDocumentById実装
