# 修正計画: system-domains/page.tsx の Invalid hook call エラー

## 問題概要

**エラー**: `Invalid hook call. Hooks can only be called inside of the body of a function component.`

**原因**: `app/system-domains/page.tsx` の24行目で、`useMemo` フックが async 関数 `fetchData` 内で呼び出されている。

## 修正内容

### ファイル: `app/system-domains/page.tsx`

**変更前 (24-31行目)**:
```typescript
const counts = useMemo(() => {
    const map = new Map<string, number>();
    (functionRows ?? []).forEach((fn: SystemFunction) => {
        const domainId = fn.systemDomainId ?? "";
        if (!domainId) return;
        map.set(domainId, (map.get(domainId) ?? 0) + 1);
    });
    return map;
}, [functionRows]);

const data = (domainRows ?? []).map(
    (d: SystemDomain): SystemDomainWithCount => ({
        ...d,
        functionCount: map.get(d.id) ?? 0,
    }),
);
```

**変更後**:
```typescript
// 機能数を計算（useMemo は不要 - 単純なMap構築）
const map = new Map<string, number>();
(functionRows ?? []).forEach((fn: SystemFunction) => {
    const domainId = fn.systemDomainId ?? "";
    if (!domainId) return;
    map.set(domainId, (map.get(domainId) ?? 0) + 1);
});

const data = (domainRows ?? []).map(
    (d: SystemDomain): SystemDomainWithCount => ({
        ...d,
        functionCount: map.get(d.id) ?? 0,
    }),
);
```

## 根拠

- `fetchData` は非同期関数であり、コンポーネントではない
- React Hooks はコンポーネントのトップレベルでのみ呼び出し可能
- この関数はデータ取得時の単発計算なので、`useMemo` によるキャッシュは不要

## 難易度

**★☆☆** (1ファイル、数行の削除のみ)

## 検証手順

1. 修正を適用する
2. `bun run dev` で開発サーバーを起動
3. `http://localhost:3000/system-domains` にアクセス
4. エラーが発生せず、ページが正常に表示されることを確認
5. システムドメイン一覧が表示され、各ドメインの機能数カウントが正しいことを確認
