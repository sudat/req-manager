/**
 * Mastra Tool レスポンスヘルパー
 *
 * ツールの成功・失敗レスポンスを統一的に生成するヘルパー関数。
 * エラーハンドリングの一貫性と型安全性を提供する。
 */

/**
 * ツール実行成功時のレスポンス
 */
export interface ToolSuccessResult<T = Record<string, unknown>> {
  success: true;
  message: string;
  data?: T;
  [key: string]: unknown;
}

/**
 * ツール実行失敗時のレスポンス
 */
export interface ToolErrorResult {
  success: false;
  error: string;
  message: string;
}

/**
 * ツールレスポンスの型（成功 | 失敗）
 */
export type ToolResult<T = Record<string, unknown>> =
  | ToolSuccessResult<T>
  | ToolErrorResult;

/**
 * ツール実行成功時のレスポンスを生成
 *
 * @param message 成功メッセージ（ユーザーフレンドリーな説明）
 * @param data 追加で返すデータ（オプション）
 * @returns 成功レスポンスオブジェクト
 *
 * @example
 * // データなし
 * return toolSuccess('リンク取得に成功しました');
 *
 * @example
 * // データあり
 * return toolSuccess('3件のリンクが見つかりました', {
 *   links: [...],
 *   count: 3,
 * });
 */
export function toolSuccess<T = Record<string, unknown>>(
  message: string,
  data?: T
): ToolSuccessResult<T> {
  return {
    success: true,
    message,
    ...(data && typeof data === 'object' ? data : {}),
  } as ToolSuccessResult<T>;
}

/**
 * ツール実行失敗時のレスポンスを生成
 *
 * @param error エラーオブジェクトまたはエラーメッセージ
 * @param message ユーザーフレンドリーなエラーメッセージ
 * @returns エラーレスポンスオブジェクト
 *
 * @example
 * // Errorオブジェクトから生成
 * try {
 *   // ...
 * } catch (error: any) {
 *   return toolError(error, 'リンク取得に失敗しました');
 * }
 *
 * @example
 * // エラーメッセージ文字列から生成
 * return toolError('Database connection failed', 'データベース接続に失敗しました');
 */
export function toolError(
  error: Error | string,
  message: string
): ToolErrorResult {
  const errorMessage = error instanceof Error ? error.message : error;

  return {
    success: false,
    error: errorMessage,
    message,
  };
}

/**
 * 非同期ツール実行をtry-catchでラップし、自動的にエラーハンドリングを行う
 *
 * @param fn 実行する非同期関数
 * @param errorMessage エラー時のメッセージ
 * @returns ツールレスポンス
 *
 * @example
 * export const myTool = createTool({
 *   id: 'my_tool',
 *   description: '...',
 *   inputSchema: z.object({ ... }),
 *   execute: async (inputData) => {
 *     return wrapToolExecution(async () => {
 *       const result = await someAsyncOperation(inputData);
 *       return toolSuccess('操作が完了しました', { result });
 *     }, 'ツール実行に失敗しました');
 *   },
 * });
 */
export async function wrapToolExecution<T = Record<string, unknown>>(
  fn: () => Promise<ToolSuccessResult<T>>,
  errorMessage: string
): Promise<ToolResult<T>> {
  try {
    return await fn();
  } catch (error: any) {
    return toolError(error, errorMessage);
  }
}
