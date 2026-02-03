export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

export const joinCsv = (values: string[]) => values.join(", ");
export const joinLines = (values: string[]) => values.join("\n");
