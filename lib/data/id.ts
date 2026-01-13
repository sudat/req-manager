export const nextSequentialId = (prefix: string, existingIds: string[], padLength = 3) => {
  const numbers = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number.parseInt(id.slice(prefix.length), 10))
    .filter((value) => Number.isFinite(value));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(padLength, "0")}`;
};
