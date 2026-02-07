import { validateEntryPoints } from "./entry-points";
import { validateYaml } from "@/lib/utils/yaml";
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
		const yamlDiag = validateYaml(unit.detailsYaml);
		if (!yamlDiag.ok) {
			return `DD（${unit.id}）: ${yamlDiag.message ?? "detailsのYAMLが不正です。"}`;
		}
		if (unit.structuredSpec) {
			const result = structuredDesignDocumentSpecSchema.safeParse(unit.structuredSpec);
			if (!result.success) {
				const firstIssue = result.error.issues[0];
				const issuePath = firstIssue?.path?.join(".") || "structuredSpec";
				return `DD（${unit.id}）: 構造化設計が不正です（${issuePath}: ${firstIssue?.message ?? "unknown"}）`;
			}
		}
	}
	return null;
}
