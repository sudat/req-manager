#!/usr/bin/env -S bun run
/**
 * SF-AR-0001 のDDに対して、副作用(sideEffects)の ruleRef 未設定を補完するseed
 *
 * Usage:
 *   bun scripts/db/seed-backfill-sf-ar-0001-sideeffects-ruleref.ts
 *   bun scripts/db/seed-backfill-sf-ar-0001-sideeffects-ruleref.ts --execute
 *   bun scripts/db/seed-backfill-sf-ar-0001-sideeffects-ruleref.ts --execute --project-id=<PROJECT_ID>
 */

import { config } from "dotenv";
import pg from "pg";
import { structuredDesignDocumentSpecSchema } from "../../lib/domain/schemas/design-document-structured";

type SideEffectKey = "dbOperations" | "externalApiCalls" | "events" | "fileOutputs";

type SideEffectRuleMap = {
  byId?: Record<string, string>;
  byIndex?: Record<number, string>;
};

type DdRuleMap = Partial<Record<SideEffectKey, SideEffectRuleMap>>;

type CliArgs = {
  execute: boolean;
  projectId: string;
};

const TARGET_SRF_ID = "SF-AR-0001";
const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

const RULE_REF_MAPPING: Record<string, DdRuleMap> = {
  "DD-SF-AR-0001-001": {
    externalApiCalls: {
      byId: {
        api_1: "line_item_selection",
        api_2: "preview_calculation",
      },
    },
  },
  "DD-SF-AR-0001-002": {
    dbOperations: {
      byId: {
        db_1: "status_transition",
        db_2: "tax_calculation_per_line",
      },
    },
    externalApiCalls: {
      byId: {
        api_1: "pdf_queue",
      },
    },
    events: {
      byId: {
        event_1: "status_transition",
      },
    },
  },
  "DD-SF-AR-0001-003": {
    dbOperations: {
      byId: {
        db_1: "batch_issue",
        db_2: "batch_issue",
        db_3: "error_handling",
      },
    },
    events: {
      byId: {
        event_1: "error_handling",
      },
    },
    fileOutputs: {
      byId: {
        file_1: "error_handling",
      },
    },
  },
  "DD-SF-AR-0001-005": {
    dbOperations: {
      byId: {
        db_1: "send_retry",
      },
    },
    externalApiCalls: {
      byId: {
        api_1: "provider_selection",
        api_2: "provider_selection",
      },
    },
  },
  "DD-SF-AR-0001-006": {
    dbOperations: {
      byId: {
        db_1: "upsert_operation",
        db_2: "upsert_operation",
      },
    },
  },
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const projectIdArg = args.find((arg) => arg.startsWith("--project-id="));
  const projectId = projectIdArg?.split("=")[1] ?? process.env.PROJECT_ID ?? DEFAULT_PROJECT_ID;
  return { execute, projectId };
}

function isMissingRuleRef(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function resolveCandidateRuleRef(
  ddId: string,
  sideEffectKey: SideEffectKey,
  item: Record<string, unknown>,
  index: number
): string | undefined {
  const ddMap = RULE_REF_MAPPING[ddId];
  if (!ddMap) return undefined;
  const keyMap = ddMap[sideEffectKey];
  if (!keyMap) return undefined;

  const itemId = typeof item.id === "string" ? item.id.trim() : "";
  if (itemId && keyMap.byId && keyMap.byId[itemId]) {
    return keyMap.byId[itemId];
  }
  if (keyMap.byIndex && keyMap.byIndex[index] !== undefined) {
    return keyMap.byIndex[index];
  }

  return undefined;
}

function summarizeSideEffect(item: Record<string, unknown>, key: SideEffectKey): string {
  if (key === "dbOperations") {
    return `${String(item.operation ?? "-")} ${String(item.table ?? "-")}`;
  }
  if (key === "externalApiCalls") {
    return `${String(item.method ?? "-")} ${String(item.endpoint ?? "-")}`;
  }
  if (key === "events") {
    return `${String(item.eventType ?? "-")} -> ${String(item.destination ?? "-")}`;
  }
  return `${String(item.format ?? "-")} ${String(item.path ?? "-")}`;
}

async function main() {
  config({ path: ".env.local" });
  config({ path: ".env" });

  const { execute, projectId } = parseArgs();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL が未設定です");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    console.log("🚀 SF-AR-0001 sideEffects.ruleRef backfill");
    console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}`);
    console.log(`Project ID: ${projectId}`);
    console.log(`SRF ID: ${TARGET_SRF_ID}`);

    const { rows } = await client.query(
      `SELECT id, name, type, details
       FROM design_documents
       WHERE project_id = $1
         AND srf_id = $2
       ORDER BY id`,
      [projectId, TARGET_SRF_ID]
    );

    if (rows.length === 0) {
      console.log("⚠️ 対象DDが見つかりませんでした");
      return;
    }

    const sideEffectKeys: SideEffectKey[] = [
      "dbOperations",
      "externalApiCalls",
      "events",
      "fileOutputs",
    ];

    const updates: Array<{ id: string; details: Record<string, unknown> }> = [];
    const unresolved: string[] = [];

    for (const row of rows) {
      const details = (row.details ?? {}) as Record<string, unknown>;
      const specParse = structuredDesignDocumentSpecSchema.safeParse(details);
      if (!specParse.success) {
        const issues = specParse.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        unresolved.push(`[${row.id}] スキーマ不正のため処理不可: ${issues}`);
        continue;
      }

      const spec = specParse.data;
      const ruleNames = new Set(
        (spec.coreLogic.rules ?? [])
          .map((rule) => rule.name?.trim())
          .filter((name): name is string => Boolean(name))
      );
      const nextSpec: Record<string, unknown> = structuredClone(spec);
      const sideEffects = (nextSpec.sideEffects ?? {}) as Record<string, unknown>;

      let changed = false;
      const changeLogs: string[] = [];

      for (const key of sideEffectKeys) {
        const list = Array.isArray(sideEffects[key]) ? (sideEffects[key] as Record<string, unknown>[]) : [];
        for (const [index, item] of list.entries()) {
          if (!isMissingRuleRef(item.ruleRef)) continue;

          const candidate = resolveCandidateRuleRef(row.id, key, item, index);
          if (!candidate) {
            unresolved.push(
              `[${row.id}] ${key}[${index}](${summarizeSideEffect(item, key)}): mapping未定義`
            );
            continue;
          }
          if (!ruleNames.has(candidate)) {
            unresolved.push(
              `[${row.id}] ${key}[${index}](${summarizeSideEffect(item, key)}): candidate '${candidate}' が coreLogic.rules に存在しません`
            );
            continue;
          }

          item.ruleRef = candidate;
          changed = true;
          changeLogs.push(`  - ${key}[${index}] ${summarizeSideEffect(item, key)} -> ${candidate}`);
        }
      }

      if (!changed) {
        continue;
      }

      const validateNext = structuredDesignDocumentSpecSchema.safeParse(nextSpec);
      if (!validateNext.success) {
        const issues = validateNext.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        unresolved.push(`[${row.id}] 更新後バリデーション失敗: ${issues}`);
        continue;
      }

      console.log(`\n[${row.id}] ${row.name} (${row.type})`);
      for (const log of changeLogs) {
        console.log(log);
      }

      updates.push({ id: row.id, details: validateNext.data as Record<string, unknown> });
    }

    console.log("\n----------------------------------------");
    console.log(`対象DD数: ${rows.length}`);
    console.log(`更新予定DD数: ${updates.length}`);
    console.log(`未解決件数: ${unresolved.length}`);

    if (unresolved.length > 0) {
      console.log("\n未解決一覧:");
      for (const message of unresolved) {
        console.log(`- ${message}`);
      }
    }

    if (!execute) {
      console.log("\n🏃 DRY-RUNのためDB更新はしていません。");
      console.log("実行する場合は --execute を付けてください。");
      return;
    }

    if (unresolved.length > 0) {
      console.error("\n❌ 未解決があるため実行を中止しました。先にmappingを補ってください。");
      process.exit(1);
    }

    if (updates.length === 0) {
      console.log("\n✅ 更新対象がないため終了します。");
      return;
    }

    await client.query("BEGIN");
    try {
      for (const update of updates) {
        await client.query(
          `UPDATE design_documents
           SET details = $3::jsonb,
               updated_at = NOW()
           WHERE project_id = $1
             AND id = $2`,
          [projectId, update.id, JSON.stringify(update.details)]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    console.log(`\n✅ ${updates.length} 件のDDを更新しました。`);

    const { rows: verifyRows } = await client.query(
      `SELECT id, details
       FROM design_documents
       WHERE project_id = $1
         AND srf_id = $2
       ORDER BY id`,
      [projectId, TARGET_SRF_ID]
    );

    let remainingMissing = 0;
    for (const row of verifyRows) {
      const details = (row.details ?? {}) as Record<string, unknown>;
      const sideEffects = (details.sideEffects ?? {}) as Record<string, unknown>;
      for (const key of sideEffectKeys) {
        const list = Array.isArray(sideEffects[key]) ? (sideEffects[key] as Record<string, unknown>[]) : [];
        for (const item of list) {
          if (isMissingRuleRef(item.ruleRef)) {
            remainingMissing += 1;
          }
        }
      }
    }

    console.log(`検証結果: sideEffects.ruleRef 未設定件数 = ${remainingMissing}`);
    if (remainingMissing === 0) {
      console.log("🎉 SF-AR-0001 の副作用ruleRef補完が完了しました。");
    } else {
      console.log("⚠️ 未設定が残っています。");
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

