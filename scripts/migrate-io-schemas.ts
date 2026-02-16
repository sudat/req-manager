/**
 * deliverables.function の input/output から structured IO を生成する移行スクリプト
 *
 * 使用方法:
 *   bunx tsx scripts/migrate-io-schemas.ts --dry-run
 *   bunx tsx scripts/migrate-io-schemas.ts --apply
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "../lib/supabase/client";
import type { Deliverable } from "../lib/domain/schemas/deliverable";
import type { Field } from "../lib/domain/schemas/fields";
import type {
  StructuredInput,
  StructuredOutput,
  ApiInput,
  ApiOutput,
  ScreenInput,
  ScreenOutput,
  BatchInput,
  BatchOutput,
  JobInput,
  JobOutput,
} from "../lib/domain/schemas/io-schemas";

type IoType = "api" | "screen" | "batch" | "job";

const isIoType = (value: string): value is IoType =>
  value === "api" || value === "screen" || value === "batch" || value === "job";

const splitRespectingParens = (text: string): string[] => {
  const tokens: string[] = [];
  let current = "";
  let depth = 0;
  for (const ch of text) {
    if (ch === "（" || ch === "(") depth += 1;
    if (ch === "）" || ch === ")") depth = Math.max(0, depth - 1);
    if ((ch === "、" || ch === ",") && depth === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens;
};

const pickPattern = (text: string): string | undefined => {
  const match = text.match(/\^.+\$/);
  return match ? match[0] : undefined;
};

const parseRange = (text: string): { min?: number; max?: number } => {
  const match = text.match(/(\d+)\s*[-〜~]\s*(\d+)/);
  if (!match) return {};
  return { min: Number(match[1]), max: Number(match[2]) };
};

const parseDigits = (text: string): { min?: number; max?: number } => {
  const match = text.match(/(\d+)桁/);
  if (!match) return {};
  const value = Number(match[1]);
  return { min: value, max: value };
};

const detectType = (text: string): Field["type"] => {
  if (text.includes("数値") || text.includes("数字") || text.includes("number")) return "number";
  if (text.includes("真偽") || text.includes("boolean")) return "boolean";
  if (text.includes("列挙") || text.includes("enum")) return "enum";
  if (text.includes("配列") || text.includes("array")) return "array";
  if (text.includes("オブジェクト") || text.includes("object")) return "object";
  return "string";
};

const detectFormat = (text: string): string | undefined => {
  const formats = ["email", "uuid", "url", "uri", "date", "datetime", "time", "ipv4", "ipv6"];
  const found = formats.find((fmt) => text.includes(fmt));
  return found;
};

const parseField = (segment: string): Field | null => {
  const [namePart, detailPartRaw] = segment.split(/[（(]/);
  const name = namePart?.trim();
  if (!name) return null;
  const detailPart = detailPartRaw ? detailPartRaw.replace(/[）)]$/, "") : "";
  const tokens = detailPart ? splitRespectingParens(detailPart) : [];
  const required = tokens.some((t) => t.includes("必須"))
    ? true
    : tokens.some((t) => t.includes("任意"))
      ? false
      : true;
  const type = tokens.length > 0 ? detectType(tokens.join(" ")) : "string";
  const constraints: Field["constraints"] = {};
  const range = parseRange(detailPart);
  if (range.min !== undefined) constraints.min = range.min;
  if (range.max !== undefined) constraints.max = range.max;
  const digits = parseDigits(detailPart);
  if (digits.min !== undefined && digits.max !== undefined) {
    constraints.min = digits.min;
    constraints.max = digits.max;
  }
  const pattern = pickPattern(detailPart);
  if (pattern) constraints.pattern = pattern;
  const format = detectFormat(detailPart);
  if (format) constraints.format = format as any;

  const enumMatch = detailPart.match(/\[(.+?)\]/);
  if (enumMatch) {
    constraints.enum = enumMatch[1]
      .split(/[,、]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return {
    name,
    type,
    required,
    description: undefined,
    constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
  };
};

const parseFieldList = (text?: string | null): Field[] => {
  if (!text) return [];
  const segments = splitRespectingParens(text);
  const fields = segments.map(parseField).filter(Boolean) as Field[];
  return fields;
};

const buildStructuredForType = (
  ioType: IoType,
  inputText?: string | null,
  outputText?: string | null
): { structuredInput: StructuredInput; structuredOutput: StructuredOutput } | null => {
  const inputFields = parseFieldList(inputText);
  const outputFields = parseFieldList(outputText);

  switch (ioType) {
    case "api": {
      const structuredInput: ApiInput = {
        method: "POST",
        path: "",
        fields: inputFields.map((f) => ({ ...f, location: "body" as const })),
      };
      const structuredOutput: ApiOutput = {
        success: { status: 200, fields: outputFields },
        error: [],
        fields: [],
      };
      return { structuredInput, structuredOutput };
    }
    case "screen": {
      const structuredInput: ScreenInput = {
        trigger: "click",
        fields: inputFields.map((f) => ({ ...f, elementType: "input" as const })),
      };
      const structuredOutput: ScreenOutput = {
        transition: "",
        messages: outputText ? [outputText] : [],
        fields: [],
      };
      return { structuredInput, structuredOutput };
    }
    case "batch": {
      const structuredInput: BatchInput = {
        schedule: "",
        source: "",
        fields: inputFields.map((f) => ({ ...f, category: "config" as const })),
      };
      const structuredOutput: BatchOutput = {
        summary: {
          processedCount: 0,
          successCount: 0,
          errorCount: 0,
          status: "completed",
        },
        nextBatch: "",
        fields: [],
      };
      return { structuredInput, structuredOutput };
    }
    case "job": {
      const structuredInput: JobInput = {
        event: "",
        fields: inputFields.map((f) => ({ ...f, category: "data" as const })),
      };
      const structuredOutput: JobOutput = {
        result: outputText ?? "",
        nextEvent: "",
        fields: [],
      };
      return { structuredInput, structuredOutput };
    }
  }
};

interface SystemFunctionRow {
  id: string;
  title: string;
  deliverables: Deliverable[] | null;
}

const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const reportPath = args
  .find((value) => value.startsWith("--report="))
  ?.split("=")[1];

async function main() {
  console.log("========================================");
  console.log("Structured IO マイグレーション開始");
  console.log("========================================\n");
  console.log(`mode: ${shouldApply ? "apply" : "dry-run"}`);

  const { data: rows, error } = await supabase
    .from("system_functions")
    .select("id, title, deliverables")
    .order("id");

  if (error) {
    console.error("❌ エラー:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("✅ 対象データなし");
    return;
  }

  const report: {
    total: number;
    updated: number;
    skipped: number;
    manual: string[];
  } = {
    total: rows.length,
    updated: 0,
    skipped: 0,
    manual: [],
  };

  for (const row of rows as SystemFunctionRow[]) {
    const deliverables = row.deliverables ?? [];
    let updated = false;
    const nextDeliverables = deliverables.map((deliverable) => {
      const func = deliverable.design.function;
      if (!func) return deliverable;
      if (func.structuredInput || func.structuredOutput) return deliverable;
      if (!isIoType(deliverable.type)) {
        report.manual.push(`${row.id}:${deliverable.name} (type=${deliverable.type})`);
        return deliverable;
      }
      const structured = buildStructuredForType(
        deliverable.type,
        func.input,
        func.output
      );
      if (!structured) {
        report.manual.push(`${row.id}:${deliverable.name} (parse-failed)`);
        return deliverable;
      }
      updated = true;
      return {
        ...deliverable,
        design: {
          ...deliverable.design,
          function: {
            ...func,
            ioType: deliverable.type,
            structuredInput: structured.structuredInput,
            structuredOutput: structured.structuredOutput,
          },
        },
      };
    });

    if (!updated) {
      report.skipped += 1;
      continue;
    }

    report.updated += 1;
    if (shouldApply) {
      const { error: updateError } = await supabase
        .from("system_functions")
        .update({ deliverables: nextDeliverables })
        .eq("id", row.id);
      if (updateError) {
        console.error(`❌ ${row.id} 更新エラー:`, updateError.message);
      } else {
        console.log(`✅ ${row.id} (${row.title}) 更新`);
      }
    } else {
      console.log(`🔎 ${row.id} (${row.title}) 更新候補`);
    }
  }

  const outputPath =
    reportPath ?? path.join(process.cwd(), "test-results", "structured-io-migration-report.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("\n========================================");
  console.log("マイグレーション完了");
  console.log("========================================");
  console.log(`✅ 更新対象: ${report.updated}件`);
  console.log(`⏭️  スキップ: ${report.skipped}件`);
  console.log(`📝 レポート: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ スクリプト実行エラー:", err);
  process.exit(1);
});
