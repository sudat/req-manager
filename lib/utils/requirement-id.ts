/**
 * 要件IDの次の連番を生成する
 * @param prefix IDプレフィックス（例: "BR-TASK-001"）
 * @param existingIds 既存のIDリスト
 * @returns 新しいID
 */
export function nextSequentialId(prefix: string, existingIds: string[]): string {
	const used = new Set(existingIds);
	for (let i = 1; i < 1000; i++) {
		const candidate = `${prefix}-${String(i).padStart(3, "0")}`;
		if (!used.has(candidate)) return candidate;
	}
	return `${prefix}-${Date.now()}`;
}
