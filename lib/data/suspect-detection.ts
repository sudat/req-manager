import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";
import type { RequirementLink } from "@/lib/domain";

/**
 * SR/BRが変更された時に関連リンクをsuspect=trueにする
 *
 * ## 使用例
 *
 * ```typescript
 * // SRのsummaryが変更された場合
 * await markRelatedLinksSuspect(
 *   "sr-123",
 *   "sr",
 *   "summary",
 *   projectId
 * );
 *
 * // BRのacceptance_criteriaが変更された場合
 * await markRelatedLinksSuspect(
 *   "br-456",
 *   "br",
 *   "acceptance_criteria",
 *   projectId
 * );
 * ```
 *
 * @param changedId - 変更された要件ID
 * @param changeType - 'br' または 'sr'
 * @param fieldName - 変更されたフィールド名
 * @param projectId - プロジェクトID
 * @returns エラーメッセージ（成功時はnull）
 */
export async function markRelatedLinksSuspect(
	changedId: string,
	changeType: "br" | "sr",
	fieldName: string,
	projectId: string
): Promise<string | null> {
	const configError = getSupabaseConfigError();
	if (configError) {
		return configError;
	}

	try {
		const suspectReason = getSuspectReason(changeType, fieldName);

		// sourceまたはtargetがchangedIdに一致するリンクをすべて更新
		// ※ Supabaseのorメソッドの制約により、2つのクエリに分けて実行

		// クエリ1: source_idが一致するリンクを更新
		const { error: sourceError } = await supabase
			.from("requirement_links")
			.update({
				suspect: true,
				suspect_reason: suspectReason,
				updated_at: new Date().toISOString(),
			})
			.eq("source_id", changedId)
			.eq("project_id", projectId);

		if (sourceError) {
			console.error(`[markRelatedLinksSuspect] Source update error:`, sourceError);
			return `疑義リンク更新エラー (source): ${sourceError.message}`;
		}

		// クエリ2: target_idが一致するリンクを更新
		const { error: targetError } = await supabase
			.from("requirement_links")
			.update({
				suspect: true,
				suspect_reason: suspectReason,
				updated_at: new Date().toISOString(),
			})
			.eq("target_id", changedId)
			.eq("project_id", projectId);

		if (targetError) {
			console.error(`[markRelatedLinksSuspect] Target update error:`, targetError);
			return `疑義リンク更新エラー (target): ${targetError.message}`;
		}

		console.log(
			`[markRelatedLinksSuspect] ${changeType.toUpperCase()}(${changedId}) の ${fieldName} 変更により、関連リンクをsuspectに設定: ${suspectReason}`
		);

		return null;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		console.error(`[markRelatedLinksSuspect] Unexpected error:`, message);
		return `疑義検出エラー: ${message}`;
	}
}

/**
 * 疑義理由を生成する（補助関数）
 *
 * @param changeType - 'br' または 'sr'
 * @param fieldName - 変更されたフィールド名
 * @returns 日本語の疑義理由
 */
export function getSuspectReason(
	changeType: "br" | "sr",
	fieldName: string
): string {
	const fieldNameMap: Record<string, string> = {
		title: "タイトル",
		summary: "概要",
		goal: "目標",
		constraints: "制約条件",
		acceptanceCriteria: "受入基準",
		acceptance_criteria: "受入基準",
	};

	const fieldNameJa = fieldNameMap[fieldName] || fieldName;
	const changeTypeJa = changeType === "br" ? "業務要件" : "システム要件";

	return `${changeTypeJa}の${fieldNameJa}が変更されました`;
}

/**
 * 要件の変更を検出し、疑義フラグを立てる必要があるフィールドを判定する
 *
 * @param fieldName - 変更されたフィールド名
 * @returns 疑義フラグを立てる必要がある場合はtrue
 */
export function shouldMarkSuspect(fieldName: string): boolean {
	const suspectFields = [
		"summary",
		"goal",  // hasRequirementChangedで使われているフィールド名に合わせる（単数形）
		"constraints",
		"acceptanceCriteria",
		"acceptance_criteria",
	];

	return suspectFields.includes(fieldName);
}

/**
 * 複数のフィールド変更から疑義フラグを立てる必要があるフィールドを抽出する
 *
 * @param changedFields - 変更されたフィールド名の配列
 * @returns 疑義フラグを立てる必要があるフィールド名の配列
 */
export function extractSuspectFields(changedFields: string[]): string[] {
	return changedFields.filter(shouldMarkSuspect);
}

/**
 * 要件の変更内容を解析し、疑義リンクを更新する
 *
 * ## 使用例
 *
 * ```typescript
 * const existing = existingReqs.find(r => r.id === req.id);
 * if (existing) {
 *   const changedFields = detectChangedFields(req, existing);
 *   await markChangedFieldsSuspect(req.id, changeType, changedFields, projectId);
 * }
 * ```
 *
 * @param requirementId - 変更された要件ID
 * @param changeType - 'br' または 'sr'
 * @param changedFields - 変更されたフィールド名の配列
 * @param projectId - プロジェクトID
 * @returns エラーメッセージ（成功時はnull）
 */
export async function markChangedFieldsSuspect(
	requirementId: string,
	changeType: "br" | "sr",
	changedFields: string[],
	projectId: string
): Promise<string | null> {
	const suspectFields = extractSuspectFields(changedFields);

	if (suspectFields.length === 0) {
		// 疑義フラグを立てる必要があるフィールドがない場合は何もしない
		return null;
	}

	// 最初の疑義フィールドで疑義フラグを立てる
	// （複数フィールドが変更されても、リンク自体は1つのsuspectReasonしか持てないため）
	const firstSuspectField = suspectFields[0];
	return markRelatedLinksSuspect(
		requirementId,
		changeType,
		firstSuspectField,
		projectId
	);
}

/**
 * 2つの要件オブジェクトを比較して、変更されたフィールド名を検出する
 *
 * ## 使用例
 *
 * ```typescript
 * const changedFields = detectChangedFields(editedReq, existingReq);
 * // => ["summary", "acceptanceCriteria"]
 * ```
 *
 * @param edited - 編集後の要件
 * @param existing - 既存の要件
 * @returns 変更されたフィールド名の配列
 */
export function detectChangedFields(
	edited: Record<string, unknown>,
	existing: Record<string, unknown>
): string[] {
	const changedFields: string[] = [];

	const fieldsToCompare = [
		"title",
		"summary",
		"goal",
		"constraints",
		"acceptanceCriteria",
		"acceptance_criteria",
	];

	for (const field of fieldsToCompare) {
		// フィールドが両方のオブジェクトに存在するか確認
		if (!(field in edited) || !(field in existing)) {
			continue;
		}

		const editedValue = edited[field];
		const existingValue = existing[field];

		// 配列やオブジェクトの場合はJSON文字列で比較
		if (
			typeof editedValue === "object" ||
			typeof existingValue === "object"
		) {
			if (JSON.stringify(editedValue) !== JSON.stringify(existingValue)) {
				changedFields.push(field);
			}
		} else {
			if (editedValue !== existingValue) {
				changedFields.push(field);
			}
		}
	}

	return changedFields;
}
