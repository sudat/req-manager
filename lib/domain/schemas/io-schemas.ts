import { z } from "zod";
import { fieldSchema, fieldArraySchema } from "./fields";

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
        "APIのエンドポイントパス（例: /api/users/{id}）。パスパラメータを含む。クエリパラメータはqueryフィールドで定義。先頭の/は省略可"
      ),
    query: fieldArraySchema
      .optional()
      .describe(
        "クエリパラメータ定義。URLの?以降に追加されるパラメータ（例: ?page=1&limit=20）。フィルタリング、ページング、ソート等に使用"
      ),
    body: fieldArraySchema
      .optional()
      .describe(
        "リクエストボディ定義。POST/PUT/PATCHリクエストのペイロードとして送信するデータ。GET/DELETEでは通常使用しない"
      ),
  })
  .describe("APIの入力定義。HTTPリクエストの構造（メソッド、パス、クエリ、ボディ）を定義");
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
          "成功時のレスポンスボディフィールド定義。クライアントに返すデータ構造を定義"
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
            "エラー時のレスポンスボディフィールド定義。エラーコード、エラーメッセージ等を含む"
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
  })
  .describe("APIの出力定義。成功時とエラー時のHTTPレスポンス構造（ステータスコード、レスポンスボディ）を定義");
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
    elements: fieldArraySchema
      .optional()
      .describe(
        "画面上の入力要素定義リスト。トリガー実行時に参照または更新するフォームフィールド、ボタン、リンク等のUI要素を定義"
      ),
  })
  .describe(
    "画面操作の入力定義。ユーザーが画面を操作した際のトリガーと、関与するUI要素を定義"
  );
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
  })
  .describe(
    "画面操作の出力定義。ユーザー操作後の画面遷移先や表示メッセージ等のフィードバックを定義"
  );
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
    parameters: fieldArraySchema
      .optional()
      .describe(
        "バッチ処理のパラメータ定義。実行時に必要な追加設定値やフィルタ条件等（例: 集計期間、出力先、バッチサイズ等）"
      ),
  })
  .describe(
    "バッチ処理の入力定義。定期実行スケジュール、データソース、処理パラメータ等を定義"
  );
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
  })
  .describe(
    "バッチ処理の出力定義。処理結果の集計情報（成功件数、エラー件数、ステータス）や、継続処理のための次回バッチ情報を定義"
  );
export type BatchOutput = z.infer<typeof batchOutputSchema>;

export const jobInputSchema = z
  .object({
    event: z
      .string()
      .describe(
        "ジョブをトリガーするイベントタイプ名または識別子（例: 'user.created', 'payment.completed', 'data.imported'）。イベントドリブンでジョブを実行する場合に使用"
      ),
    payload: fieldArraySchema
      .optional()
      .describe(
        "イベントのペイロードデータ定義。イベント発行時に渡されるデータ構造（例: ユーザーID、取引ID、トリガー元情報等）"
      ),
  })
  .describe(
    "イベント駆動ジョブの入力定義。特定のイベント発生時に非同期実行されるジョブのトリガー条件とデータを定義"
  );
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
  })
  .describe(
    "イベント駆動ジョブの出力定義。ジョブの実行結果と、後続処理をトリガーするための次回イベントを定義"
  );
export type JobOutput = z.infer<typeof jobOutputSchema>;

export const structuredInputSchema = z
  .union([
    apiInputSchema,
    screenInputSchema,
    batchInputSchema,
    jobInputSchema,
  ])
  .describe(
    "構造化入力定義のユニオン型。設計書のioTypeに応じて、API（apiInputSchema）、画面（screenInputSchema）、バッチ（batchInputSchema）、ジョブ（jobInputSchema）のいずれかの形式で入力を定義"
  );

export const structuredOutputSchema = z
  .union([
    apiOutputSchema,
    screenOutputSchema,
    batchOutputSchema,
    jobOutputSchema,
  ])
  .describe(
    "構造化出力定義のユニオン型。設計書のioTypeに応じて、API（apiOutputSchema）、画面（screenOutputSchema）、バッチ（batchOutputSchema）、ジョブ（jobOutputSchema）のいずれかの形式で出力を定義"
  );

export type StructuredInput = z.infer<typeof structuredInputSchema>;
export type StructuredOutput = z.infer<typeof structuredOutputSchema>;
