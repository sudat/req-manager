#!/usr/bin/env -S bun run
/**
 * elementType値を新仕様へ正規化する移行スクリプト
 *
 * 旧値:
 * - text / number / date / datetime / textarea -> input
 * - link -> display
 *
 * Usage:
 *   bun scripts/db/migrate-element-type-values.ts
 *   bun scripts/db/migrate-element-type-values.ts --execute
 *   bun scripts/db/migrate-element-type-values.ts --execute --project-id=<id>
 */

import { createClient } from "@supabase/supabase-js";
import { structuredDesignDocumentSpecSchema } from "../../lib/domain/schemas/design-document-structured";

type JsonLike =
  | null
  | string
  | number
  | boolean
  | JsonLike[]
  | { [key: string]: JsonLike };

type DesignDocumentRow = {
  id: string;
  project_id: string;
  name: string;
  details: JsonLike;
};

const LEGACY_TO_NEW: Record<string, string> = {
  text: "input",
  number: "input",
  date: "input",
  datetime: "input",
  textarea: "input",
  link: "display",
};

function normalizeElementType(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return LEGACY_TO_NEW[value] ?? value;
}

function transformDeep(value: JsonLike): { next: JsonLike; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = transformDeep(item);
      changed = changed || result.changed;
      return result.next;
    });
    return { next, changed };
  }

  if (value && typeof value === "object") {
    let changed = false;
    const entries = Object.entries(value);
    const nextEntries = entries.map(([key, current]) => {
      if (key === "elementType") {
        const normalized = normalizeElementType(current);
        if (normalized !== current) changed = true;
        return [key, normalized] as const;
      }
      const result = transformDeep(current as JsonLike);
      changed = changed || result.changed;
      return [key, result.next] as const;
    });
    return { next: Object.fromEntries(nextEntries), changed };
  }

  return { next: value, changed: false };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const projectArg = args.find((arg) => arg.startsWith("--project-id="));
  const projectId = projectArg?.split("=")[1] ?? process.env.PROJECT_ID;
  return { execute, projectId };
}

async function main() {
  const { execute, projectId } = parseArgs();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let query = supabase.from("design_documents").select("id, project_id, name, details");
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) {
    console.error("❌ Failed to fetch design_documents:", error.message);
    process.exit(1);
  }

  const docs = (data ?? []) as DesignDocumentRow[];
  console.log(`Found ${docs.length} design_documents${projectId ? ` (project: ${projectId})` : ""}`);

  let changedCount = 0;
  let validCount = 0;
  let invalidCount = 0;

  for (const doc of docs) {
    const transformed = transformDeep(doc.details);
    if (!transformed.changed) continue;

    changedCount += 1;

    const parsed = structuredDesignDocumentSpecSchema.safeParse(transformed.next);
    if (!parsed.success) {
      invalidCount += 1;
      const summary = parsed.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(" | ");
      console.error(`❌ Validation failed: ${doc.id} (${doc.name}) -> ${summary}`);
      continue;
    }
    validCount += 1;

    if (execute) {
      const { error: updateError } = await supabase
        .from("design_documents")
        .update({
          details: transformed.next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", doc.id)
        .eq("project_id", doc.project_id);

      if (updateError) {
        console.error(`❌ Update failed: ${doc.id} (${doc.name}) -> ${updateError.message}`);
      } else {
        console.log(`✅ Updated: ${doc.id} (${doc.name})`);
      }
    } else {
      console.log(`📝 DRY-RUN: ${doc.id} (${doc.name})`);
    }
  }

  console.log("");
  console.log(`Changed docs: ${changedCount}`);
  console.log(`Valid after transform: ${validCount}`);
  console.log(`Invalid after transform: ${invalidCount}`);
  if (!execute) {
    console.log("Dry-run mode. Use --execute to apply updates.");
  }
}

main();
