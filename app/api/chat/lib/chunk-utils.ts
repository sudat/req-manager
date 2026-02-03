/**
 * チャンク正規化ユーティリティ
 *
 * Mastraエージェントから返されるストリームチャンクの構造を正規化し、
 * ツールメタデータを抽出する純粋関数群。
 */

/**
 * 正規化されたチャンク型
 */
export type NormalizedChunk = {
  type?: string;
  payload?: Record<string, unknown>;
};

/**
 * ツールメタデータ型
 */
export type ToolMeta = {
  toolCallId: string | undefined;
  toolName: string | undefined;
  input: unknown;
  output: unknown;
};

/**
 * ツール名を正規化する
 *
 * 例: btDraftTool -> bt_draft, system_draft -> system_draft
 */
export const normalizeToolName = (toolName?: string): string => {
  if (!toolName) return '';
  return toolName
    .replace(/Tool$/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
};

/**
 * ストリームチャンクを正規化する
 *
 * Mastraのストリームチャンクは、ネストした payload 構造を持つ場合がある。
 * この関数は、二重ネストされた payload を平坦化する。
 *
 * @param rawChunk 生のチャンクデータ
 * @returns 正規化されたチャンク
 */
export const normalizeChunk = (rawChunk: unknown): NormalizedChunk => {
  if (
    rawChunk &&
    typeof rawChunk === 'object' &&
    'payload' in rawChunk
  ) {
    const payload = (rawChunk as { payload?: unknown }).payload;
    if (
      payload &&
      typeof payload === 'object' &&
      'type' in payload &&
      'payload' in payload
    ) {
      return payload as {
        type: string;
        payload: Record<string, unknown>;
      };
    }
  }
  return rawChunk as { type?: string; payload?: Record<string, unknown> };
};

/**
 * チャンクから payload を解決する
 *
 * チャンクが payload フィールドを持つ場合はそれを返し、
 * そうでない場合はチャンク自体を payload として扱う。
 *
 * @param rawChunk 生のチャンクデータ
 * @returns 解決された payload
 */
export const resolvePayload = (rawChunk: unknown): Record<string, unknown> => {
  if (rawChunk && typeof rawChunk === 'object' && 'payload' in rawChunk) {
    return (rawChunk as { payload?: Record<string, unknown> }).payload ?? {};
  }
  return rawChunk as Record<string, unknown>;
};

/**
 * チャンクとpayloadからツールメタデータを抽出する
 *
 * ツール呼び出しに関連する情報（ID、名前、入力、出力）を、
 * 様々なフィールド名のバリエーションから柔軟に抽出する。
 *
 * @param rawChunk 生のチャンクデータ
 * @param payload 解決された payload
 * @returns ツールメタデータ
 */
export const resolveToolMeta = (
  rawChunk: Record<string, unknown>,
  payload: Record<string, unknown>
): ToolMeta => {
  const toolCallId =
    (payload.toolCallId as string | undefined) ??
    (payload.callId as string | undefined) ??
    (rawChunk.toolCallId as string | undefined) ??
    (rawChunk.id as string | undefined);
  const toolName =
    (payload.toolName as string | undefined) ??
    (payload.name as string | undefined) ??
    (rawChunk.toolName as string | undefined) ??
    (rawChunk.name as string | undefined);
  const input =
    payload.input ??
    payload.args ??
    payload.arguments ??
    rawChunk.input ??
    rawChunk.args ??
    rawChunk.arguments;
  const output =
    payload.result ??
    payload.output ??
    rawChunk.result ??
    rawChunk.output ??
    payload;
  return { toolCallId, toolName, input, output };
};
