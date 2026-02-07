/**
 * Migrate design_documents.details to flat structured schema.
 *
 * Usage:
 *   bun scripts/migrate-dd-structured-spec.ts --dry-run --srf-prefix=SF-GL-00
 *   bun scripts/migrate-dd-structured-spec.ts --apply --srf-prefix=SF-GL-00
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "../lib/supabase/client";
import type { DdType } from "../lib/domain";
import {
  createEmptyStructuredDesignDocumentSpec,
  ddTypeToStructuredIoType,
  structuredDesignDocumentSpecSchema,
  type StructuredDesignDocumentSpec,
} from "../lib/domain/schemas/design-document-structured";
import type { Field } from "../lib/domain/schemas/fields";

type DesignDocumentRow = {
  id: string;
  srf_id: string;
  name: string;
  type: string | null;
  details: unknown;
  entry_points: unknown;
};

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");
const srfPrefix =
  process.argv.find((arg) => arg.startsWith("--srf-prefix="))?.split("=")[1] ??
  "SF-GL-00";
const reportPath =
  process.argv.find((arg) => arg.startsWith("--report="))?.split("=")[1] ??
  path.join(process.cwd(), "test-results", `dd-structured-migration-${Date.now()}.json`);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const toStringValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toStringValue(item))
    .filter((item): item is string => Boolean(item));
};

const sanitizeFieldName = (text: string, prefix: string, index: number): string => {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base.length > 0 ? base : `${prefix}_${index + 1}`;
};

const toFieldArray = (items: string[], prefix: "input" | "output"): Field[] =>
  items.map((item, index) => ({
    name: sanitizeFieldName(item, prefix, index),
    type: "string",
    required: true,
    description: item,
  }));

const mergeFields = (base: Field[], incoming: Field[]): Field[] => {
  const map = new Map(base.map((field) => [field.name, field] as const));
  for (const field of incoming) {
    if (!map.has(field.name)) {
      map.set(field.name, field);
    }
  }
  return Array.from(map.values());
};

const pushInvariant = (
  spec: StructuredDesignDocumentSpec,
  name: string,
  description: string,
  expression?: string
) => {
  spec.invariants.push({ name, description, expression });
};

const addSideEffectText = (spec: StructuredDesignDocumentSpec, label: string, text: string | null) => {
  if (!text) return;
  const existing = spec.sideEffects.description.trim();
  const nextLine = `${label}: ${text}`;
  spec.sideEffects.description =
    existing === "" || existing === "副作用なし" ? nextLine : `${existing}\n${nextLine}`;
};

const parseEntryPointPaths = (entryPoints: unknown): string[] => {
  if (!Array.isArray(entryPoints)) return [];
  return entryPoints
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const value = toStringValue(entry.path);
      return value;
    })
    .filter((value): value is string => Boolean(value));
};

const normalizeDdType = (value: string | null): DdType => {
  const valid = new Set<DdType>([
    "screen",
    "api",
    "batch",
    "external_if",
    "model",
    "report",
    "job",
  ]);
  if (value && valid.has(value as DdType)) return value as DdType;
  return "screen";
};

const detectReportFormat = (scope: string | null, outputs: string[]): "pdf" | "csv" | "xlsx" | "json" => {
  const joined = `${scope ?? ""} ${outputs.join(" ")}`.toLowerCase();
  if (joined.includes("xlsx") || joined.includes("excel")) return "xlsx";
  if (joined.includes("csv")) return "csv";
  if (joined.includes("json")) return "json";
  return "pdf";
};

const buildStructuredSpecFromLegacy = (
  row: DesignDocumentRow,
  legacyInput: Record<string, unknown>
): StructuredDesignDocumentSpec => {
  const ddType = normalizeDdType(row.type);
  const ioType = ddTypeToStructuredIoType(ddType);
  const spec = createEmptyStructuredDesignDocumentSpec(ioType);
  const legacy =
    isRecord(legacyInput.legacyDetails) && Object.keys(legacyInput).length === 1
      ? toRecord(legacyInput.legacyDetails)
      : legacyInput;

  const notes = toStringValue(legacy.notes);
  const scope = toStringValue(legacy.scope);
  const dataFlow = toStringValue(legacy.data_flow);
  const constraints = toStringArray(legacy.constraints);
  const relatedSrs = toStringArray(legacy.related_srs);
  const inputs = toStringArray(legacy.inputs);
  const outputs = toStringArray(legacy.outputs);

  spec.inputFields = mergeFields(spec.inputFields, toFieldArray(inputs, "input"));
  spec.outputFields = mergeFields(spec.outputFields, toFieldArray(outputs, "output"));

  addSideEffectText(spec, "notes", notes);
  addSideEffectText(spec, "data_flow", dataFlow);
  if (scope) pushInvariant(spec, "scope", scope);

  constraints.forEach((constraint, index) =>
    pushInvariant(spec, `constraint_${index + 1}`, constraint)
  );
  relatedSrs.forEach((sr, index) => pushInvariant(spec, `related_sr_${index + 1}`, sr));

  const coreLogic = toRecord(legacy.core_logic);
  if (Object.keys(coreLogic).length > 0) {
    pushInvariant(spec, "core_logic", JSON.stringify(coreLogic));
  }

  const apiDefinition = toRecord(legacy.api_definition);
  if (Object.keys(apiDefinition).length > 0) {
    const endpoints = Array.isArray(apiDefinition.endpoints) ? apiDefinition.endpoints : [];
    if (ioType === "api" && spec.inputSchema && "method" in spec.inputSchema && endpoints.length > 0) {
      const endpoint = toRecord(endpoints[0]);
      const method = toStringValue(endpoint.method);
      const pathValue = toStringValue(endpoint.path);
      if (method && ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        spec.inputSchema.method = method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      }
      if (pathValue) spec.inputSchema.path = pathValue;
      spec.typeDetail = {
        ioType: "api",
        method: spec.inputSchema.method,
        path: spec.inputSchema.path,
      };
    }
    pushInvariant(spec, "api_definition", JSON.stringify(apiDefinition));
  }

  const batchDesign = toRecord(legacy.batch_design);
  if (Object.keys(batchDesign).length > 0) {
    const schedule = toRecord(batchDesign.schedule);
    const expression = toStringValue(schedule.expression);
    if (expression && ioType === "batch" && spec.inputSchema && "schedule" in spec.inputSchema) {
      spec.inputSchema.schedule = expression;
      spec.typeDetail = {
        ioType: "batch",
        schedule: expression,
        source: spec.inputSchema.source,
      };
    }
    pushInvariant(spec, "batch_design", JSON.stringify(batchDesign));
  }

  const screenDesign = toRecord(legacy.screen_design);
  if (Object.keys(screenDesign).length > 0) {
    const filters = toStringArray(screenDesign.filters);
    const columns = toStringArray(screenDesign.columns);
    const sections = toStringArray(screenDesign.sections);
    const features = toStringArray(screenDesign.features);
    spec.inputFields = mergeFields(spec.inputFields, toFieldArray(filters, "input"));
    spec.outputFields = mergeFields(spec.outputFields, toFieldArray(columns, "output"));
    sections.forEach((section, index) => pushInvariant(spec, `section_${index + 1}`, section));
    features.forEach((feature, index) => pushInvariant(spec, `feature_${index + 1}`, feature));
    pushInvariant(spec, "screen_design", JSON.stringify(screenDesign));
  }

  if (ioType === "report") {
    spec.typeDetail = {
      ioType: "report",
      format: detectReportFormat(scope, outputs),
      outputPath: "",
    };
  }

  if (ioType === "model" && scope) {
    spec.typeDetail = {
      ioType: "model",
      entity: scope,
      table: "",
    };
  }

  if (ioType === "screen" && scope) {
    spec.typeDetail = {
      ioType: "screen",
      route: "",
      trigger: "click",
    };
  }

  if (ioType === "job" && scope) {
    spec.typeDetail = {
      ioType: "job",
      event: scope,
    };
  }

  const allowPaths = parseEntryPointPaths(row.entry_points);
  if (allowPaths.length > 0) {
    spec.boundaries.allowPaths = allowPaths;
  }

  if (spec.sideEffects.description.trim() === "") {
    spec.sideEffects.description = "副作用なし";
  }

  return structuredDesignDocumentSpecSchema.parse(spec);
};

async function main() {
  console.log("========================================");
  console.log("Design Document flat-structure migration");
  console.log("========================================");
  console.log(`mode: ${shouldApply ? "apply" : "dry-run"}`);
  console.log(`srfPrefix: ${srfPrefix}`);

  const { data, error } = await supabase
    .from("design_documents")
    .select("id, srf_id, name, type, details, entry_points")
    .ilike("srf_id", `${srfPrefix}%`)
    .order("id");

  if (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as DesignDocumentRow[];
  if (rows.length === 0) {
    console.log("No target rows.");
    return;
  }

  const report: {
    total: number;
    updated: number;
    skipped: number;
    failed: string[];
    updatedIds: string[];
  } = {
    total: rows.length,
    updated: 0,
    skipped: 0,
    failed: [],
    updatedIds: [],
  };

  for (const row of rows) {
    try {
      const details = toRecord(row.details);
      const wrappedSpec = details.structuredSpec;
      let spec: StructuredDesignDocumentSpec;
      let needsUpdate = true;

      if (wrappedSpec !== undefined) {
        const wrappedParsed = structuredDesignDocumentSpecSchema.safeParse(wrappedSpec);
        spec = wrappedParsed.success ? wrappedParsed.data : buildStructuredSpecFromLegacy(row, details);
      } else {
        const flatParsed = structuredDesignDocumentSpecSchema.safeParse(details);
        spec = flatParsed.success ? flatParsed.data : buildStructuredSpecFromLegacy(row, details);
      }

      const nextDetails = spec;
      if (JSON.stringify(details) === JSON.stringify(nextDetails)) {
        needsUpdate = false;
      }

      if (!needsUpdate) {
        report.skipped += 1;
        continue;
      }

      report.updated += 1;
      report.updatedIds.push(row.id);
      if (shouldApply) {
        const { error: updateError } = await supabase
          .from("design_documents")
          .update({ details: nextDetails })
          .eq("id", row.id);
        if (updateError) {
          report.failed.push(`${row.id}: ${updateError.message}`);
        } else {
          console.log(`updated: ${row.id} (${row.srf_id})`);
        }
      } else {
        console.log(`candidate: ${row.id} (${row.srf_id})`);
      }
    } catch (migrationError) {
      const message =
        migrationError instanceof Error ? migrationError.message : String(migrationError);
      report.failed.push(`${row.id}: ${message}`);
    }
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("========================================");
  console.log(`total:   ${report.total}`);
  console.log(`updated: ${report.updated}`);
  console.log(`skipped: ${report.skipped}`);
  console.log(`failed:  ${report.failed.length}`);
  console.log(`report:  ${reportPath}`);
  if (report.failed.length > 0) {
    console.log("failed details:");
    report.failed.forEach((item) => console.log(`- ${item}`));
    if (shouldApply) process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected migration error:", error);
  process.exit(1);
});
