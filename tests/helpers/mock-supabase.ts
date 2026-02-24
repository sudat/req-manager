type TableRows = Record<string, any[]>;

type PendingMutation =
  | { kind: "insert"; payload: any }
  | { kind: "update"; payload: any }
  | { kind: "delete" }
  | null;

type OrderSpec = { column: string; ascending: boolean };

function normalizeTables(input?: any[] | TableRows): TableRows {
  if (!input) return {};
  if (Array.isArray(input)) return { __default: input };
  return input;
}

function getTableRows(tables: TableRows, tableName: string): any[] {
  return tables[tableName] ?? tables.__default ?? [];
}

function setTableRows(tables: TableRows, tableName: string, rows: any[]): void {
  if (tables[tableName]) {
    tables[tableName] = rows;
    return;
  }
  if (tables.__default) {
    tables.__default = rows;
    return;
  }
  tables[tableName] = rows;
}

function createQueryBuilder(tables: TableRows, tableName: string) {
  const filters: Array<(row: any) => boolean> = [];
  const orders: OrderSpec[] = [];
  let mutation: PendingMutation = null;

  const applyFilters = (rows: any[]) => rows.filter((r) => filters.every((f) => f(r)));

  const applyOrders = (rows: any[]) => {
    if (orders.length === 0) return rows;
    const sorted = [...rows];
    sorted.sort((a, b) => {
      for (const { column, ascending } of orders) {
        const av = a?.[column];
        const bv = b?.[column];
        if (av === bv) continue;
        if (av === undefined) return ascending ? 1 : -1;
        if (bv === undefined) return ascending ? -1 : 1;
        if (av < bv) return ascending ? -1 : 1;
        if (av > bv) return ascending ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  };

  const execute = () => {
    const baseRows = getTableRows(tables, tableName);
    let resultRows = applyOrders(applyFilters(baseRows));

    if (!mutation) {
      return { data: resultRows, error: null };
    }

    if (mutation.kind === "insert") {
      const payload = Array.isArray(mutation.payload) ? mutation.payload : [mutation.payload];
      const nextRows = [...baseRows, ...payload];
      setTableRows(tables, tableName, nextRows);
      mutation = null;
      resultRows = payload;
      return { data: resultRows, error: null };
    }

    if (mutation.kind === "update") {
      const payload = mutation.payload ?? {};
      for (const row of resultRows) {
        Object.assign(row, payload);
      }
      mutation = null;
      return { data: resultRows, error: null };
    }

    // delete
    const toDelete = new Set(resultRows);
    const nextRows = baseRows.filter((r) => !toDelete.has(r));
    setTableRows(tables, tableName, nextRows);
    mutation = null;
    return { data: resultRows, error: null };
  };

  const builder: any = {
    select: () => builder,
    insert: (payload: any) => {
      mutation = { kind: "insert", payload };
      return builder;
    },
    update: (payload: any) => {
      mutation = { kind: "update", payload };
      return builder;
    },
    delete: () => {
      mutation = { kind: "delete" };
      return builder;
    },
    eq: (column: string, value: any) => {
      filters.push((row) => row?.[column] === value);
      return builder;
    },
    in: (column: string, values: any[]) => {
      const set = new Set(values ?? []);
      filters.push((row) => set.has(row?.[column]));
      return builder;
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      orders.push({ column, ascending: options?.ascending ?? true });
      return builder;
    },
    limit: () => builder,
    range: () => builder,
    maybeSingle: async () => {
      const { data, error } = execute();
      const row = Array.isArray(data) ? data[0] ?? null : (data ?? null);
      return { data: row, error };
    },
    single: async () => {
      const { data, error } = execute();
      const row = Array.isArray(data) ? data[0] ?? null : (data ?? null);
      if (!row) return { data: null, error: { message: "Not found" } };
      return { data: row, error };
    },
    then: (resolve: any, reject: any) => {
      try {
        return Promise.resolve(execute()).then(resolve, reject);
      } catch (e) {
        return Promise.reject(e).then(resolve, reject);
      }
    },
    catch: (reject: any) => builder.then((v: any) => v, reject),
  };

  return builder;
}

/**
 * Supabase client mock for Bun tests.
 *
 * - Chainable: from(...).select(...).eq(...).order(...)
 * - Awaitable: `await query` returns `{ data, error }`
 * - Supports insert/update/delete + single/maybeSingle
 *
 * `initial` can be either:
 * - array: treated as default table rows for any table
 * - object map: `{ table_name: rows }`
 */
export function createMockSupabase(initial?: any[] | TableRows) {
  const tables = normalizeTables(initial);
  return {
    from: (tableName: string) => createQueryBuilder(tables, tableName),
  };
}

