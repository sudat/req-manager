import { Client } from "pg";

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const DRY_RUN = process.env.DRY_RUN !== "false";

type AcceptanceCriterionJson = {
  id: string;
  description: string;
  verification_method: string | null;
  status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  evidence: string | null;
};

type RecordWithCriteria = {
  id: string;
  title: string;
  acceptance_criteria_json: AcceptanceCriterionJson[] | null;
  acceptance_criteria: string[] | null;
};

type PreviewChange = {
  id: string;
  title: string;
  changes: Array<{ criterionId: string; before: string; after: string }>;
};

const cleanDescription = (desc: string): string => {
  // 1. "legacy-only" を削除
  const cleaned = desc.replace(/legacy-only/g, "");
  // 2. 連続空白を1つの空白に圧縮
  const compressed = cleaned.replace(/\s+/g, " ");
  // 3. trim
  return compressed.trim();
};

const buildPreviewChanges = (
  id: string,
  title: string,
  criteria: AcceptanceCriterionJson[] | null
): PreviewChange | null => {
  if (!criteria) return null;

  const changes: PreviewChange["changes"] = [];
  for (const criterion of criteria) {
    const before = criterion.description;
    const after = cleanDescription(before);
    if (before !== after) {
      changes.push({
        criterionId: criterion.id,
        before,
        after,
      });
    }
  }

  if (changes.length === 0) return null;

  return { id, title, changes };
};

const cleanCriteria = (
  criteria: AcceptanceCriterionJson[] | null
): AcceptanceCriterionJson[] | null => {
  if (!criteria) return null;

  const cleaned = criteria.map((c) => ({
    ...c,
    description: cleanDescription(c.description),
  }));

  return cleaned;
};

const findAffectedRecords = async (
  client: Client,
  tableName: "business_requirements" | "system_requirements"
): Promise<RecordWithCriteria[]> => {
  const { rows } = await client.query<RecordWithCriteria>(
    `
    SELECT id, title, acceptance_criteria_json, acceptance_criteria
    FROM ${tableName}
    WHERE acceptance_criteria_json::text LIKE '%legacy-only%'
    `
  );
  return rows;
};

const updateRecord = async (
  client: Client,
  tableName: "business_requirements" | "system_requirements",
  id: string,
  cleanedCriteria: AcceptanceCriterionJson[] | null
): Promise<void> => {
  const cleanedTextArray = cleanedCriteria?.map((c) => c.description) ?? null;

  await client.query(
    `
    UPDATE ${tableName}
    SET
      acceptance_criteria_json = $1,
      acceptance_criteria = $2,
      updated_at = NOW()
    WHERE id = $3
    `,
    [JSON.stringify(cleanedCriteria), cleanedTextArray, id]
  );
};

const formatChangeSummary = (change: PreviewChange): string => {
  const title = change.title.length > 20 ? `${change.title.slice(0, 17)}...` : change.title;
  const changeCount = change.changes.length;
  const changeText = change.changes
    .slice(0, 2)
    .map((c) => `${c.criterionId}: "${c.before.slice(0, 30)}..." → "${c.after.slice(0, 30)}..."`)
    .join(", ");
  const moreText = change.changes.length > 2 ? ` (+${change.changes.length - 2} more)` : "";
  return `${change.id.padEnd(16)} | ${title.padEnd(20)} | ${changeCount} changes: ${changeText}${moreText}`;
};

const displayPreview = (
  businessChanges: PreviewChange[],
  systemChanges: PreviewChange[]
): void => {
  // eslint-disable-next-line no-console
  console.log(`\n==> ${DRY_RUN ? "Preview Mode (DRY_RUN=true)" : "Executing"}\n`);

  if (businessChanges.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[business_requirements]");
    // eslint-disable-next-line no-console
    console.log(`${"ID".padEnd(16)} | ${"Title".padEnd(20)} | Changes`);
    // eslint-disable-next-line no-console
    console.log("".padEnd(80, "-"));
    for (const change of businessChanges) {
      // eslint-disable-next-line no-console
      console.log(formatChangeSummary(change));
    }
    // eslint-disable-next-line no-console
    console.log(`Affected: ${businessChanges.length} records\n`);
  } else {
    // eslint-disable-next-line no-console
    console.log("[business_requirements] - No affected records\n");
  }

  if (systemChanges.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[system_requirements]");
    // eslint-disable-next-line no-console
    console.log(`${"ID".padEnd(16)} | ${"Title".padEnd(20)} | Changes`);
    // eslint-disable-next-line no-console
    console.log("".padEnd(80, "-"));
    for (const change of systemChanges) {
      // eslint-disable-next-line no-console
      console.log(formatChangeSummary(change));
    }
    // eslint-disable-next-line no-console
    console.log(`Affected: ${systemChanges.length} records\n`);
  } else {
    // eslint-disable-next-line no-console
    console.log("[system_requirements] - No affected records\n");
  }

  const total = businessChanges.length + systemChanges.length;
  // eslint-disable-next-line no-console
  console.log(`==> Total: ${total} record${total === 1 ? "" : "s"} ${DRY_RUN ? "will be " : ""}affected`);
};

const confirmExecution = async (): Promise<boolean> => {
  if (DRY_RUN) return false;

  // eslint-disable-next-line no-console
  console.log("\n==> Confirm execution");
  // eslint-disable-next-line no-console
  console.log("Type 'yes' to proceed:");

  const readline = (await import("node:readline/promises")).createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await readline.question("> ");
  readline.close();

  return answer.toLowerCase() === "yes";
};

const main = async () => {
  const databaseUrl = requiredEnv("DATABASE_URL");

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    // eslint-disable-next-line no-console
    console.log("==> Scanning for 'legacy-only' text...");

    const [businessRecords, systemRecords] = await Promise.all([
      findAffectedRecords(client, "business_requirements"),
      findAffectedRecords(client, "system_requirements"),
    ]);

    const businessChanges: PreviewChange[] = [];
    for (const record of businessRecords) {
      const change = buildPreviewChanges(
        record.id,
        record.title,
        record.acceptance_criteria_json
      );
      if (change) businessChanges.push(change);
    }

    const systemChanges: PreviewChange[] = [];
    for (const record of systemRecords) {
      const change = buildPreviewChanges(
        record.id,
        record.title,
        record.acceptance_criteria_json
      );
      if (change) systemChanges.push(change);
    }

    displayPreview(businessChanges, systemChanges);

    if (DRY_RUN) {
      // eslint-disable-next-line no-console
      console.log("\n==> DRY_RUN mode: No changes made");
      return;
    }

    const confirmed = await confirmExecution();
    if (!confirmed) {
      // eslint-disable-next-line no-console
      console.log("\n==> Aborted");
      return;
    }

    // eslint-disable-next-line no-console
    console.log("\n==> Updating records...");

    // トランザクション開始
    await client.query("BEGIN");

    let updatedCount = 0;
    const errors: Array<{ table: string; id: string; error: string }> = [];

    // business_requirements を更新
    for (const change of businessChanges) {
      try {
        const { rows } = await client.query<Pick<RecordWithCriteria, "acceptance_criteria_json">>(
          `SELECT acceptance_criteria_json FROM business_requirements WHERE id = $1`,
          [change.id]
        );
        const cleaned = cleanCriteria(rows[0].acceptance_criteria_json);
        await updateRecord(client, "business_requirements", change.id, cleaned);
        updatedCount++;
      } catch (e) {
        errors.push({ table: "business_requirements", id: change.id, error: String(e) });
      }
    }

    // system_requirements を更新
    for (const change of systemChanges) {
      try {
        const { rows } = await client.query<Pick<RecordWithCriteria, "acceptance_criteria_json">>(
          `SELECT acceptance_criteria_json FROM system_requirements WHERE id = $1`,
          [change.id]
        );
        const cleaned = cleanCriteria(rows[0].acceptance_criteria_json);
        await updateRecord(client, "system_requirements", change.id, cleaned);
        updatedCount++;
      } catch (e) {
        errors.push({ table: "system_requirements", id: change.id, error: String(e) });
      }
    }

    if (errors.length > 0) {
      await client.query("ROLLBACK");
      // eslint-disable-next-line no-console
      console.error(`\n==> Errors occurred. Transaction rolled back.`);
      for (const err of errors) {
        // eslint-disable-next-line no-console
        console.error(`  ${err.table}.${err.id}: ${err.error}`);
      }
      return;
    }

    await client.query("COMMIT");
    // eslint-disable-next-line no-console
    console.log(`\n==> Updated: ${updatedCount} records`);

    // 検証: 更新後に "legacy-only" が残っていないか確認
    const [businessAfter, systemAfter] = await Promise.all([
      findAffectedRecords(client, "business_requirements"),
      findAffectedRecords(client, "system_requirements"),
    ]);

    const remainingCount = businessAfter.length + systemAfter.length;
    if (remainingCount > 0) {
      // eslint-disable-next-line no-console
      console.warn(`\n==> Warning: ${remainingCount} records still contain 'legacy-only'`);
    } else {
      // eslint-disable-next-line no-console
      console.log("\n==> Verification: All 'legacy-only' text removed");
    }
  } finally {
    await client.end();
  }
};

await main();
