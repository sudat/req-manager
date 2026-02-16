/**
 * 配列の指定インデックスの要素を更新（イミュータブル）
 * インデックスが範囲外の場合は元の配列を返す
 */
export function updateAtIndex<T>(
  arr: readonly T[] | undefined,
  index: number,
  patch: Partial<T>
): T[] {
  if (!arr || index < 0 || index >= arr.length) return [...(arr ?? [])];
  const next = [...arr];
  next[index] = { ...next[index], ...patch };
  return next;
}

/**
 * 配列の指定インデックスの要素を削除（イミュータブル）
 */
export function removeAtIndex<T>(
  arr: readonly T[] | undefined,
  index: number
): T[] {
  if (!arr || index < 0 || index >= arr.length) return [...(arr ?? [])];
  return arr.filter((_, i) => i !== index);
}

/**
 * ネストした配列フィールドに要素を追加（イミュータブル）
 * parent[key] が配列でない場合は初期化
 */
export function appendToArray<T, K extends keyof T>(
  parent: T,
  key: K,
  item: T[K] extends (infer U)[] ? U : never
): T {
  const current = (parent[key] as T[K] extends (infer U)[] ? U[] : never) ?? [];
  return {
    ...parent,
    [key]: [...current, item],
  };
}
