/**
 * テキスト整形ユーティリティ
 *
 * SSEストリーム構築時のメッセージ整形に使用する純粋関数群。
 */

/**
 * テキストを指定文字数で切り詰める
 * @param text 対象テキスト
 * @param max 最大文字数（デフォルト: 240）
 * @returns 切り詰められたテキスト（超過時は末尾に「…」を付与）
 */
export const trimText = (text: string, max = 240): string =>
  text.length > max ? `${text.slice(0, max)}…` : text;

/**
 * 任意の値を文字列に変換する
 * @param value 変換対象の値
 * @returns 文字列化された値（変換不可時は空文字）
 */
export const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/**
 * オブジェクトからメッセージフィールドを抽出する
 * @param value 抽出対象のオブジェクト
 * @returns message/summary/errorフィールドの値、または undefined
 */
export const pickMessage = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (typeof record.summary === 'string') return record.summary;
  if (typeof record.error === 'string') return record.error;
  return undefined;
};

/**
 * ツール入力を整形して表示用文字列に変換する
 * @param input ツール入力値
 * @returns 整形された文字列、または undefined（空の場合）
 */
export const formatToolInput = (input: unknown): string | undefined => {
  const text = stringifyValue(input).trim();
  return text ? `入力: ${trimText(text)}` : undefined;
};

/**
 * ツール実行結果を整形して表示用文字列に変換する
 * @param output ツール実行結果
 * @returns 整形された文字列、または undefined（空の場合）
 */
export const formatToolResult = (output: unknown): string | undefined => {
  const message = pickMessage(output);
  const text = (message ?? stringifyValue(output)).trim();
  return text ? `結果: ${trimText(text)}` : undefined;
};

/**
 * ツールエラーを整形して表示用文字列に変換する
 * @param error エラー値（文字列、Errorオブジェクト、またはその他）
 * @returns 整形されたエラーメッセージ
 */
export const formatToolError = (error: unknown): string => {
  const text =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : stringifyValue(error);
  return text ? `エラー: ${trimText(text)}` : 'エラーが発生しました';
};
