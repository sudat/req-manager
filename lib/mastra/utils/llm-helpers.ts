import { getOpenAIApiKey } from '@/lib/config/env';

/**
 * OpenAI GPT-5 シリーズのモデル
 *
 * 利用可能なモデル:
 * - gpt-5-nano: 最速・最安、要約・分類タスクに最適
 * - gpt-5-mini: 軽量・高速（デフォルト）
 * - gpt-5: 標準モデル
 * - gpt-5.1: 最新、より賢く自然なトーン、適応的推論を使用
 * - gpt-5.2: フラグシップモデル、コーディング・エージェントタスクに最適
 *
 * ※ 上記以外にも任意のOpenAIモデルを指定可能
 *
 * @see https://platform.openai.com/docs/models/
 */
export type OpenAIModel =
  | 'gpt-5-nano'
  | 'gpt-5-mini'
  | 'gpt-5'
  | 'gpt-5.1'
  | 'gpt-5.2'
  | (string & {});

/**
 * LLM呼び出しオプション
 */
export interface LLMRequestOptions {
  /** システムプロンプト（役割定義） */
  systemPrompt: string;
  /** ユーザープロンプト（実際の指示） */
  userPrompt: string;
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
  /** 生成トークン上限（chat.completions: max_tokens） */
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
    model = 'gpt-5-mini',
    jsonMode = false,
    temperature,
    timeoutMs = 180000,
    baseUrl,
    maxTokens,
    verbosity,
  } = options;

  const openaiApiKey = getOpenAIApiKey();

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
        Authorization: `Bearer ${openaiApiKey}`,
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

  if (!result.choices?.[0]?.message?.content) {
    console.error('[callOpenAI] Invalid response:', result);
    throw new Error('Invalid LLM response: no content in choices');
  }

  const rawContent = result.choices[0].message.content;
  const content = jsonMode ? JSON.parse(rawContent) : rawContent;

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
 * - 高度な推論 → gpt-5.1（最新、自然なトーン）
 * - コーディング・エージェント → gpt-5.2（フラグシップ）
 *
 * @returns デフォルトで使用するモデル名
 */
export function getDefaultModel(): OpenAIModel {
  return (process.env.OPENAI_DEFAULT_MODEL as OpenAIModel) || 'gpt-5-mini';
}
