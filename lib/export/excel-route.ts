import { NextResponse } from "next/server";
import { Workbook, type Column } from "exceljs";

type ExcelCellValue = string | number | boolean | null | undefined;
export type ExcelRow = Record<string, ExcelCellValue>;
export type ExcelColumnDef = Pick<Column, "header" | "key" | "width">;

const HEADER_FONT = { bold: true, name: "Meiryo UI" };
const DATA_FONT = { name: "Meiryo UI" };
const HEADER_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFE0E0E0" },
};

function formatIsoDateForFilename(): string {
  return new Date().toISOString().split("T")[0];
}

function asUint8Array(buffer: Uint8Array | ArrayBuffer): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

export async function buildChildrenMap<Parent, Key extends string, Child>(
  parents: Parent[],
  getKey: (parent: Parent) => Key,
  fetchChildren: (parent: Parent) => Promise<Child[] | null | undefined>,
): Promise<Map<Key, Child[]>> {
  const entries = await Promise.all(
    parents.map(async (parent) => [getKey(parent), (await fetchChildren(parent)) ?? []] as const),
  );
  return new Map(entries);
}

export function groupByKey<Item, Key extends string>(
  items: Item[] | null | undefined,
  getKey: (item: Item) => Key,
): Map<Key, Item[]> {
  const map = new Map<Key, Item[]>();
  for (const item of items ?? []) {
    const key = getKey(item);
    const grouped = map.get(key) ?? [];
    grouped.push(item);
    map.set(key, grouped);
  }
  return map;
}

export async function buildExcelBuffer(
  sheetName: string,
  columns: ExcelColumnDef[],
  rows: ExcelRow[],
): Promise<Uint8Array> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns as Partial<Column>[];

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
  });

  for (const row of rows) {
    const addedRow = worksheet.addRow(row);
    addedRow.eachCell((cell) => {
      cell.font = DATA_FONT;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return asUint8Array(buffer);
}

export function createExcelDownloadResponse(
  buffer: Uint8Array,
  filenamePrefix: string,
): NextResponse {
  const date = formatIsoDateForFilename();
  const normalizedBuffer = Uint8Array.from(buffer);
  const body = new Blob([normalizedBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filenamePrefix}_${date}.xlsx"`,
    },
  });
}

export function createExportErrorResponse(
  message: string,
  error: unknown,
): NextResponse {
  console.error("Export error:", error);
  return NextResponse.json({ error: message }, { status: 500 });
}
