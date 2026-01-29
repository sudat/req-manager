"use client";

import { useEffect, useState } from "react";
import type { RequirementLink } from "@/lib/domain";
import { listBusinessRequirementsByIds } from "@/lib/data/business-requirements";
import { listBusinesses } from "@/lib/data/businesses";
import { listSystemRequirementsByIds } from "@/lib/data/system-requirements";
import { listTasksByIds } from "@/lib/data/tasks";

export type RequirementTitleInfo = {
	title: string;
	taskId?: string;       // for BR
	businessId?: string;   // for BR
	businessArea?: string; // for BR
	srfId?: string;        // for SR
	domainId?: string;     // for SR
};

/**
 * リンクからBR/SRのタイトルとメタデータを一括取得するフック
 * @param links - 要件リンクの配列
 * @param projectId - プロジェクトID
 * @returns Map<`${type}:${id}`, RequirementTitleInfo>
 */
export function useRequirementTitles(
	links: RequirementLink[],
	projectId: string | undefined
): Map<string, RequirementTitleInfo> {
	const [titlesMap, setTitlesMap] = useState<Map<string, RequirementTitleInfo>>(new Map());

	useEffect(() => {
		if (!projectId || links.length === 0) {
			setTitlesMap(new Map());
			return;
		}

		let active = true;

		async function fetchTitles() {
			// 1. BR/SRのIDを収集
			const brIds = new Set<string>();
			const srIds = new Set<string>();

			for (const link of links) {
				if (link.sourceType === "br") brIds.add(link.sourceId);
				if (link.sourceType === "sr") srIds.add(link.sourceId);
				if (link.targetType === "br") brIds.add(link.targetId);
				if (link.targetType === "sr") srIds.add(link.targetId);
			}

			if (brIds.size === 0 && srIds.size === 0) {
				if (active) setTitlesMap(new Map());
				return;
			}

			// 2. BR/SRを一括取得
			const [brResult, srResult] = await Promise.all([
				brIds.size > 0 ? listBusinessRequirementsByIds(Array.from(brIds), projectId) : { data: [], error: null },
				srIds.size > 0 ? listSystemRequirementsByIds(Array.from(srIds), projectId) : { data: [], error: null },
			]);

			if (!active) return;

			if (brResult.error || srResult.error) {
				console.error("Failed to fetch requirement titles:", brResult.error || srResult.error);
				setTitlesMap(new Map());
				return;
			}

			// 3. Taskを一括取得（BRのbusinessIdを取得するため）
			const taskIds = (brResult.data ?? [])
				.map((br) => br.taskId)
				.filter((id): id is string => id != null);
			const uniqueTaskIds = Array.from(new Set(taskIds));

			let taskBusinessMap = new Map<string, string>();
			let businessAreaMap = new Map<string, string>();
			if (uniqueTaskIds.length > 0) {
				const [taskResult, businessResult] = await Promise.all([
					listTasksByIds(uniqueTaskIds, projectId),
					listBusinesses(projectId),
				]);
				if (!taskResult.error && taskResult.data) {
					taskBusinessMap = new Map(taskResult.data.map((task) => [task.id, task.businessId]));
				}
				if (!businessResult.error && businessResult.data) {
					businessAreaMap = new Map(businessResult.data.map((biz) => [biz.id, biz.area]));
				}
			}

			// 4. Mapを構築
			const map = new Map<string, RequirementTitleInfo>();

			for (const br of brResult.data ?? []) {
				const businessId = taskBusinessMap.get(br.taskId);
				const businessArea = businessId ? businessAreaMap.get(businessId) : undefined;
				map.set(`br:${br.id}`, {
					title: br.title,
					taskId: br.taskId,
					businessId: businessId,
					businessArea,
				});
			}

			for (const sr of srResult.data ?? []) {
				map.set(`sr:${sr.id}`, {
					title: sr.title,
					srfId: sr.srfIds[0] ?? undefined,
					domainId: sr.systemDomainIds[0], // 最初のdomainIdを使用
				});
			}

			if (active) setTitlesMap(map);
		}

		fetchTitles();

		return () => {
			active = false;
		};
	}, [links, projectId]);

	return titlesMap;
}

/**
 * 要件タイプとIDからURLを生成する
 * @param type - 要件タイプ (br/sr)
 * @param id - 要件ID
 * @param info - RequirementTitleInfo
 * @returns URL
 */
export function getRequirementUrl(
	type: string,
	id: string,
	info: RequirementTitleInfo | undefined
): string {
	if (type === "br" && info?.businessId && info.taskId) {
		const area = info.businessArea ?? info.businessId;
		return `/business/${area}/${info.taskId}`;
	}
	if (type === "sr" && info?.domainId && info?.srfId) {
		return `/system/${info.domainId}/${info.srfId}`;
	}
	return "#";
}
