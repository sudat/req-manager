import { z } from "zod";
import { fieldArraySchema } from "./fields";

// ============================================
// 統合版Input/Outputスキーマ
// elements/dataFields/parameters/query/body/payloadをfieldsに統合
// ============================================

export const apiInputSchema = z
  .object({
    method: z
      .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
      .describe(
        "HTTPメソッド。RESTful設計原則に従って選択。GETは参照（副作用なし）、POSTはリソース作成、PUTはリソース全置換、PATCHは部分更新、DELETEは削除"
      ),
    path: z
      .string()
      .min(1, "パスは必須")
      .describe(
        "APIのエンドポイントパス（例: /api/users/{id}）。パスパラメータを含む。クエリパラメータはfieldsで定義"
      ),
    fields: fieldArraySchema
      .default([])
      .describe(
        "APIフィールド定義。locationフィールドで'query'（URLクエリパラメータ）または'body'（リクエストボディ）を区別"
      ),
    // 後方互換: 旧形式（query/body/dataFields）
    query: fieldArraySchema.optional(),
    body: fieldArraySchema.optional(),
    dataFields: fieldArraySchema.optional(),
  })
  .describe("API入力定義。HTTPリクエストの構造を統一されたfields形式で定義");
export type ApiInput = z.infer<typeof apiInputSchema>;

export const apiOutputSchema = z
  .object({
    success: z
      .object({
        status: z
          .number()
          .min(100)
          .max(599)
          .describe(
            "成功時のHTTPステータスコード。通常は200（OK）、201（作成完了）、204（削除完了、コンテンツなし）等の2xxを使用"
          ),
        fields: fieldArraySchema.describe(
          "成功時のレスポンスフィールド定義。クライアントに返すデータ構造を定義"
        ),
      })
      .describe("成功時のレスポンス定義"),
    error: z
      .array(
        z.object({
          status: z
            .number()
            .min(100)
            .max(599)
            .describe(
              "エラー時のHTTPステータスコード。400（クライアントエラー）、401（未認証）、403（権限なし）、404（未検出）、409（競合）、500（サーバーエラー）等"
            ),
          fields: fieldArraySchema.describe(
            "エラー時のレスポンスフィールド定義。エラーコード、エラーメッセージ等を含む"
          ),
          description: z
            .string()
            .optional()
            .describe(
              "このエラーステータスが返される条件やエラー内容の説明（例: 'メールアドレスが既に登録されている場合'）"
            ),
        })
      )
      .optional()
      .describe(
        "エラーレスポンス定義リスト。発生しうるエラーパターン毎にステータスコードとレスポンス構造を定義"
      ),
    fields: fieldArraySchema
      .default([])
      .describe("汎用出力フィールド定義"),
    // 後方互換: 旧形式
    dataFields: fieldArraySchema.optional(),
  })
  .describe("API出力定義。成功時とエラー時のHTTPレスポンス構造を定義");
export type ApiOutput = z.infer<typeof apiOutputSchema>;

export const screenInputSchema = z
  .object({
    trigger: z
      .enum(["click", "input", "load", "select"])
      .describe(
        "画面操作のトリガー種別。clickはボタンクリック等のアクション、inputはテキスト入力、loadは画面初期ロード、selectはドロップダウン等の選択"
      ),
    action: z
      .string()
      .optional()
      .describe(
        "実行する操作内容の名称（例: '請求書を発行', '保存して次へ'）。triggerだけでは伝わらない業務的な振る舞いを明示"
      ),
    targetElement: z
      .string()
      .optional()
      .describe(
        "操作対象のUI要素（例: '発行ボタン', '税率選択ドロップダウン'）。どの部品に対する操作かを明示"
      ),
    precondition: z
      .string()
      .optional()
      .describe(
        "操作実行前の前提条件（例: '請求対象が1件以上選択されている'）。業務ルールや入力完了条件を記述"
      ),
    fields: fieldArraySchema
      .default([])
      .describe(
        "画面フィールド定義。elementTypeフィールドでUI要素の種類（input/display/button/select等）を指定"
      ),
    // 後方互換: 旧形式
    elements: fieldArraySchema.optional(),
    dataFields: fieldArraySchema.optional(),
  })
  .describe("画面入力定義。ユーザーが画面を操作した際の入力を統一されたfields形式で定義");
export type ScreenInput = z.infer<typeof screenInputSchema>;

export const screenOutputSchema = z
  .object({
    transition: z
      .string()
      .optional()
      .describe(
        "操作後の遷移先画面パスまたはルート名（例: /dashboard, /users/{id}/edit）。空文字または未指定の場合は同一画面に留まる"
      ),
    messages: z
      .array(z.string())
      .optional()
      .describe(
        "操作結果としてユーザーに表示するメッセージリスト。成功通知、エラーメッセージ、確認メッセージ等を含む（例: ['保存しました', '入力内容を確認してください']）"
      ),
    behavior: z
      .string()
      .optional()
      .describe(
        "操作後に起きる振る舞いの要約（例: '発行ジョブをキュー投入して一覧を更新'）。システムの結果動作を文章で明示"
      ),
    displayChanges: z
      .string()
      .optional()
      .describe(
        "画面上の見た目の変化（例: '対象行のステータスを発行待ちに変更し、トースト表示'）。UI更新内容を明示"
      ),
    fields: fieldArraySchema
      .default([])
      .describe("出力フィールド定義"),
    // 後方互換: 旧形式
    dataFields: fieldArraySchema.optional(),
  })
  .describe("画面出力定義。ユーザー操作後のフィードバックを定義");
export type ScreenOutput = z.infer<typeof screenOutputSchema>;

export const batchInputSchema = z
  .object({
    schedule: z
      .string()
      .describe(
        "実行スケジュール設定。cron形式（例: '0 0 * * *' は毎日0時実行、'0 */6 * * *' は6時間毎）または固定時刻指定"
      ),
    source: z
      .string()
      .describe(
        "処理対象のデータソース。ファイルパス、テーブル名、APIエンドポイント等（例: '/data/input/users.csv', 'database.public.users'）"
      ),
    fields: fieldArraySchema
      .default([])
      .describe(
        "バッチフィールド定義。categoryフィールドで'config'（設定/パラメータ）または'data'（処理対象データ）を区別"
      ),
    // 後方互換: 旧形式
    parameters: fieldArraySchema.optional(),
    dataFields: fieldArraySchema.optional(),
  })
  .describe("バッチ入力定義。定期実行スケジュールと処理パラメータを統一されたfields形式で定義");
export type BatchInput = z.infer<typeof batchInputSchema>;

export const batchOutputSchema = z
  .object({
    summary: z
      .object({
        processedCount: z
          .number()
          .min(0)
          .describe("処理対象の総件数。成功と失敗を合わせた全レコード数"),
        successCount: z
          .number()
          .min(0)
          .describe("正常処理された件数。処理成功したレコード数"),
        errorCount: z
          .number()
          .min(0)
          .describe("処理失敗した件数。エラーが発生したレコード数"),
        status: z
          .enum(["completed", "partial", "failed"])
          .describe(
            "処理ステータス。completedは全件成功、partialは一部エラーあり、failedは全件失敗または致命的エラー"
          ),
        executionTimeMs: z
          .number()
          .optional()
          .describe("バッチ処理の実行時間（ミリ秒）。パフォーマンス監視やタイムアウト検知に使用"),
      })
      .describe("バッチ処理の結果サマリー"),
    nextBatch: z
      .string()
      .optional()
      .describe(
        "次回実行するバッチの識別子またはトークン。大量データを分割処理する場合に使用（例: ページングトークン、次回実行日時等）"
      ),
    fields: fieldArraySchema
      .default([])
      .describe("出力フィールド定義"),
    // 後方互換: 旧形式
    dataFields: fieldArraySchema.optional(),
  })
  .describe("バッチ出力定義。処理結果の集計情報を定義");
export type BatchOutput = z.infer<typeof batchOutputSchema>;

export const jobInputSchema = z
  .object({
    event: z
      .string()
      .describe(
        "ジョブをトリガーするイベントタイプ名または識別子（例: 'user.created', 'payment.completed', 'data.imported'）。イベントドリブンでジョブを実行する場合に使用"
      ),
    fields: fieldArraySchema
      .default([])
      .describe(
        "ジョブフィールド定義。categoryフィールドで'config'（設定）または'data'（ペイロードデータ）を区別"
      ),
    // 後方互換: 旧形式
    payload: fieldArraySchema.optional(),
    dataFields: fieldArraySchema.optional(),
  })
  .describe("ジョブ入力定義。イベントトリガー条件とデータを統一されたfields形式で定義");
export type JobInput = z.infer<typeof jobInputSchema>;

export const jobOutputSchema = z
  .object({
    result: z
      .string()
      .describe(
        "ジョブの処理結果を示す文字列。成功、失敗、または具体的な結果内容（例: 'success', 'failed: retry limit exceeded', 'processed 1000 records'）"
      ),
    nextEvent: z
      .string()
      .optional()
      .describe(
        "ジョブ完了後に発行する次回イベントの識別子。ジョブチェーンやワークフローを構成する場合に使用（例: 'job.completed', 'notification.send'）"
      ),
    fields: fieldArraySchema
      .default([])
      .describe("出力フィールド定義"),
    // 後方互換: 旧形式
    dataFields: fieldArraySchema.optional(),
  })
  .describe("ジョブ出力定義。ジョブの実行結果を定義");
export type JobOutput = z.infer<typeof jobOutputSchema>;

// ============================================
// 統合版ユニオン型
// ============================================

export const structuredInputSchema = z
  .union([
    apiInputSchema,
    screenInputSchema,
    batchInputSchema,
    jobInputSchema,
  ])
  .describe(
    "構造化入力定義のユニオン型。ioTypeに応じてAPI、画面、バッチ、ジョブのいずれかの形式で入力を定義"
  );

export const structuredOutputSchema = z
  .union([
    apiOutputSchema,
    screenOutputSchema,
    batchOutputSchema,
    jobOutputSchema,
  ])
  .describe(
    "構造化出力定義のユニオン型。ioTypeに応じてAPI、画面、バッチ、ジョブのいずれかの形式で出力を定義"
  );

export type StructuredInput = z.infer<typeof structuredInputSchema>;
export type StructuredOutput = z.infer<typeof structuredOutputSchema>;
