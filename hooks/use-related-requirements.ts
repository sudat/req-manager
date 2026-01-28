"use client";

import { useRelatedRequirementsData } from "./use-related-requirements-data";

export interface UseRelatedRequirementsResult {
	data: ReturnType<typeof useRelatedRequirementsData>["relatedRequirements"];
	loading: boolean;
	error: string | null;
}

/**
 * システム機能IDに関連する要件情報を取得するフック
 * @param srfId - システム機能ID
 * @param options - オプション（requirement_links使用フラグなど）
 * @returns 関連要件情報とローディング・エラー状態
 */
export function useRelatedRequirements(
	srfId: string,
	options: { useRequirementLinks?: boolean } = {}
): UseRelatedRequirementsResult {
	const { useRequirementLinks = true } = options;
	const { relatedRequirements, loading, error } = useRelatedRequirementsData(srfId, {
		useRequirementLinks,
	});

	return {
		data: relatedRequirements,
		loading,
		error,
	};
}
