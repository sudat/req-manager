export function nextSequentialId(
  prefix: string,
  existingIds: string[],
  padLength = 3
): string {
  const numbers = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number.parseInt(id.slice(prefix.length), 10))
    .filter((value) => Number.isFinite(value));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(padLength, "0")}`;
}

export function nextSequentialIdFrom<T>(
  prefix: string,
  items: T[],
  getId: (item: T) => string,
  padLength = 3
): string {
  return nextSequentialId(prefix, items.map(getId), padLength);
}

export function nextAvailableId(
  prefix: string,
  existingIds: string[],
  padLength = 3,
  separator = ""
): string {
  const used = new Set(existingIds);
  for (let i = 1; i < 1000; i++) {
    const candidate = `${prefix}${separator}${String(i).padStart(padLength, "0")}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${prefix}${separator}${Date.now()}`;
}

export function nextAvailableIdFrom<T>(
  prefix: string,
  items: T[],
  getId: (item: T) => string,
  padLength = 3,
  separator = ""
): string {
  return nextAvailableId(prefix, items.map(getId), padLength, separator);
}
