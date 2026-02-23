import { z } from "zod";

export const exceptionTypeSchema = z
  .enum([
    "validation",
    "state",
    "permission",
    "external",
    "timeout",
    "conflict",
  ])
  .describe(
    "例外タイプ。validationは入力値のバリデーションエラー、stateはビジネスロジック上の状態違反（例: 存在しないリソースへの操作）、permissionは権限不足、externalは外部APIやサービスのエラー、timeoutは処理時間超過、conflictは排他競合（例: 重複登録、楽観的ロック失敗）"
  );

export const recoveryStrategySchema = z
  .enum([
    "none",
    "retry_immediate",
    "retry_with_backoff",
    "fallback",
    "manual_intervention",
    "circuit_breaker",
  ])
  .describe(
    "リカバリ戦略。noneはリカバリ処理なし（エラーをそのまま返す）、retry_immediateは即時リトライ、retry_with_backoffは待機時間を増やしながらリトライ（指数関数的バックオフ等）、fallbackは代替処理へ切り替え、manual_interventionは手動介入を要請、circuit_breakerは一定期間リクエストを停止（サーキットブレーカーパターン）"
  );

export const structuredExceptionSchema = z
  .object({
    type: exceptionTypeSchema.describe(
      "この例外のタイプカテゴリ。エラーの性質（バリデーション/状態/権限/外部/タイムアウト/競合）を分類"
    ),
    condition: z
      .string()
      .describe(
        "例外が発生する条件またはトリガー（例: 'メールアドレスが既に登録されている', '在庫数が不足している', 'APIレスポンスが5xxエラー'）。どのような状況でこの例外が投げられるかを明示"
      ),
    httpStatus: z
      .number()
      .optional()
      .describe(
        "HTTPレスポンスのステータスコード（例: 400, 401, 403, 404, 409, 500, 503）。API設計の場合にクライアントへ返す適切なステータスコードを指定"
      ),
    errorCode: z
      .string()
      .describe(
        "システム内で一意なエラーコード（例: 'EMAIL_ALREADY_EXISTS', 'INSUFFICIENT_STOCK', 'EXTERNAL_API_TIMEOUT'）。プログラム上のエラーハンドリングや多言語対応に使用"
      ),
    message: z
      .string()
      .describe(
        "エラーメッセージのデフォルト文（例: '指定されたメールアドレスは既に登録されています'）。開発者やユーザー向けの説明文"
      ),
    userNotification: z
      .enum(["none", "inline", "toast", "modal", "page"])
      .optional()
      .describe(
        "ユーザーへの通知方法。noneは通知なし、inlineはフォーム上のエラー表示、toastはトースト通知（一時的なポップアップ）、modalはモーダルダイアログ、pageは専用エラーページ"
      ),
    logging: z
      .enum(["none", "structured", "audit", "error"])
      .optional()
      .describe(
        "ログ出力レベル。noneはログなし、structuredは構造化ログ（JSON等）、auditは監査ログ（トレーサビリティ用途）、errorはエラーログ"
      ),
    recovery: recoveryStrategySchema.describe(
      "例外発生時のリカバリ戦略。どのように復旧するか（なし/リトライ/フォールバック/手動介入/サーキットブレーカー）"
    ),
    retryPolicy: z
      .object({
        maxRetries: z
          .number()
          .default(3)
          .describe(
            "最大リトライ回数。リカバリ戦略でリトライを選択した場合の再試行回数（例: 3なら最初の実行を含めて最大4回実行）"
          ),
        backoffMs: z
          .number()
          .default(1000)
          .describe(
            "リトライ時のバックオフ時間（ミリ秒）。連続して失敗した場合に次回リトライまで待機する時間（例: 1000なら1秒待機）。指数関数的バックオフ等を実装する際のベース時間"
          ),
      })
      .optional()
      .describe(
        "リトライポリシー定義。リカバリ戦略でリトライを選択した場合の再試行挙動を詳細に定義"
      ),
  })
  .describe(
    "例外定義。設計書の実装において発生しうる例外（エラー）のパターンを定義。条件、HTTPステータス、エラーコード、メッセージ、通知方法、ログ、リカバリ戦略等を網羅的に記述"
  );

export type StructuredException = z.infer<typeof structuredExceptionSchema>;
