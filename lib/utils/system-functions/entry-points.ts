import type { EntryPoint } from "@/lib/domain";

export const normalizeEntryPointsInput = (entryPoints: EntryPoint[]): EntryPoint[] =>
	entryPoints.map((entry) => ({
		path: entry.path.trim(),
		type: entry.type?.trim() || null,
		responsibility: entry.responsibility?.trim() || null,
	}));

export const validateEntryPoints = (entryPoints: EntryPoint[]): string | null => {
	const trimmed = entryPoints.map((entry) => entry.path.trim());
	if (trimmed.some((path) => path.length === 0)) {
		return "エントリポイントのパスは必須です。";
	}
	const seen = new Set<string>();
	for (const path of trimmed) {
		if (seen.has(path)) {
			return "エントリポイントのパスが重複しています。";
		}
		seen.add(path);
	}
	return null;
};
