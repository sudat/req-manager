import { validateEntryPoints } from "./entry-points";
import { validateYaml } from "@/lib/utils/yaml";
import type { EntryPoint } from "@/lib/domain";
import type { ImplUnitSdDraft } from "@/components/forms/impl-unit-sd-list";

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
 * 実装単位SDをバリデーション
 */
export function validateImplUnitSds(
	implUnitSds: ImplUnitSdDraft[]
): string | null {
	for (const unit of implUnitSds) {
		if (!unit.name.trim()) {
			return `実装単位SD（${unit.id}）の名称は必須です。`;
		}
		if (!unit.summary.trim()) {
			return `実装単位SD（${unit.id}）の概要は必須です。`;
		}
		if (unit.entryPoints.length === 0) {
			return `実装単位SD（${unit.id}）のエントリポイントは必須です。`;
		}
		const unitEntryError = validateEntryPoints(unit.entryPoints);
		if (unitEntryError) {
			return `実装単位SD（${unit.id}）: ${unitEntryError}`;
		}
		const yamlDiag = validateYaml(unit.detailsYaml);
		if (!yamlDiag.ok) {
			return `実装単位SD（${unit.id}）: ${yamlDiag.message ?? "detailsのYAMLが不正です。"}`;
		}
	}
	return null;
}
