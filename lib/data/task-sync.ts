import type { Requirement } from "@/lib/domain";
import {
	listBusinessRequirementsByTaskId,
	createBusinessRequirements,
	updateBusinessRequirement,
	deleteBusinessRequirement,
} from "@/lib/data/business-requirements";
import {
	listSystemRequirementsByTaskId,
	createSystemRequirements,
	updateSystemRequirement,
	deleteSystemRequirement,
} from "@/lib/data/system-requirements";
import {
	createAcceptanceCriteria,
	deleteAcceptanceCriteriaBySystemRequirementId,
	acceptanceCriteriaJsonToInputs,
} from "@/lib/data/acceptance-criteria";
import {
	toBusinessRequirementInput,
	toSystemRequirementInput,
} from "@/lib/data/requirement-mapper";
import {
	deleteRequirementLinksBySource,
	createRequirementLinks,
	type RequirementLinkCreateInput,
} from "@/lib/data/requirement-links";
import {
	detectChangedFields,
	markChangedFieldsSuspect,
} from "@/lib/data/suspect-detection";

/**
 * 要件の変更を検出する（ジェネリック版）
 * @param req 編集後の要件
 * @param existing DBから取得した既存要件
 * @returns 変更がある場合はtrue
 */
export function hasRequirementChanged<T extends {
	title: string;
	summary: string;
	goal?: string;
	constraints?: string;
	owner?: string;
	conceptIds: string[];
	srfId: string | null;
	systemDomainIds: string[];
	acceptanceCriteria: string[];
	acceptanceCriteriaJson?: unknown;
	priority?: string | null;
	category?: string | null;
	businessRequirementIds?: string[];
	relatedSystemRequirementIds?: string[];
	relatedDeliverableIds?: string[];
}>(req: T, existing: T): boolean {
	return !(
		req.title === existing.title &&
		req.summary === existing.summary &&
		(req.goal ?? "") === (existing.goal ?? "") &&
		(req.constraints ?? "") === (existing.constraints ?? "") &&
		(req.owner ?? "") === (existing.owner ?? "") &&
		JSON.stringify(req.conceptIds) === JSON.stringify(existing.conceptIds) &&
		req.srfId === existing.srfId &&
		JSON.stringify(req.systemDomainIds) === JSON.stringify(existing.systemDomainIds ?? []) &&
		JSON.stringify(req.acceptanceCriteria) === JSON.stringify(existing.acceptanceCriteria) &&
		JSON.stringify(req.acceptanceCriteriaJson ?? []) ===
			JSON.stringify(existing.acceptanceCriteriaJson ?? []) &&
		(req.category ?? null) === (existing.category ?? null) &&
		JSON.stringify(req.businessRequirementIds ?? []) ===
			JSON.stringify(existing.businessRequirementIds ?? []) &&
		JSON.stringify(req.relatedSystemRequirementIds ?? []) ===
			JSON.stringify(existing.relatedSystemRequirementIds ?? []) &&
		JSON.stringify(req.relatedDeliverableIds ?? []) ===
			JSON.stringify(existing.relatedDeliverableIds ?? [])
	);
}

/**
 * 業務要件をDBに同期する
 * @param taskId タスクID
 * @param editedRequirements 編集後の要件一覧
 * @returns エラーメッセージ（失敗時）、成功時は変更された要件のIDとフィールドのマップ
 */
export async function syncBusinessRequirements(
	taskId: string,
	editedRequirements: Requirement[],
	projectId: string,
): Promise<string | Map<string, string[]>> {
	try {
		// 現在のDB状態を取得
		const { data: existingReqs, error: fetchError } = await listBusinessRequirementsByTaskId(taskId, projectId);
		if (fetchError) return fetchError;

		const existingIds = new Set(existingReqs?.map((r) => r.id) ?? []);
		const editedIds = new Set(editedRequirements.map((r) => r.id));

		// 削除対象: DBにあるが編集状態にはない
		const toDelete = [...existingIds].filter((id) => !editedIds.has(id));

		// 作成対象: 編集状態にあるがDBにはない
		const toCreate = editedRequirements.filter((r) => !existingIds.has(r.id));

		// 更新対象: 両方にあるが内容が異なる可能性がある
		const toUpdate = editedRequirements.filter((r) => existingIds.has(r.id));

		// 変更された要件のIDとフィールドを収集
		const changedRequirements = new Map<string, string[]>();

		// 1. 削除
		for (const id of toDelete) {
			const { error } = await deleteBusinessRequirement(id, projectId);
			if (error) return `削除エラー (${id}): ${error}`;
		}

		// 2. 作成
		if (toCreate.length > 0) {
			const createInputs = toCreate.map((req, index) =>
				({ ...toBusinessRequirementInput(req, taskId, index), projectId })
			);
			const { error } = await createBusinessRequirements(createInputs);
			if (error) return `作成エラー: ${error}`;
		}

		// 3. 更新
		for (const req of toUpdate) {
			const existing = existingReqs?.find((r) => r.id === req.id);
			if (!existing) continue;

			// 変更がなければスキップ（型キャストを使用）
			if (!hasRequirementChanged(req as unknown as Requirement, existing as unknown as Requirement)) {
				continue;
			}

			// 変更フィールドを検出
			const changedFields = detectChangedFields(req, existing);

			// 疑義対象フィールドが変更されている場合はIDとフィールドを記録
			if (changedFields.length > 0) {
				changedRequirements.set(req.id, changedFields);
			}

			const input = toBusinessRequirementInput(req, taskId, existing.sortOrder);
			const { error } = await updateBusinessRequirement(req.id, input, projectId);
			if (error) return `更新エラー (${req.id}): ${error}`;
		}

		return changedRequirements;
	} catch (e) {
		return `同期エラー: ${e instanceof Error ? e.message : String(e)}`;
	}
}

/**
 * システム要件をDBに同期する
 * @param taskId タスクID
 * @param editedRequirements 編集後の要件一覧
 * @returns エラーメッセージ（失敗時）、成功時は変更された要件のIDとフィールドのマップ
 */
export async function syncSystemRequirements(
	taskId: string,
	editedRequirements: Requirement[],
	projectId: string,
): Promise<string | Map<string, string[]>> {
	try {
		// 現在のDB状態を取得
		const { data: existingReqs, error: fetchError } = await listSystemRequirementsByTaskId(taskId, projectId);
		if (fetchError) return fetchError;

		const existingIds = new Set(existingReqs?.map((r) => r.id) ?? []);
		const editedIds = new Set(editedRequirements.map((r) => r.id));

		// 削除対象: DBにあるが編集状態にはない
		const toDelete = [...existingIds].filter((id) => !editedIds.has(id));

		// 作成対象: 編集状態にあるがDBにはない
		const toCreate = editedRequirements.filter((r) => !existingIds.has(r.id));

		// 更新対象: 両方にあるが内容が異なる可能性がある
		const toUpdate = editedRequirements.filter((r) => existingIds.has(r.id));

		// 変更された要件のIDとフィールドを収集
		const changedRequirements = new Map<string, string[]>();

		// 1. 削除
		for (const id of toDelete) {
			const { error } = await deleteSystemRequirement(id, projectId);
			if (error) return `削除エラー (${id}): ${error}`;
		}

		// 2. 作成
		if (toCreate.length > 0) {
			const createInputs = toCreate.map((req, index) =>
				({ ...toSystemRequirementInput(req, taskId, index), projectId })
			);
			const { error } = await createSystemRequirements(createInputs);
			if (error) return `作成エラー: ${error}`;

			const acceptanceInputs = toCreate.flatMap((req) =>
				acceptanceCriteriaJsonToInputs(
					req.acceptanceCriteriaJson ?? [],
					req.id,
					projectId
				)
			);
			const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
			if (acError) return `受入基準作成エラー: ${acError}`;
		}

		// 3. 更新
		for (const req of toUpdate) {
			const existing = existingReqs?.find((r) => r.id === req.id);
			if (!existing) continue;

			// 変更がなければスキップ（型キャストを使用）
			if (!hasRequirementChanged(req as unknown as Requirement, existing as unknown as Requirement)) {
				continue;
			}

			// 変更フィールドを検出
			const changedFields = detectChangedFields(req, existing);

			// 疑義対象フィールドが変更されている場合はIDとフィールドを記録
			if (changedFields.length > 0) {
				changedRequirements.set(req.id, changedFields);
			}

			const input = toSystemRequirementInput(req, taskId, existing.sortOrder);
			const { error } = await updateSystemRequirement(req.id, input, projectId);
			if (error) return `更新エラー (${req.id}): ${error}`;

			const { error: acDeleteError } = await deleteAcceptanceCriteriaBySystemRequirementId(
				req.id,
				projectId
			);
			if (acDeleteError) return `受入基準削除エラー (${req.id}): ${acDeleteError}`;

			const acceptanceInputs = acceptanceCriteriaJsonToInputs(
				req.acceptanceCriteriaJson ?? [],
				req.id,
				projectId
			);
			const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
			if (acError) return `受入基準作成エラー (${req.id}): ${acError}`;
		}

		return changedRequirements;
	} catch (e) {
		return `同期エラー: ${e instanceof Error ? e.message : String(e)}`;
	}
}

/**
 * タスク基本情報をDBに同期する
 * @param taskId タスクID
 * @param taskName タスク名
 * @param taskSummary タスク概要
 * @param businessContext 業務コンテキスト
 * @param processSteps タスク内の流れ（YAML）
 * @param person 担当者
 * @param input インプット
 * @param output アウトプット
 * @param conceptIdsYaml 関連概念ID（YAML）
 * @returns エラーメッセージ（失敗時）、成功時はnull
 */
export async function syncTaskBasicInfo(
	taskId: string,
	taskName: string,
	taskSummary: string,
	businessContext: string,
	processSteps: string,
	person: string,
	input: string,
	output: string,
	conceptIdsYaml: string,
	projectId: string,
): Promise<string | null> {
	try {
		const { updateTask, getTaskById } = await import("@/lib/data/tasks");

		// 既存タスクを取得して businessId と sortOrder を維持
		const { data: existingTask, error: fetchError } = await getTaskById(taskId, projectId);
		if (fetchError) return `タスク取得エラー: ${fetchError}`;
		if (!existingTask) return `タスクが見つかりません: ${taskId}`;

		const { error } = await updateTask(taskId, {
			businessId: existingTask.businessId, // 既存値を維持
			name: taskName,
			summary: taskSummary,
			businessContext,
			processSteps,
			person,
			input,
			output,
			conceptIdsYaml,
			concepts: existingTask.concepts, // 既存値を維持
			sortOrder: existingTask.sortOrder, // 既存値を維持
		}, projectId);

		if (error) return `タスク更新エラー: ${error}`;
		return null;
	} catch (e) {
		return `同期エラー: ${e instanceof Error ? e.message : String(e)}`;
	}
}

/**
 * BR↔SRリンクをrequirement_linksテーブルに同期する（Phase 3）
 * @param systemRequirements システム要件配列（businessRequirementIdsを含む）
 * @param projectId プロジェクトID
 * @returns エラーメッセージ（失敗時）、成功時はnull
 */
export async function syncBrSrLinksToRequirementLinks(
	systemRequirements: Array<{ id: string; businessRequirementIds: string[] }>,
	projectId: string
): Promise<string | null> {
	try {
		// 各SRについて、既存リンクを削除して新規リンクを挿入
		for (const sr of systemRequirements) {
			// 1. このSRをsourceとする既存リンクをすべて削除
			const { error: deleteError } = await deleteRequirementLinksBySource("sr", sr.id, projectId);
			if (deleteError) {
				console.error(`[syncBrSrLinksToRequirementLinks] リンク削除エラー (SR: ${sr.id}):`, deleteError);
				return `リンク削除エラー (SR: ${sr.id}): ${deleteError}`;
			}

			// 2. 新規リンクを作成（SR→BRの関係）
			if (sr.businessRequirementIds.length > 0) {
				const linkInputs: RequirementLinkCreateInput[] = sr.businessRequirementIds.map((brId) => ({
					projectId,
					sourceType: "sr",
					sourceId: sr.id,
					targetType: "br",
					targetId: brId,
					linkType: "derived_from",
					suspect: false,
				}));

				const { error: createError } = await createRequirementLinks(linkInputs);
				if (createError) {
					console.error(`[syncBrSrLinksToRequirementLinks] リンク作成エラー (SR: ${sr.id}):`, createError);
					return `リンク作成エラー (SR: ${sr.id}): ${createError}`;
				}
			}
		}

		console.log(`[syncBrSrLinksToRequirementLinks] 同期完了: ${systemRequirements.length}件のSRに対するリンクを更新`);
		return null;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		console.error(`[syncBrSrLinksToRequirementLinks] 同期エラー:`, message);
		return `リンク同期エラー: ${message}`;
	}
}
