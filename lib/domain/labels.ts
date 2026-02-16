import { z } from "zod";
import { businessRuleTypeEnum } from "./schemas/core-logic";
import { exceptionTypeSchema, recoveryStrategySchema } from "./schemas/exceptions";

type BusinessRuleType = z.infer<typeof businessRuleTypeEnum>;
type ExceptionType = z.infer<typeof exceptionTypeSchema>;
type RecoveryType = z.infer<typeof recoveryStrategySchema>;

/**
 * ビジネスルール種別ラベル
 */
export const BUSINESS_RULE_TYPE_LABELS: Record<BusinessRuleType, string> = {
  validate: "検証",
  read: "抽出",
  derive: "算出",
  decide: "判定",
};

/**
 * 例外種別ラベル
 */
export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  validation: "検証エラー",
  state: "状態エラー",
  permission: "権限エラー",
  external: "外部連携エラー",
  timeout: "タイムアウト",
  conflict: "競合",
};

/**
 * 復旧戦略ラベル
 */
export const RECOVERY_TYPE_LABELS: Record<RecoveryType, string> = {
  none: "なし",
  retry_immediate: "即時リトライ",
  retry_with_backoff: "バックオフ付きリトライ",
  fallback: "フォールバック",
  manual_intervention: "手動介入",
  circuit_breaker: "サーキットブレーカー",
};
