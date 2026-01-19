import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const findMigration = (suffix: string): string => {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  const matches = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(suffix))
    .map((name) => join(migrationsDir, name))
    .sort();

  if (matches.length === 0) throw new Error(`Migration not found: *${suffix}`);
  if (matches.length > 1) throw new Error(`Ambiguous migration suffix: *${suffix}`);
  return matches[0];
};

const runSqlFile = async (client: Client, filePath: string) => {
  const sql = readFileSync(filePath, "utf8").trim();
  if (!sql) throw new Error(`SQL file is empty: ${filePath}`);

  // eslint-disable-next-line no-console
  console.log(`\n==> Applying: ${filePath}`);
  await client.query(sql);
};

const main = async () => {
  const databaseUrl = requiredEnv("DATABASE_URL");

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const schemaFile = findMigration("_prd_v1_3_phase1_schema.sql");
    const backfillFile = findMigration("_prd_v1_3_phase1_backfill.sql");

    await runSqlFile(client, schemaFile);
    await runSqlFile(client, backfillFile);

    const { rows } = await client.query<{
      table_name: string;
      column_name: string;
      data_type: string;
      udt_name: string;
      is_nullable: "YES" | "NO";
      column_default: string | null;
    }>(
      `
      select
        table_name,
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('business_requirements', 'system_requirements', 'system_functions')
      order by table_name, ordinal_position
      `,
    );

    // eslint-disable-next-line no-console
    console.log("\n==> Columns (after):");
    // eslint-disable-next-line no-console
    console.table(rows);
  } finally {
    await client.end();
  }
};

await main();

