import { getOpenAIApiKey, getZaiApiKey } from '@/lib/config/env';

/**
 * OpenAI GPT-5 シリーズのモデル
 *
 * 利用可能なモデル:
 * - gpt-5.2: 最新の汎用モデル
 * - gpt-5.2-chat-latest: ChatGPT相当の最新モデル
 * - gpt-5.2-pro: より深く思考する上位モデル（Responses API専用）
 * - gpt-5.2-codex: コーディング最適化モデル（Responses API専用）
 * - gpt-5: 標準モデル
 * - gpt-5-mini: 軽量・高速（デフォルト）
 * - gpt-5-nano: 最速・最安、要約・分類タスクに最適
 *
 * ※ 上記以外にも任意のOpenAIモデルを指定可能
 *
 * @see https://platform.openai.com/docs/models/
 */
export type OpenAIModel =
  | 'gpt-5.2'
  | 'gpt-5.2-chat-latest'
  | 'gpt-5.2-pro'
  | 'gpt-5.2-codex'
  | 'gpt-5-nano'
  | 'gpt-5-mini'
  | 'gpt-5'
  | (string & {});

/**
 * LLM呼び出しオプション
 */
export interface LLMRequestOptions {
  /** システムプロンプト（役割定義） */
  systemPrompt: string;
  /** ユーザープロンプト（実際の指示） */
  userPrompt: string;
  /** 使用するAPIプロバイダー */
  provider?: 'openai' | 'zai';
  /** 使用するモデル（デフォルト: gpt-5-mini） */
  model?: OpenAIModel;
  /** JSON形式で出力するか（デフォルト: false） */
  jsonMode?: boolean;
  /** 温度パラメータ（0.0-2.0、デフォルト: 未指定=API任せ） */
  temperature?: number;
  /** タイムアウト（ミリ秒） */
  timeoutMs?: number;
  /** OpenAI互換APIのベースURL */
  baseUrl?: string;
  /** 生成トークン上限（GPT-5はmax_completion_tokens、それ以外はmax_tokens） */
  maxTokens?: number;
  /** GPT-5 verbosity: "low"(terse) | "medium"(balanced) | "high"(detailed) */
  verbosity?: 'low' | 'medium' | 'high';
}

/**
 * LLMレスポンス
 */
export interface LLMResponse<T = string> {
  /** レスポンス内容（jsonMode=trueの場合はパース済みオブジェクト） */
  content: T;
  /** 実際に使用されたモデル名 */
  model: string;
  /** トークン使用量 */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI API を呼び出す共通ヘルパー関数
 *
 * @example
 * // JSON形式で出力（デフォルトモデル: gpt-5-mini）
 * const result = await callOpenAI<{ name: string; summary: string }>({
 *   systemPrompt: 'あなたは業務分析の専門家です。',
 *   userPrompt: '以下の業務説明から...',
 *   jsonMode: true,
 * });
 * console.log(result.content.name);
 *
 * @example
 * // テキスト形式で出力（フラグシップモデル指定）
 * const result = await callOpenAI({
 *   systemPrompt: 'あなたは設計の専門家です。',
 *   userPrompt: '以下のシステム機能の実装設計案を...',
 *   model: 'gpt-5.2', // コーディング・エージェントタスクに最適
 * });
 * console.log(result.content);
 *
 * @example
 * // 高速・低コストモデルで要約
 * const result = await callOpenAI({
 *   systemPrompt: 'あなたは要約の専門家です。',
 *   userPrompt: '以下のテキストを要約してください...',
 *   model: 'gpt-5-nano', // 最速・最安
 * });
 * console.log(result.content);
 */
export async function callOpenAI<T = string>(
  options: LLMRequestOptions
): Promise<LLMResponse<T>> {
  const {
    systemPrompt,
    userPrompt,
    provider,
    model = 'gpt-5-mini',
    jsonMode = false,
    temperature,
    timeoutMs = 180000,
    baseUrl,
    maxTokens,
    verbosity,
  } = options;

  const normalizedProvider =
    provider ?? (baseUrl && /z\.ai/i.test(baseUrl) ? 'zai' : 'openai');
  const apiKey = normalizedProvider === 'zai' ? getZaiApiKey() : getOpenAIApiKey();

  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  if (jsonMode) {
    requestBody.response_format = { type: 'json_object' };
  }

  if (temperature !== undefined) {
    requestBody.temperature = temperature;
  }
  if (maxTokens !== undefined) {
    const normalizedModel = model.includes('/') ? model.split('/').pop() ?? model : model;
    const useMaxCompletionTokens = normalizedModel.startsWith('gpt-5');
    if (useMaxCompletionTokens) {
      requestBody.max_completion_tokens = maxTokens;
    } else {
      requestBody.max_tokens = maxTokens;
    }
  }
  if (verbosity !== undefined) {
    requestBody.verbosity = verbosity;
  }

  const controller = new AbortController();
  const timeoutId = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  const apiBaseUrl = (baseUrl && baseUrl.trim().length > 0 ? baseUrl : 'https://api.openai.com/v1')
    .replace(/\/$/, '');
  const apiUrl = `${apiBaseUrl}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      const timeoutLabel = timeoutMs ? `${timeoutMs}ms` : 'timeout';
      throw new Error(`OpenAI API timeout: ${timeoutLabel}`);
    }
    throw error;
  }
  if (timeoutId) clearTimeout(timeoutId);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[callOpenAI] API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody.substring(0, 500),
    });
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const choice = result?.choices?.[0];
  const finishReason = choice?.finish_reason;
  const message = choice?.message ?? {};
  const normalizeContent = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      const merged = value
        .map((part) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && 'text' in part) {
            return String((part as { text?: unknown }).text ?? '');
          }
          return '';
        })
        .join('');
      return merged;
    }
    return undefined;
  };
  const rawContent = normalizeContent((message as { content?: unknown }).content);

  if (!rawContent || rawContent.trim().length === 0) {
    const refusal = (message as { refusal?: string }).refusal;
    console.error('[callOpenAI] Invalid response:', {
      finishReason,
      refusal,
      raw: result,
    });
    throw new Error(
      refusal
        ? `OpenAI refusal: ${refusal}`
        : `Invalid LLM response: no content in choices (finish_reason=${finishReason ?? 'unknown'})`
    );
  }

  let content: unknown = rawContent;
  if (jsonMode) {
    try {
      content = JSON.parse(rawContent);
    } catch (error) {
      console.error('[callOpenAI] JSON parse failed:', {
        finishReason,
        error: error instanceof Error ? error.message : String(error),
        snippet: rawContent.slice(0, 200),
      });
      const suffix = finishReason === 'length' ? ' (finish_reason=length)' : '';
      throw new Error(`Invalid LLM JSON response${suffix}`);
    }
  }

  return {
    content: content as T,
    model: result.model,
    usage: result.usage,
  };
}

/**
 * デフォルトモデルを取得
 *
 * 環境変数 OPENAI_DEFAULT_MODEL が設定されていればそれを使用。
 * 未設定の場合は 'gpt-5-mini' を返す。
 *
 * 推奨モデルの選び方:
 * - 要約・分類タスク → gpt-5-nano（最速・最安）
 * - 一般的なタスク → gpt-5-mini（バランス型、デフォルト）
 * - 高度な推論 → gpt-5.2-pro（深い推論）
 * - コーディングタスク → gpt-5.2-codex
 *
 * @returns デフォルトで使用するモデル名
 */
export function getDefaultModel(): OpenAIModel {
  return (process.env.OPENAI_DEFAULT_MODEL as OpenAIModel) || 'gpt-5-mini';
}
