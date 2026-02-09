/**
 * FK参照情報を扱うユーティリティ関数
 */

/**
 * constraints フィールドから FK参照情報を抽出
 * @param constraints - 制約文字列（例: "FK: products.id"）
 * @returns FK参照情報（entity, attribute）、またはnull
 */
export const extractForeignKeyReference = (
  constraints?: string
): { entity: string; attribute: string } | null => {
  if (!constraints) return null;
  const match = constraints.match(/^FK:\s*(\w+)\.(\w+)$/m);
  if (!match) return null;
  return { entity: match[1], attribute: match[2] };
};

/**
 * constraints フィールドから FK以外の制約（CHECK制約など）を抽出
 * @param constraints - 制約文字列
 * @returns FK参照を除外した制約文字列
 */
export const extractCheckConstraints = (constraints?: string): string => {
  if (!constraints) return "";
  const lines = constraints.split("\n");
  // FK: で始まる行を除外
  const checkLines = lines.filter((line) => !line.trim().startsWith("FK:"));
  return checkLines.join("\n").trim();
};
