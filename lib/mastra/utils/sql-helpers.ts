/**
 * SQL Helper Functions
 *
 * Supabase/PostgreSQLで安全にクエリを構築するためのヘルパー関数群
 */

/**
 * LIKEパターンのエスケープ処理
 *
 * PostgreSQLのLIKE演算子では以下が特殊文字として扱われる:
 * - %: 任意の0文字以上に一致
 * - _: 任意の1文字に一致
 *
 * これらを文字通り検索する場合はバックスラッシュでエスケープする必要がある。
 *
 * @param str - エスケープ対象の文字列
 * @returns エスケープ済みの文字列
 *
 * @example
 * escapeLikePattern('GL%')      // => 'GL\\%'
 * escapeLikePattern('user_name') // => 'user\\_name'
 * escapeLikePattern('100%')      // => '100\\%'
 */
export function escapeLikePattern(str: string): string {
  return str.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * 複数のLIKE条件を構築する（OR結合）
 *
 * @param value - 検索値（エスケープ済み）
 * @param columns - 検索対象カラム名の配列
 * @returns Supabaseの.or()に渡せる条件文字列
 *
 * @example
 * buildOrLikeConditions('test', ['id', 'name', 'area'])
 * // => 'id.ilike.test%,name.ilike.%test%,area.ilike.%test%'
 */
export function buildOrLikeConditions(value: string, columns: string[]): string {
  const escapedValue = escapeLikePattern(value);
  return columns
    .map((column) => {
      // プレフィックス検索（id.ilike.value%）
      if (column === 'id') {
        return `${column}.ilike.${escapedValue}%`;
      }
      // 部分一致検索（column.ilike.%value%）
      return `${column}.ilike.%${escapedValue}%`;
    })
    .join(',');
}
