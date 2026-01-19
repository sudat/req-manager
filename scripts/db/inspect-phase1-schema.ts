import { Client } from "pg";

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const main = async () => {
  const databaseUrl = requiredEnv("DATABASE_URL");

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
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
    console.table(rows);
  } finally {
    await client.end();
  }
};

await main();

