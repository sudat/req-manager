import { describe, expect, it } from "bun:test";
import type { DesignDocument, SystemFunction } from "../../../lib/domain/entities";
import type { DdDependencyLink } from "../../../lib/domain/dd-dependency";
import { sideEffectsToMermaidSequence } from "../../../lib/utils/design-documents/sideeffects-to-mermaid";

function createSystemFunction(): SystemFunction {
  return {
    id: "SF-TEST-0001",
    systemDomainId: "AR",
    category: "screen",
    title: "請求書発行",
    summary: "テスト用",
    designPolicy: "",
    status: "implemented",
    relatedTaskIds: [],
    requirementIds: [],
    systemDesign: [],
    entryPoints: [],
    deliverables: [],
    codeRefs: [],
    sortOrder: 0,
    createdAt: "2026-02-10T00:00:00.000Z",
    updatedAt: "2026-02-10T00:00:00.000Z",
  };
}

function createDesignDocument(
  id: string,
  name: string,
  details: Record<string, unknown>
): DesignDocument {
  return {
    id,
    srfId: "SF-TEST-0001",
    projectId: "00000000-0000-0000-0000-000000000001",
    name,
    type: "api",
    summary: "",
    entryPoints: [],
    designPolicy: "",
    details,
    createdAt: "2026-02-10T00:00:00.000Z",
    updatedAt: "2026-02-10T00:00:00.000Z",
  };
}

describe("sideEffectsToMermaidSequence", () => {
  it("DD依存と副作用を同時に描画できる", () => {
    const dds: DesignDocument[] = [
      createDesignDocument("DD-001", "画面DD", {
        ioType: "screen",
        sideEffects: {
          description: "請求書を作成する",
          dbOperations: [{ table: "invoices", operation: "insert" }],
          externalApiCalls: [{ method: "POST", endpoint: "${EMAIL_SERVICE_API}/send" }],
        },
      }),
      createDesignDocument("DD-002", "API DD", {
        ioType: "api",
        sideEffects: {
          events: [{ eventType: "invoice.created", destination: "queue", payload: [] }],
          externalApiCalls: [{ method: "POST", endpoint: "https://api.example.com/v1/notify" }],
        },
      }),
      createDesignDocument("DD-003", "バッチDD", {
        ioType: "batch",
        sideEffects: {
          fileOutputs: [{ format: "csv", path: "s3://bucket/invoices.csv" }],
        },
      }),
    ];

    const dependencies: DdDependencyLink[] = [
      {
        sourceDdId: "DD-001",
        targetDdId: "DD-002",
        callType: "calls_sync",
        returnsLabel: "処理結果",
      },
      { sourceDdId: "DD-002", targetDdId: "DD-003", callType: "calls_async" },
    ];

    const result = sideEffectsToMermaidSequence(createSystemFunction(), dds, dependencies);

    expect(result.mermaidCode).toContain("DD1->>DD2: 同期呼び出し");
    expect(result.mermaidCode).toContain("DD2-->>DD1: 処理結果");
    expect(result.mermaidCode).toContain("activate DD2");
    expect(result.mermaidCode).toContain("deactivate DD2");
    expect(result.mermaidCode).toContain("DD2-->>DD3: 非同期起動");
    expect(result.mermaidCode).toContain("participant DB_invoices as [db] invoices");
    expect(result.mermaidCode).toContain("DD1->>DB_invoices: INSERT invoices");
    expect(result.mermaidCode).toContain("activate DD1");
    expect(result.mermaidCode).toContain("deactivate DD1");
    expect(result.mermaidCode).toContain("participant ExternalSystem as ExternalSystem");
    expect(result.mermaidCode).toContain("participant api_example_com as api.example.com");
    expect(result.mermaidCode).toContain("participant FileSystem as FileSystem");
    expect(result.mermaidCode).toContain("DD3->>FileSystem: ファイル出力 (csv)");
    expect(result.mermaidCode).toContain("DD2->>EventBus: イベント発行 (invoice.created)");
  });

  it("DB参加者ラベルに [db]/[log] プレフィックスを付与する", () => {
    const dds: DesignDocument[] = [
      createDesignDocument("DD-350", "DBラベルDD", {
        ioType: "api",
        sideEffects: {
          dbOperations: [
            { table: "invoices", operation: "insert" },
            { table: "audit_logs", operation: "insert" },
          ],
        },
      }),
    ];

    const result = sideEffectsToMermaidSequence(createSystemFunction(), dds, []);

    expect(result.mermaidCode).toContain("participant DB_invoices as [db] invoices");
    expect(result.mermaidCode).toContain("participant DB_audit_logs as [log] audit_logs");
  });

  it("依存未定義のDDに警告ノートを出す", () => {
    const dds: DesignDocument[] = [
      createDesignDocument("DD-100", "独立DD", {
        ioType: "api",
        sideEffects: {
          description: "副作用なし",
        },
      }),
    ];

    const result = sideEffectsToMermaidSequence(createSystemFunction(), dds, []);

    expect(result.mermaidCode).toContain("Note over DD1: 呼び出し依存が未定義です");
  });

  it("ruleRefからaltフラグメントを生成できる", () => {
    const dds: DesignDocument[] = [
      createDesignDocument("DD-200", "判定DD", {
        ioType: "api",
        coreLogic: {
          rules: [
            {
              name: "credit_ng",
              type: "decide",
              description: "与信枠超過",
              sequence: {
                fragmentType: "alt",
                fragmentGroup: "credit",
                branch: "if",
                guard: "与信NG",
              },
            },
            {
              name: "credit_ok",
              type: "decide",
              description: "与信通過",
              sequence: {
                fragmentType: "alt",
                fragmentGroup: "credit",
                branch: "else",
                guard: "与信OK",
              },
            },
          ],
        },
        sideEffects: {
          description: "分岐あり",
          externalApiCalls: [
            {
              endpoint: "https://api.example.com/reject",
              method: "POST",
              ruleRef: "credit_ng",
            },
            {
              endpoint: "https://api.example.com/accept",
              method: "POST",
              ruleRef: "credit_ok",
              activation: "none",
            },
          ],
          events: [
            {
              eventType: "credit.checked",
              destination: "topic",
              payload: [],
              delayMs: 1000,
            },
          ],
        },
      }),
    ];

    const result = sideEffectsToMermaidSequence(createSystemFunction(), dds, []);

    expect(result.mermaidCode).toContain("alt [与信NG]");
    expect(result.mermaidCode).toContain("else [与信OK]");
    expect(result.mermaidCode).toContain("end");
    expect(result.mermaidCode).toContain("Note over EventBus: 遅延 1000ms");
  });

  it("guided sequence stepsを優先して描画できる", () => {
    const dds: DesignDocument[] = [
      createDesignDocument("DD-400", "画面DD", {
        version: "2",
        ioType: "screen",
        sideEffects: {
          description: "ガイド制御",
          dbOperations: [
            {
              id: "save_draft",
              table: "invoices",
              operation: "upsert",
              response: {
                successLabel: "DB保存完了",
                errorLabel: "DB保存失敗",
                errorExceptionRef: "DRAFT_SAVE_FAILED",
              },
            },
          ],
        },
        exceptions: [
          {
            type: "external",
            condition: "下書き保存APIが失敗",
            errorCode: "SAVE_API_FAILED",
            message: "API保存に失敗",
            recovery: "retry_with_backoff",
          },
          {
            type: "state",
            condition: "DB保存に失敗",
            errorCode: "DRAFT_SAVE_FAILED",
            message: "DB保存に失敗",
            recovery: "manual_intervention",
          },
        ],
        sequence: {
          mode: "guided",
          steps: [
            {
              kind: "call",
              id: "call_save_api",
              targetDdId: "DD-401",
              callType: "sync",
              message: "下書き保存API呼び出し",
              returnLabel: "保存結果",
              errorLabel: "保存エラー",
              errorExceptionRef: "SAVE_API_FAILED",
            },
            {
              kind: "effect_ref",
              ref: "db:save_draft",
            },
            {
              kind: "note",
              text: "画面メッセージ表示",
            },
          ],
        },
      }),
      createDesignDocument("DD-401", "保存API", {
        ioType: "api",
        sideEffects: {
          description: "保存処理",
        },
      }),
    ];

    const result = sideEffectsToMermaidSequence(createSystemFunction(), dds, []);

    expect(result.mermaidCode).toContain("DD1->>DD2: 下書き保存API呼び出し");
    expect(result.mermaidCode).toContain("DD2-->>DD1: 保存結果");
    expect(result.mermaidCode).toContain("DD2-->>DD1: 保存エラー");
    expect(result.mermaidCode).toContain("Note over DD1: 例外 SAVE_API_FAILED");
    expect(result.mermaidCode).toContain("DD1->>DB_invoices: UPSERT invoices");
    expect(result.mermaidCode).toContain("DB_invoices-->>DD1: DB保存完了");
    expect(result.mermaidCode).toContain("DB_invoices-->>DD1: DB保存失敗");
    expect(result.mermaidCode).toContain("Note over DD1: 例外 DRAFT_SAVE_FAILED");
    expect(result.mermaidCode).toContain("Note over DD1: 画面メッセージ表示");
  });

  it("asyncCompletion の成功/失敗詳細を描画できる", () => {
    const dds: DesignDocument[] = [
      createDesignDocument("DD-410", "起動元DD", {
        version: "2",
        ioType: "screen",
        sideEffects: {
          description: "非同期呼び出し",
        },
        exceptions: [
          {
            type: "timeout",
            condition: "ジョブ完了通知が失敗",
            errorCode: "ASYNC_NOTIFY_FAILED",
            message: "非同期通知失敗",
            recovery: "retry_with_backoff",
          },
        ],
        sequence: {
          mode: "guided",
          steps: [
            {
              kind: "call",
              id: "call_job_api",
              targetDdId: "DD-411",
              callType: "async",
              message: "ジョブ起動",
              asyncCompletion: {
                callbackToDdId: "DD-410",
                timeoutMs: 3000,
                successLabel: "完了通知",
                errorLabel: "失敗通知",
                errorExceptionRef: "ASYNC_NOTIFY_FAILED",
              },
            },
          ],
        },
      }),
      createDesignDocument("DD-411", "ジョブAPI", {
        ioType: "api",
        sideEffects: {
          description: "ジョブ登録",
        },
      }),
    ];

    const result = sideEffectsToMermaidSequence(createSystemFunction(), dds, []);

    expect(result.mermaidCode).toContain("DD1-->>DD2: ジョブ起動");
    expect(result.mermaidCode).toContain("Note over DD2: タイムアウト 3000ms");
    expect(result.mermaidCode).toContain("DD2-->>DD1: 完了通知");
    expect(result.mermaidCode).toContain("DD2-->>DD1: 失敗通知");
    expect(result.mermaidCode).toContain("Note over DD1: 例外 ASYNC_NOTIFY_FAILED");
  });

  it("model DD宛ての依存矢印は描画しない", () => {
    const dds: DesignDocument[] = [
      createDesignDocument("DD-300", "API DD", {
        ioType: "api",
        sideEffects: {
          description: "副作用なし",
        },
      }),
      createDesignDocument("DD-301", "モデルDD", {
        ioType: "model",
        sideEffects: {
          description: "副作用なし",
        },
      }),
    ];

    const dependencies: DdDependencyLink[] = [
      {
        sourceDdId: "DD-300",
        targetDdId: "DD-301",
        callType: "calls_sync",
      },
    ];

    const result = sideEffectsToMermaidSequence(createSystemFunction(), dds, dependencies);

    expect(result.mermaidCode).not.toContain("DD1->>DD2: 同期呼び出し");
    expect(result.mermaidCode).not.toContain("participant DD2");
    expect(result.mermaidCode).not.toContain("モデルDD");
  });
});
