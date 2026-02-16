export const DD_DEPENDENCY_CALL_TYPES = ["calls_sync", "calls_async"] as const;

export type DdDependencyCallType = (typeof DD_DEPENDENCY_CALL_TYPES)[number];

export const DD_DEPENDENCY_CALL_TYPE_LABELS: Record<DdDependencyCallType, string> = {
  calls_sync: "同期呼び出し",
  calls_async: "非同期起動",
};

export type DdDependencyDraft = {
  targetDdId: string;
  callType: DdDependencyCallType;
  callId?: string;
  message?: string;
  returnsLabel?: string;
  returnSchemaRef?: string;
  errorLabel?: string;
  errorSchemaRef?: string;
  errorExceptionRef?: string;
  ruleRef?: string;
  asyncCompletion?: {
    callbackToDdId?: string;
    message?: string;
    timeoutMs?: number;
    successLabel?: string;
    successSchemaRef?: string;
    errorLabel?: string;
    errorSchemaRef?: string;
    errorExceptionRef?: string;
  };
};

export type DdDependencyLink = {
  sourceDdId: string;
  targetDdId: string;
  callType: DdDependencyCallType;
  callId?: string;
  message?: string;
  returnsLabel?: string;
  returnSchemaRef?: string;
  errorLabel?: string;
  errorSchemaRef?: string;
  errorExceptionRef?: string;
  ruleRef?: string;
  asyncCompletion?: {
    callbackToDdId?: string;
    message?: string;
    timeoutMs?: number;
    successLabel?: string;
    successSchemaRef?: string;
    errorLabel?: string;
    errorSchemaRef?: string;
    errorExceptionRef?: string;
  };
};

// ============================================
// 呼び出し元（受信方向）の型定義
// ============================================

/**
 * 呼び出し元の種別
 * - user: ユーザーが直接起動（画面系DDの場合）
 * - system: システム内の別DDが起動
 */
export const DD_CALLER_TYPES = ["user", "system"] as const;
export type DdCallerType = (typeof DD_CALLER_TYPES)[number];

export const DD_CALLER_TYPE_LABELS: Record<DdCallerType, string> = {
  user: "ユーザー",
  system: "システム",
};

/**
 * 呼び出し元情報（Draft用）
 */
export type DdCallerDraft = {
  /** 呼び出し元種別 */
  callerType: DdCallerType;
  /** 呼び出し元のSF ID（callerType="system"の場合のみ） */
  callerSfId?: string;
  /** 呼び出し元のDD ID（callerType="system"の場合のみ） */
  callerDdId?: string;
  /** 呼び出し元のDD名称（callerType="system"の場合のみ、表示用） */
  callerName?: string;
  /** 呼び出し方法（callerType="system"の場合のみ） */
  callType?: DdDependencyCallType;
};

/**
 * 呼び出し元リンク（DB保存用）
 */
export type DdCallerLink = {
  /** 呼び出される側（このDD） */
  targetDdId: string;
  /** 呼び出し元種別 */
  callerType: DdCallerType;
  /** 呼び出し元のDD ID（callerType="system"の場合） */
  callerDdId?: string;
  /** 呼び出し方法（callerType="system"の場合） */
  callType?: DdDependencyCallType;
};
