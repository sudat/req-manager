/**
 * 値がプレーンなオブジェクト（Record）であるかを判定
 * null, 配列, Date, RegExp 等はfalseを返す
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
