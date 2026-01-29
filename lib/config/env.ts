/**
 * 環境変数バリデーションモジュール
 *
 * アプリケーション起動時と実行時の環境変数チェックを一元管理する。
 */

/**
 * 必須環境変数の定義
 */
const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

/**
 * 環境変数バリデーション結果
 */
export interface EnvValidationResult {
  valid: boolean;
  error?: string;
  missing?: string[];
}

/**
 * 必須環境変数のバリデーションを実行する
 *
 * @returns バリデーション結果（valid, error, missing）
 *
 * @example
 * const validation = validateEnvVars();
 * if (!validation.valid) {
 *   console.error(validation.missing);
 * }
 */
export function validateEnvVars(): EnvValidationResult {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      error: `必須環境変数が未設定です: ${missing.join(', ')}`,
      missing,
    };
  }

  return { valid: true };
}

/**
 * OpenAI APIキーを安全に取得する
 *
 * 未設定の場合は例外をスローする。
 *
 * @returns OpenAI APIキー
 * @throws {Error} OPENAI_API_KEYが未設定の場合
 *
 * @example
 * try {
 *   const apiKey = getOpenAIApiKey();
 *   // APIキーを使用
 * } catch (error) {
 *   console.error('設定エラー:', error.message);
 * }
 */
export function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return key;
}

/**
 * Supabase URLを取得する
 *
 * @returns Supabase URL
 * @throws {Error} NEXT_PUBLIC_SUPABASE_URLが未設定の場合
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  return url;
}

/**
 * Supabase Anon Keyを取得する
 *
 * @returns Supabase Anon Key
 * @throws {Error} NEXT_PUBLIC_SUPABASE_ANON_KEYが未設定の場合
 */
export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }
  return key;
}
