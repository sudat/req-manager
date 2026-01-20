# ビルドエラー解消計画

## 概要
`app/business/[id]/tasks/[taskId]/use-task-detail.ts` で発生している型エラーを解消する。

## エラー内容
```
./app/business/[id]/tasks/[taskId]/use-task-detail.ts:204:3
Type error: Type 'Map<string, string | null | undefined>' is not assignable to type 'Map<string, string | null>'.
```

## 原因
168-171行目の `systemFunctionDomainMap` 生成時、`srf.systemDomainId` の型が `string | null | undefined` だが、戻り値型定義（49行目）では `Map<string, string | null>` となっており、`undefined` が含まれていることが原因。

## 修正内容
**ファイル**: `app/business/[id]/tasks/[taskId]/use-task-detail.ts`

168-171行目を以下のように修正：

```typescript
// 修正前
const systemFunctionDomainMap = useMemo(
	() => new Map(systemFunctions.map((srf) => [srf.id, srf.systemDomainId])),
	[systemFunctions],
);

// 修正後
const systemFunctionDomainMap = useMemo(
	() => new Map(systemFunctions.map((srf) => [srf.id, srf.systemDomainId ?? null])),
	[systemFunctions],
);
```

`srf.systemDomainId ?? null` で `undefined` を `null` に変換する。

## 検証
ビルドが成功することを確認する。
```bash
bun run build
```
