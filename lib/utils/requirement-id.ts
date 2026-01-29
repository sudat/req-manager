import { nextAvailableId } from "@/lib/data/id";

/**
 * 要件IDの次の連番を生成する
 * @param prefix IDプレフィックス（例: "BR-AR-0001"）
 * @param existingIds 既存のIDリスト
 * @returns 新しいID
 */
export function nextSequentialId(prefix: string, existingIds: string[], padLength = 3): string {
	return nextAvailableId(prefix, existingIds, padLength, "-");
}
