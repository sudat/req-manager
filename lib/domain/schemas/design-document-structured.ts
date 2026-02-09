import { z } from "zod";
import type { DdType } from "../enums";
import { coreLogicSchema } from "./core-logic";
import { structuredExceptionSchema } from "./exceptions";
import { fieldArraySchema } from "./fields";
import {
  apiInputSchema,
  apiOutputSchema,
  batchInputSchema,
  type BatchInput,
  type BatchOutput,
  batchOutputSchema,
  jobInputSchema,
  type JobInput,
  type JobOutput,
  jobOutputSchema,
  screenInputSchema,
  type ScreenInput,
  type ScreenOutput,
  screenOutputSchema,
  type ApiInput,
  type ApiOutput,
} from "./io-schemas";
import {
  modelAttributeSchema,
  modelRelationshipSchema,
  stateTransitionSchema,
} from "./model-detail";
import { structuredNonFunctionalSchema } from "./non-functional";
import { sideEffectSchema } from "./side-effects";

export const structuredDesignDocumentIoTypeSchema = z
  .enum([
    "api",
    "screen",
    "batch",
    "job",
    "external_if",
    "model",
    "report",
  ])
  .describe(
    "設計書のI/Oタイプ（入出力の種類）。apiはREST API等のWeb API、screenはWeb画面等のUI、batchは定期バッチ処理、jobはイベント駆動ジョブ、external_ifは外部システムインターフェース、modelはデータモデル、reportはレポート出力"
  );
export type StructuredDesignDocumentIoType = z.infer<
  typeof structuredDesignDocumentIoTypeSchema
>;

const typeDetailSchema = z.discriminatedUnion("ioType", [
  z
    .object({
      ioType: z.literal("api"),
      method: z
        .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
        .optional()
        .describe(
          "HTTPメソッド。RESTful設計原則に従って選択。GETは参照、POSTは作成、PUTは全置換、PATCHは部分更新、DELETEは削除"
        ),
      path: z
        .string()
        .optional()
        .describe(
          "APIのエンドポイントパス（例: /api/users/{id}）。パスパラメータを含む。クエリパラメータはinputSchema.queryで定義"
        ),
    })
    .describe("APIタイプの詳細定義。HTTPメソッドとパス等のAPI固有の属性を定義"),
  z
    .object({
      ioType: z.literal("screen"),
      route: z
        .string()
        .optional()
        .describe(
          "画面のルートまたはパス（例: /dashboard, /users/{id}/edit）。Next.js等のフレームワークでのページルーティングに相当"
        ),
    })
    .describe("画面タイプの詳細定義。画面ルート等のUI固有の属性を定義"),
  z
    .object({
      ioType: z.literal("batch"),
      schedule: z
        .string()
        .optional()
        .describe(
          "バッチ実行スケジュール。cron形式（例: '0 0 * * *' は毎日0時実行）または固定時刻指定"
        ),
      source: z
        .string()
        .optional()
        .describe(
          "処理対象のデータソース。ファイルパス、テーブル名、APIエンドポイント等（例: '/data/input.csv', 'database.public.users'）"
        ),
    })
    .describe("バッチタイプの詳細定義。定期実行スケジュールやデータソース等のバッチ固有の属性を定義"),
  z
    .object({
      ioType: z.literal("job"),
      event: z
        .string()
        .optional()
        .describe(
          "ジョブをトリガーするイベントタイプ名（例: 'user.created', 'payment.completed'）。イベントドリブンでジョブを実行する場合に使用"
        ),
    })
    .describe(
      "ジョブタイプの詳細定義。イベント駆動ジョブのトリガーイベント等のジョブ固有の属性を定義"
    ),
  z
    .object({
      ioType: z.literal("external_if"),
      protocol: z
        .string()
        .optional()
        .describe(
          "外部システムとの通信プロトコル（例: 'HTTP', 'gRPC', 'SOAP', 'FTP'）。外部インターフェースの通信方式を指定"
        ),
      endpoint: z
        .string()
        .optional()
        .describe(
          "外部システムのエンドポイント（例: 'https://external-api.example.com/v1'）。接続先のURLや接続情報を指定"
        ),
    })
    .describe(
      "外部インターフェースタイプの詳細定義。外部システムとの連携に必要なプロトコルやエンドポイント等を定義"
    ),
  z
    .object({
      ioType: z.literal("model"),
      entityName: z
        .string()
        .optional()
        .describe("エンティティの名称（物理名、例: User, Order, Product）"),
      entityLogicalName: z
        .string()
        .optional()
        .describe("エンティティの論理名（日本語等、わかりやすい名称）"),
      entityDescription: z
        .string()
        .optional()
        .describe("エンティティの説明文"),
      attributes: z
        .array(modelAttributeSchema)
        .optional()
        .describe("エンティティの属性リスト（テーブルのカラムに相当）"),
      relationships: z
        .array(modelRelationshipSchema)
        .optional()
        .describe("他のエンティティとの関連リスト"),
      stateTransitions: z
        .array(stateTransitionSchema)
        .optional()
        .describe("状態遷移のリスト（ライフサイクルを持つエンティティの場合）"),
    })
    .describe(
      "モデルタイプの詳細定義。データモデルやエンティティ定義等のデータ構造を表現。論理エンティティ（ER図相当）の属性、関連、状態遷移を定義"
    ),
  z
    .object({
      ioType: z.literal("report"),
      // format, outputPath は削除（outputSchemaで代替）
    })
    .describe(
      "レポートタイプの詳細定義。帳票出力やレポート生成等を表現。出力形式やパスはoutputSchemaで定義"
    ),
]).describe(
  "I/Oタイプ別の詳細定義（discriminated union）。ioTypeによって異なる詳細属性を定義。各タイプの固有属性をここで記述"
);
export type StructuredTypeDetail = z.infer<typeof typeDetailSchema>;

export const structuredDesignDocumentSpecSchema = z
  .object({
    version: z
      .literal("1")
      .default("1")
      .describe(
        "構造化設計書スキーマのバージョン。現在は'1'固定。フォーマットの breaking change がある場合はバージョンを上げる"
      ),
    ioType: structuredDesignDocumentIoTypeSchema.describe(
      "設計書のI/Oタイプ（api/screen/batch/job/external_if/model/report）。この設計書が何を表現するかを分類"
    ),
    typeDetail: typeDetailSchema
      .optional()
      .describe(
        "I/Oタイプ別の詳細属性。ioTypeに応じた固有情報（APIならメソッドとパス、画面ならルート等）を定義"
      ),
    inputSchema: z
      .union([apiInputSchema, screenInputSchema, batchInputSchema, jobInputSchema])
      .optional()
      .describe(
        "入力スキーマ定義（構造化）。ioTypeに応じた形式（APIならmethod/path/query/body、画面ならtrigger/action/targetElement/precondition/elements等）で入力構造を定義。inputFieldsとの併用も可"
      ),
    outputSchema: z
      .union([apiOutputSchema, screenOutputSchema, batchOutputSchema, jobOutputSchema])
      .optional()
      .describe(
        "出力スキーマ定義（構造化）。ioTypeに応じた形式（APIならstatus/fields/error、画面ならtransition/messages/behavior/displayChanges等）で出力構造を定義。outputFieldsとの併用も可"
      ),
    inputFields: fieldArraySchema
      .default([])
      .describe(
        "入力フィールドリスト（フラット）。APIパラメータ、画面フォーム項目、バッチパラメータ等の入力データ構造をフィールド配列で定義。inputSchemaとの併用も可"
      ),
    coreLogic: coreLogicSchema
      .default({ rules: [] })
      .describe(
        "コアロジック定義。入力から出力への変換処理において適用されるビジネスルール（検証、計算、状態遷移、判定、集約等）を定義。入力スキーマと出力スキーマの間の「何をするか」を構造化して記述"
      ),
    outputFields: fieldArraySchema
      .default([])
      .describe(
        "出力フィールドリスト（フラット）。APIレスポンス、画面表示項目、バッチ処理結果等の出力データ構造をフィールド配列で定義。outputSchemaとの併用も可"
      ),
    sideEffects: sideEffectSchema
      .default({
        description: "副作用なし",
      })
      .describe(
        "副作用定義。設計書の実装により生じる外部への影響（データベース更新、外部API呼び出し、イベント発行、ファイル出力等）を定義。副作用がない場合は明示的に記載"
      ),
    exceptions: z
      .array(structuredExceptionSchema)
      .default([])
      .describe(
        "例外定義リスト。設計書の実装において発生しうる例外パターンを定義。条件、HTTPステータス、エラーコード、メッセージ、通知方法、リカバリ戦略等を網羅的に記述"
      ),
    nonFunctional: structuredNonFunctionalSchema
      .default({})
      .describe(
        "非機能要件定義。機能要件以外の品質属性（パフォーマンス、可用性、セキュリティ等）を定義"
      ),
  })
  .superRefine((value, ctx) => {
    if (value.typeDetail && value.typeDetail.ioType !== value.ioType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["typeDetail", "ioType"],
        message: "typeDetail.ioType は ioType と一致させてください",
      });
    }

    if (value.ioType === "api") {
      if (value.inputSchema && !("method" in value.inputSchema)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inputSchema"],
          message: "api の inputSchema は API形式で入力してください",
        });
      }
      if (value.outputSchema && !("success" in value.outputSchema)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["outputSchema"],
          message: "api の outputSchema は API形式で入力してください",
        });
      }
    }
  })
  .describe(
    "構造化設計書スキーマ定義。システム機能の設計内容を構造化データ（JSON/YAML）で表現するためのスキーマ。I/Oタイプを含む基本情報、入出力スキーマ（inputSchema/outputSchema または inputFields/outputFields）、副作用、例外、非機能要件から構成される。AIによる設計書生成・理解・検証を前提とした構造"
  );
export type StructuredDesignDocumentSpec = z.infer<
  typeof structuredDesignDocumentSpecSchema
>;

const createDefaultInputByIoType = (
  ioType: "api" | "screen" | "batch" | "job"
): ApiInput | ScreenInput | BatchInput | JobInput => {
  switch (ioType) {
    case "api":
      return { method: "POST", path: "/", query: [], body: [] };
    case "screen":
      return {
        trigger: "click",
        action: "",
        targetElement: "",
        precondition: "",
        elements: [],
      };
    case "batch":
      return { schedule: "", source: "", parameters: [] };
    case "job":
      return { event: "", payload: [] };
  }
};

const createDefaultOutputByIoType = (
  ioType: "api" | "screen" | "batch" | "job"
): ApiOutput | ScreenOutput | BatchOutput | JobOutput => {
  switch (ioType) {
    case "api":
      return { success: { status: 200, fields: [] }, error: [] };
    case "screen":
      return { transition: "", messages: [], behavior: "", displayChanges: "" };
    case "batch":
      return {
        summary: { processedCount: 0, successCount: 0, errorCount: 0, status: "completed" },
        nextBatch: "",
      };
    case "job":
      return { result: "", nextEvent: "" };
  }
};

const DD_TYPE_TO_IO_TYPE: Record<DdType, StructuredDesignDocumentIoType> = {
  screen: "screen",
  api: "api",
  batch: "batch",
  external_if: "external_if",
  model: "model",
  report: "report",
  job: "job",
};

export function ddTypeToStructuredIoType(ddType: DdType): StructuredDesignDocumentIoType {
  return DD_TYPE_TO_IO_TYPE[ddType] ?? "screen";
}

export function createEmptyStructuredDesignDocumentSpec(
  ioType: StructuredDesignDocumentIoType
): StructuredDesignDocumentSpec {
  const spec: StructuredDesignDocumentSpec = {
    version: "1",
    ioType,
    inputFields: [],
    coreLogic: { rules: [] },
    outputFields: [],
    sideEffects: { description: "副作用なし" },
    exceptions: [],
    nonFunctional: {},
  };

  if (ioType === "api" || ioType === "screen" || ioType === "batch" || ioType === "job") {
    spec.inputSchema = createDefaultInputByIoType(ioType);
    spec.outputSchema = createDefaultOutputByIoType(ioType);
  }

  return spec;
}
