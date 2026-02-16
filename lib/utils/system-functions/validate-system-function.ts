import { validateEntryPoints } from "./entry-points";
import { structuredDesignDocumentSpecSchema } from "@/lib/domain/schemas/design-document-structured";
import type { EntryPoint } from "@/lib/domain";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";

/**
 * システム機能の基本フィールドをバリデーション
 */
export function validateSystemFunctionBasic(data: {
	title?: string;
	summary?: string;
}): string | null {
	if (!data.title?.trim()) {
		return "タイトルは必須です。";
	}
	if (!data.summary?.trim()) {
		return "概要は必須です。";
	}
	return null;
}

/**
 * エントリポイントをバリデーション
 */
export function validateSystemFunctionEntryPoints(
	entryPoints: EntryPoint[]
): string | null {
	return validateEntryPoints(entryPoints);
}

/**
 * DDをバリデーション
 */
export function validateDesignDocuments(
	designDocuments: DesignDocumentDraft[]
): string | null {
	const validDdIds = new Set(designDocuments.map((unit) => unit.id));

	for (const unit of designDocuments) {
		if (!unit.name.trim()) {
			return `DD（${unit.id}）の名称は必須です。`;
		}
		if (!unit.summary.trim()) {
			return `DD（${unit.id}）の概要は必須です。`;
		}
		if (unit.entryPoints.length === 0) {
			return `DD（${unit.id}）のエントリポイントは必須です。`;
		}
		const unitEntryError = validateEntryPoints(unit.entryPoints);
		if (unitEntryError) {
			return `DD（${unit.id}）: ${unitEntryError}`;
		}
		if (unit.structuredSpec) {
			const result = structuredDesignDocumentSpecSchema.safeParse(unit.structuredSpec);
			if (!result.success) {
				const firstIssue = result.error.issues[0];
				const issuePath = firstIssue?.path?.join(".") || "structuredSpec";
				return `DD（${unit.id}）: 構造化設計が不正です（${issuePath}: ${firstIssue?.message ?? "unknown"}）`;
			}
		}

		const dependencyKeys = new Set<string>();
		for (const dependency of unit.dependencies ?? []) {
			if (!validDdIds.has(dependency.targetDdId)) {
				return `DD（${unit.id}）: 呼び出し先DD（${dependency.targetDdId}）が存在しません。`;
			}
			if (dependency.targetDdId === unit.id) {
				return `DD（${unit.id}）: 自己参照の呼び出し依存は設定できません。`;
			}
			const key = `${dependency.targetDdId}:${dependency.callType}`;
			if (dependencyKeys.has(key)) {
				return `DD（${unit.id}）: 呼び出し依存が重複しています（${dependency.targetDdId}/${dependency.callType}）。`;
			}
			dependencyKeys.add(key);
		}
	}
	return null;
}
