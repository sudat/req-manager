import { z } from "zod";
import { fieldArraySchema } from "./fields";

export const sequenceActivationPolicyEnum = z.enum(["auto", "force", "none"]);
export type SequenceActivationPolicy = z.infer<typeof sequenceActivationPolicyEnum>;

export const sideEffectResponseSchema = z
  .object({
    successLabel: z
      .string()
      .min(1)
      .optional()
      .describe("成功時の戻りラベル（シーケンス図表示用）"),
    successSchemaRef: z
      .string()
      .min(1)
      .optional()
      .describe("成功時レスポンスのスキーマ参照"),
    errorLabel: z
      .string()
      .min(1)
      .optional()
      .describe("失敗時の戻りラベル（シーケンス図表示用）"),
    errorSchemaRef: z
      .string()
      .min(1)
      .optional()
      .describe("失敗時レスポンスのスキーマ参照"),
    errorExceptionRef: z
      .string()
      .min(1)
      .optional()
      .describe("失敗時に紐づく例外コード（exceptions[].errorCode）"),
  })
  .superRefine((value, ctx) => {
    const hasErrorDetail = Boolean(value.errorLabel || value.errorSchemaRef);
    if (hasErrorDetail && !value.errorExceptionRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["errorExceptionRef"],
        message:
          "errorLabel / errorSchemaRef を指定する場合は errorExceptionRef も指定してください",
      });
    }
  });
export type SideEffectResponse = z.infer<typeof sideEffectResponseSchema>;

export const dbOperationSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .optional()
      .describe("副作用ID（sequence.effect_ref で参照する識別子）"),
    table: z
      .string()
      .describe(
        "操作対象のデータベーステーブル名（例: 'users', 'orders', 'audit_logs'）。必要に応じてスキーマ名を含む（例: 'public.users'）"
      ),
    operation: z
      .enum(["insert", "update", "delete", "upsert"])
      .describe(
        "データベース操作種別。insertは新規レコード作成、updateは既存レコード更新、deleteはレコード削除、upsertは insert + update（存在すれば更新、なければ作成）"
      ),
    condition: z
      .string()
      .optional()
      .describe(
        "操作の適用条件。SQLのWHERE句相当（例: 'id = ${userId}', 'created_at > ${startDate}'）。update/delete時に操作対象を特定"
      ),
    affectedColumns: z
      .array(z.string())
      .optional()
      .describe(
        "影響を受けるカラム名リスト。update/upsert時に更新されるカラムを明示（例: ['status', 'updated_at']）。insert時は省略可"
      ),
    ruleRef: z
      .string()
      .min(1)
      .optional()
      .describe("紐付け対象のコアロジックルール名（coreLogic.rules[].name）"),
    response: sideEffectResponseSchema
      .optional()
      .describe("副作用の成功/失敗レスポンス定義（シーケンス図表示用）"),
    activation: sequenceActivationPolicyEnum
      .optional()
      .describe("シーケンス図のアクティベーション制御（auto/force/none）"),
  })
  .describe(
    "データベース操作定義。設計書の実装によりデータベースに対して行われる副作用（テーブルへの参照以外の書き込み操作）を定義"
  );

export const externalApiCallSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .optional()
      .describe("副作用ID（sequence.effect_ref で参照する識別子）"),
    endpoint: z
      .string()
      .describe(
        "外部APIのエンドポイントURL（例: 'https://api.example.com/v1/users'）。完全なURLまたはベースURLからの相対パス"
      ),
    method: z
      .enum(["GET", "POST", "PUT", "DELETE"])
      .describe(
        "HTTPメソッド。GETは参照、POSTは作成、PUTは更新、DELETEは削除。外部APIの仕様に従って選択"
      ),
    payload: fieldArraySchema
      .optional()
      .describe(
        "外部APIへ送信するリクエストペイロード定義。POST/PUTリクエストのボディや、GETリクエストのクエリパラメータ等"
      ),
    retryPolicy: z
      .object({
        maxRetries: z
          .number()
          .default(3)
          .describe(
            "最大リトライ回数。API呼び出しが失敗した場合に再試行する回数（例: 3なら最初の呼び出しを含めて最大4回実行）"
          ),
        backoffMs: z
          .number()
          .default(1000)
          .describe(
            "リトライ時のバックオフ時間（ミリ秒）。連続して失敗した場合に次回リトライまで待機する時間（例: 1000なら1秒待機）"
          ),
      })
      .optional()
      .describe(
        "リトライポリシー定義。API呼び出しが一時的に失敗した場合（タイムアウト、5xxエラー等）の再試行挙動を定義"
      ),
    ruleRef: z
      .string()
      .min(1)
      .optional()
      .describe("紐付け対象のコアロジックルール名（coreLogic.rules[].name）"),
    response: sideEffectResponseSchema
      .optional()
      .describe("副作用の成功/失敗レスポンス定義（シーケンス図表示用）"),
    activation: sequenceActivationPolicyEnum
      .optional()
      .describe("シーケンス図のアクティベーション制御（auto/force/none）"),
  })
  .describe(
    "API呼び出し定義。設計書の実装によりHTTPリクエストを送信する副作用を定義（内部API・外部システム共通）"
  );

export const eventPublishSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .optional()
      .describe("副作用ID（sequence.effect_ref で参照する識別子）"),
    eventType: z
      .string()
      .describe(
        "発行するイベントのタイプ名または識別子（例: 'order.created', 'user.registered', 'payment.failed'）。イベントドリブンアーキテクチャでのイベントルーティングに使用"
      ),
    payload: fieldArraySchema.describe(
      "イベントのペイロードデータ定義。イベント受信者へ渡すデータ構造（例: 注文ID、ユーザー情報、変更内容等）"
    ),
    destination: z
      .enum(["queue", "topic", "webhook"])
      .describe(
        "イベントの送信先種別。queueは特定の1消費者（FIFO）、topicは複数の購読者への配信（pub/sub）、webhookはHTTPコールバック"
      ),
    delayMs: z
      .number()
      .optional()
      .describe(
        "遅延送信時間（ミリ秒）。イベント発行から実際に配信されるまでの遅延時間（例: 60000なら1分後に配信）。即時配信の場合は省略"
      ),
    ruleRef: z
      .string()
      .min(1)
      .optional()
      .describe("紐付け対象のコアロジックルール名（coreLogic.rules[].name）"),
    response: sideEffectResponseSchema
      .optional()
      .describe("副作用の成功/失敗レスポンス定義（シーケンス図表示用）"),
    activation: sequenceActivationPolicyEnum
      .optional()
      .describe("シーケンス図のアクティベーション制御（auto/force/none）"),
  })
  .describe(
    "イベント発行定義。設計書の実装によりメッセージキュー、イベントバス、Webhook等へイベントを非同期送信する副作用を定義"
  );

export const fileOutputSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .optional()
      .describe("副作用ID（sequence.effect_ref で参照する識別子）"),
    path: z
      .string()
      .describe(
        "ファイルの出力先パス（例: '/output/reports/daily.csv', 's3://bucket/data/export.json'）。ローカルパスまたはクラウドストレージのパス"
      ),
    format: z
      .enum(["csv", "json", "xml", "pdf", "txt"])
      .describe(
        "ファイル形式。csvはカンマ区切り、jsonはJSON形式、xmlはXML形式、pdfはPDFドキュメント、txtはプレーンテキスト。データの用途や処理システムに応じて選択"
      ),
    ruleRef: z
      .string()
      .min(1)
      .optional()
      .describe("紐付け対象のコアロジックルール名（coreLogic.rules[].name）"),
    response: sideEffectResponseSchema
      .optional()
      .describe("副作用の成功/失敗レスポンス定義（シーケンス図表示用）"),
    activation: sequenceActivationPolicyEnum
      .optional()
      .describe("シーケンス図のアクティベーション制御（auto/force/none）"),
  })
  .describe(
    "ファイル出力定義。設計書の実装によりファイルシステムやクラウドストレージへファイルを書き込む副作用を定義"
  );

export const sideEffectSchema = z
  .object({
    description: z
      .string()
      .describe(
        "副作用の説明。設計書の実装により生じる状態変更や外部への影響を簡潔に記述（例: 'ユーザー作成時にWelcomeメールを送信', '注文確定時に在庫を減算'）。副作用が不要な場合は'副作用なし'を明記"
      ),
    dbOperations: z
      .array(dbOperationSchema)
      .optional()
      .describe(
        "データベース操作リスト。設計書の実装により実行されるデータベースへの書き込み操作（insert/update/delete/upsert）を定義"
      ),
    externalApiCalls: z
      .array(externalApiCallSchema)
      .optional()
      .describe(
        "API呼び出しリスト。設計書の実装により送信されるHTTPリクエストを定義（内部API・外部システム共通）"
      ),
    events: z
      .array(eventPublishSchema)
      .optional()
      .describe(
        "イベント発行リスト。設計書の実装によりメッセージキューやイベントバスへ非同期送信されるイベントを定義"
      ),
    fileOutputs: z
      .array(fileOutputSchema)
      .optional()
      .describe(
        "ファイル出力リスト。設計書の実装により生成・出力されるファイルを定義"
      ),
  })
  .describe(
    "副作用定義。設計書の実装により生じる外部への影響（データベース更新、外部API呼び出し、イベント発行、ファイル出力等）を定義。参照系の処理で副作用がない場合は明示的に記載"
  );
export type SideEffect = z.infer<typeof sideEffectSchema>;

export const batchSideEffectsSchema = z
  .object({
    fileOutputs: z
      .array(fileOutputSchema)
      .min(1)
      .describe(
        "ファイル出力リスト。バッチ処理の結果として出力されるファイル定義（1件以上必須）。バッチ処理は通常、レポート出力やデータエクスポート等のファイル生成を目的とする"
      ),
    dbOperations: z
      .array(dbOperationSchema)
      .optional()
      .describe(
        "データベース操作リスト。バッチ処理により実行されるデータベースへの書き込み操作を定義（例: 集計結果の保存、ステータス更新等）"
      ),
  })
  .describe(
    "バッチ処理の副作用定義。バッチ処理により生じる外部への影響（ファイル出力必須、データベース更新オプション）を定義"
  );
