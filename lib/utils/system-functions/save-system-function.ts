import { updateSystemFunction } from "@/lib/data/system-functions";
import {
	deleteSystemRequirementsBySrfId,
	createSystemRequirements,
	listSystemRequirementsBySrfId,
} from "@/lib/data/system-requirements";
import {
	deleteDesignDocumentsBySrfId,
	createDesignDocuments,
	listDesignDocuments,
	listDesignDocumentsBySrfId,
} from "@/lib/data/design-documents";
import {
	createAcceptanceCriteria,
	acceptanceCriteriaJsonToInputs,
} from "@/lib/data/acceptance-criteria";
import { syncBrSrLinksToRequirementLinks } from "@/lib/data/task-sync";
import { syncDdDependenciesForSrf, syncDdCallersForSrf } from "@/lib/data/requirement-links";
import { normalizeEntryPointsInput } from "./entry-points";
import { composeStructuredDetails } from "@/lib/utils/design-documents/structured-compat";
import { structuredDesignDocumentSpecSchema } from "@/lib/domain/schemas/design-document-structured";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";
import type { SequenceStep } from "@/lib/domain/schemas/sequence";
import type { Requirement } from "@/lib/domain/forms";
import type { SystemDesignItem, EntryPoint, CodeRef, DesignDocument } from "@/lib/domain";
import type { SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { SystemFunction, SrfCategory, SrfStatus } from "@/lib/domain";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import type { DdDependencyLink, DdCallerLink } from "@/lib/domain/dd-dependency";

type SaveSystemFunctionInput = {
	srfId: string;
	existingSrf: SystemFunction;
	systemDomainId: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;
	designPolicy: string;
	designItemsV2: SystemDesignItemV2[];
	systemDesign: SystemDesignItem[];
	entryPoints: EntryPoint[];
	designDocuments: DesignDocumentDraft[];
	codeRefs: CodeRef[];
	systemRequirements: Requirement[];
	projectId: string;
};

function collectDdDependencyLinks(designDocuments: DesignDocumentDraft[]): DdDependencyLink[] {
  const validDdIdSet = new Set(designDocuments.map((dd) => dd.id));
  const uniqueKeys = new Set<string>();
  const dependencies: DdDependencyLink[] = [];
  const callTypeMap = {
    sync: "calls_sync",
    async: "calls_async",
  } as const;

  const pushDependency = (dependency: DdDependencyLink) => {
    if (!validDdIdSet.has(dependency.sourceDdId)) return;
    if (!validDdIdSet.has(dependency.targetDdId)) return;
    if (dependency.sourceDdId === dependency.targetDdId) return;

    const key = `${dependency.sourceDdId}:${dependency.targetDdId}:${dependency.callType}:${dependency.callId ?? ""}`;
    if (uniqueKeys.has(key)) return;
    uniqueKeys.add(key);
    dependencies.push(dependency);
  };

  const collectFromSequenceSteps = (
    sourceDdId: string,
    steps: SequenceStep[] | undefined
  ) => {
    if (!steps || steps.length === 0) return;
    for (const step of steps) {
      if (step.kind === "call") {
        pushDependency({
          sourceDdId,
          targetDdId: step.targetDdId,
          callType: callTypeMap[step.callType],
          callId: step.id,
          message: step.message,
          returnsLabel: step.returnLabel,
          returnSchemaRef: step.returnSchemaRef,
          errorLabel: step.errorLabel,
          errorSchemaRef: step.errorSchemaRef,
          errorExceptionRef: step.errorExceptionRef,
          ruleRef: step.ruleRef,
          asyncCompletion: step.asyncCompletion,
        });
        continue;
      }

      if (step.kind === "fragment") {
        for (const branch of step.branches) {
          collectFromSequenceSteps(sourceDdId, branch.steps);
        }
      }
    }
  };

  for (const sourceDd of designDocuments) {
    for (const dependency of sourceDd.dependencies ?? []) {
      pushDependency({
        sourceDdId: sourceDd.id,
        targetDdId: dependency.targetDdId,
        callType: dependency.callType,
        callId: dependency.callId,
        message: dependency.message,
        returnsLabel: dependency.returnsLabel,
        returnSchemaRef: dependency.returnSchemaRef,
        errorLabel: dependency.errorLabel,
        errorSchemaRef: dependency.errorSchemaRef,
        errorExceptionRef: dependency.errorExceptionRef,
        ruleRef: dependency.ruleRef,
        asyncCompletion: dependency.asyncCompletion,
      });
    }

    if (sourceDd.structuredSpec?.sequence?.mode === "guided") {
      collectFromSequenceSteps(sourceDd.id, sourceDd.structuredSpec.sequence.steps);
    }
  }

  return dependencies;
}

function collectDdCallerLinks(designDocuments: DesignDocumentDraft[]): DdCallerLink[] {
	const validDdIdSet = new Set(designDocuments.map((dd) => dd.id));
	const uniqueKeys = new Set<string>();
	const callers: DdCallerLink[] = [];

	for (const targetDd of designDocuments) {
		for (const caller of targetDd.callers ?? []) {
			if (!validDdIdSet.has(targetDd.id)) continue;

			if (caller.callerType === "user") {
				// ユーザー起動の場合
				const key = `user:${targetDd.id}`;
				if (uniqueKeys.has(key)) continue;
				uniqueKeys.add(key);

				callers.push({
					targetDdId: targetDd.id,
					callerType: "user",
				});
			} else if (caller.callerType === "system") {
				// システム起動の場合
				if (!caller.callerDdId || !caller.callType) continue;
				// callerDdId の有効性チェックはsyncDdCallersForSrf側で行われる
				if (caller.callerDdId === targetDd.id) continue; // 自己参照を除外

				const key = `${caller.callerDdId}:${targetDd.id}:${caller.callType}`;
				if (uniqueKeys.has(key)) continue;
				uniqueKeys.add(key);

				callers.push({
					targetDdId: targetDd.id,
					callerType: "system",
					callerDdId: caller.callerDdId,
					callType: caller.callType,
				});
			}
		}
	}

	return callers;
}

function collectMissingSideEffectRuleRefErrors(
	spec: StructuredDesignDocumentSpec
): string[] {
	const errors: string[] = [];

	const validate = <T extends { ruleRef?: string }>(
		items: T[] | undefined,
		pathKey: "dbOperations" | "externalApiCalls" | "events" | "fileOutputs"
	) => {
		for (const [index, item] of (items ?? []).entries()) {
			if (item.ruleRef?.trim()) continue;
			errors.push(
				`sideEffects.${pathKey}.${index}.ruleRef: 副作用を呼び出すルール（coreLogic.rules[].name）を指定してください`
			);
		}
	};

	validate(spec.sideEffects.dbOperations, "dbOperations");
	validate(spec.sideEffects.externalApiCalls, "externalApiCalls");
	validate(spec.sideEffects.events, "events");
	validate(spec.sideEffects.fileOutputs, "fileOutputs");

	return errors;
}

type ModelRelationMapping = {
	source: string;
	target: string;
};

type ModelRelationInfo = {
	type: string;
	target: string;
	columnMappings: ModelRelationMapping[];
};

type ModelDefinition = {
	ddId: string;
	entityName: string;
	attributeNames: Set<string>;
	relationships: ModelRelationInfo[];
};

export type ModelRelationIntegrityIssue = {
	ddId: string;
	path: string;
	message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseColumnMappings(value: unknown): ModelRelationMapping[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter(isRecord)
		.map((mapping) => ({
			source: typeof mapping.source === "string" ? mapping.source.trim() : "",
			target: typeof mapping.target === "string" ? mapping.target.trim() : "",
		}))
		.filter((mapping) => mapping.source.length > 0 && mapping.target.length > 0);
}

function parseModelDefinitionFromStoredDd(dd: DesignDocument): ModelDefinition | null {
	if (dd.type !== "model") return null;
	if (!isRecord(dd.details)) return null;
	if (!isRecord(dd.details.typeDetail)) return null;

	const typeDetail = dd.details.typeDetail;
	const entityName = typeof typeDetail.entityName === "string" ? typeDetail.entityName.trim() : "";
	if (!entityName) return null;

	const attributeNames = new Set(
		(Array.isArray(typeDetail.attributes) ? typeDetail.attributes : [])
			.filter(isRecord)
			.map((attribute) => (typeof attribute.name === "string" ? attribute.name.trim() : ""))
			.filter((name): name is string => Boolean(name))
	);

	const relationships = (Array.isArray(typeDetail.relationships) ? typeDetail.relationships : [])
		.filter(isRecord)
		.map((relationship) => ({
			type: typeof relationship.type === "string" ? relationship.type : "",
			target: typeof relationship.target === "string" ? relationship.target.trim() : "",
			columnMappings: parseColumnMappings(relationship.columnMappings),
		}))
		.filter((relationship) => relationship.target.length > 0);

	return {
		ddId: dd.id,
		entityName,
		attributeNames,
		relationships,
	};
}

function parseModelDefinitionFromDraft(dd: DesignDocumentDraft): ModelDefinition | null {
	if (dd.type !== "model") return null;
	if (!dd.structuredSpec || dd.structuredSpec.ioType !== "model") return null;
	if (!dd.structuredSpec.typeDetail || dd.structuredSpec.typeDetail.ioType !== "model") return null;

	const typeDetail = dd.structuredSpec.typeDetail;
	const entityName = typeDetail.entityName?.trim() ?? "";
	if (!entityName) return null;

	const attributeNames = new Set(
		(typeDetail.attributes ?? [])
			.map((attribute) => attribute.name?.trim() ?? "")
			.filter((name): name is string => Boolean(name))
	);

	const relationships = (typeDetail.relationships ?? [])
		.map((relationship) => ({
			type: relationship.type,
			target: relationship.target.trim(),
			columnMappings: (relationship.columnMappings ?? [])
				.map((mapping) => ({
					source: mapping.source.trim(),
					target: mapping.target.trim(),
				}))
				.filter((mapping) => mapping.source.length > 0 && mapping.target.length > 0),
		}))
		.filter((relationship) => relationship.target.length > 0);

	return {
		ddId: dd.id,
		entityName,
		attributeNames,
		relationships,
	};
}

export function collectModelRelationIntegrityIssues(
	currentDrafts: DesignDocumentDraft[],
	allProjectDesignDocuments: DesignDocument[]
): ModelRelationIntegrityIssue[] {
	const issues: ModelRelationIntegrityIssue[] = [];
	const currentDraftIds = new Set(currentDrafts.map((dd) => dd.id));
	const currentDraftModels = currentDrafts
		.map((dd) => parseModelDefinitionFromDraft(dd))
		.filter((definition): definition is ModelDefinition => Boolean(definition));

	const existingModels = allProjectDesignDocuments
		.filter((dd) => !currentDraftIds.has(dd.id))
		.map((dd) => parseModelDefinitionFromStoredDd(dd))
		.filter((definition): definition is ModelDefinition => Boolean(definition));

	const modelDefinitions = [...existingModels, ...currentDraftModels];
	const entityNameMap = new Map<string, ModelDefinition[]>();
	for (const definition of modelDefinitions) {
		const sameEntityDefinitions = entityNameMap.get(definition.entityName) ?? [];
		sameEntityDefinitions.push(definition);
		entityNameMap.set(definition.entityName, sameEntityDefinitions);
	}

	for (const definition of currentDraftModels) {
		const sameEntityDefinitions = entityNameMap.get(definition.entityName) ?? [];
		if (sameEntityDefinitions.length > 1) {
			issues.push({
				ddId: definition.ddId,
				path: "typeDetail.entityName",
				message: `entityName '${definition.entityName}' が複数DDで重複しています`,
			});
		}

		for (const [relIndex, relationship] of definition.relationships.entries()) {
			const targetDefinitions = entityNameMap.get(relationship.target) ?? [];
			const targetPath = `typeDetail.relationships.${relIndex}.target`;

			if (targetDefinitions.length === 0) {
				issues.push({
					ddId: definition.ddId,
					path: targetPath,
					message: `target '${relationship.target}' に対応する model が存在しません`,
				});
				continue;
			}

			if (targetDefinitions.length > 1) {
				issues.push({
					ddId: definition.ddId,
					path: targetPath,
					message: `target '${relationship.target}' が複数DDに存在し参照先を特定できません`,
				});
				continue;
			}

			const targetDefinition = targetDefinitions[0];
			if (relationship.type === "N:M") continue;

			for (const [mappingIndex, mapping] of relationship.columnMappings.entries()) {
				if (!definition.attributeNames.has(mapping.source)) {
					issues.push({
						ddId: definition.ddId,
						path: `typeDetail.relationships.${relIndex}.columnMappings.${mappingIndex}.source`,
						message: `source '${mapping.source}' は自モデルの attributes に存在しません`,
					});
				}

				if (!targetDefinition.attributeNames.has(mapping.target)) {
					issues.push({
						ddId: definition.ddId,
						path: `typeDetail.relationships.${relIndex}.columnMappings.${mappingIndex}.target`,
						message: `target '${mapping.target}' は参照先 '${relationship.target}' の attributes に存在しません`,
					});
				}
			}
		}
	}

	return issues;
}

/**
 * 基本情報のみを保存（SR/DDは既存データを維持）
 */
export async function saveBasicInfo(input: {
	srfId: string;
	existingSrf: SystemFunction;
	systemDomainId: string;
	category: SrfCategory;
	status: SrfStatus;
	title: string;
	summary: string;
	designPolicy: string;
	projectId: string;
}): Promise<{ error: string | null }> {
	const {
		srfId,
		existingSrf,
		systemDomainId,
		category,
		status,
		title,
		summary,
		designPolicy,
		projectId,
	} = input;

	// 既存のSR/DD/entryPoints/codeRefsは維持
	const { error: saveError } = await updateSystemFunction(
		srfId,
		{
			systemDomainId,
			category,
			status,
			title,
			summary,
			designPolicy,
			relatedTaskIds: existingSrf.relatedTaskIds ?? [],
			requirementIds: existingSrf.requirementIds ?? [],
			systemDesign: existingSrf.systemDesign ?? [],
			entryPoints: existingSrf.entryPoints ?? [],
			codeRefs: existingSrf.codeRefs ?? [],
		},
		projectId
	);

	if (saveError) {
		return { error: saveError };
	}

	return { error: null };
}

/**
 * システム要件のみを保存（基本情報/DDは触らない）
 */
export async function saveSystemRequirements(input: {
	srfId: string;
	existingSrf: SystemFunction;
	systemDomainId: string;
	systemRequirements: Requirement[];
	projectId: string;
}): Promise<{ error: string | null }> {
	const { srfId, existingSrf, systemDomainId, systemRequirements, projectId } = input;

	// 1. 既存SRのIDを取得（リンク削除用）
	const { data: existingSystemReqs, error: existingSrError } =
		await listSystemRequirementsBySrfId(srfId, projectId);
	if (existingSrError) {
		return { error: existingSrError };
	}
	const existingSrIds = (existingSystemReqs ?? []).map((req) => req.id);

	// 2. システム要件を保存（既存削除 + 再作成）
	await deleteSystemRequirementsBySrfId(srfId, projectId);

	if (systemRequirements.length > 0) {
		const sysReqInputs = systemRequirements.map((req, index) => ({
			id: req.id,
			taskId: req.taskId || "",
			srfIds: [srfId],
			title: req.title,
			summary: req.summary,
			conceptIds: req.conceptIds,
			impacts: [],
			category: req.category,
			acceptanceCriteriaJson: req.acceptanceCriteriaJson,
			acceptanceCriteria: req.acceptanceCriteria,
			systemDomainIds: req.systemDomainIds,
			sortOrder: index,
			projectId,
		}));

		const { error: sysReqError } = await createSystemRequirements(sysReqInputs);
		if (sysReqError) {
			return { error: sysReqError };
		}
	}

	// 3. 受入基準を保存
	const acceptanceInputs = systemRequirements.flatMap((req) =>
		acceptanceCriteriaJsonToInputs(req.acceptanceCriteriaJson ?? [], req.id, projectId)
	);
	const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
	if (acError) {
		return { error: acError };
	}

	// 4. requirement_linksにSR↔BRリンクを同期
	const linkError = await syncBrSrLinksToRequirementLinks(
		systemRequirements.map((req) => ({
			id: req.id,
			businessRequirementIds: req.businessRequirementIds ?? [],
		})),
		projectId,
		{ deleteSourceIds: existingSrIds }
	);
	if (linkError) {
		return { error: `リンク同期エラー: ${linkError}` };
	}

	// 5. system_functionsのrequirementIdsを更新
	const { error: updateError } = await updateSystemFunction(
		srfId,
		{
			systemDomainId,
			category: existingSrf.category,
			status: existingSrf.status,
			title: existingSrf.title,
			summary: existingSrf.summary,
			designPolicy: existingSrf.designPolicy,
			relatedTaskIds: existingSrf.relatedTaskIds ?? [],
			requirementIds: systemRequirements.map((req) => req.id),
			systemDesign: existingSrf.systemDesign ?? [],
			entryPoints: existingSrf.entryPoints ?? [],
			codeRefs: existingSrf.codeRefs ?? [],
		},
		projectId
	);

	if (updateError) {
		return { error: updateError };
	}

	return { error: null };
}

/**
 * DDのみを保存（基本情報/SRは触らない）
 */
export async function saveDesignDocuments(input: {
	srfId: string;
	designDocuments: DesignDocumentDraft[];
	projectId: string;
}): Promise<{ error: string | null }> {
	const { srfId, designDocuments, projectId } = input;

	// === zodバリデーション ===
	const validationErrors: string[] = [];

	for (const [index, dd] of designDocuments.entries()) {
		if (dd.type === "model" && !dd.structuredSpec) {
			validationErrors.push(
				`DD「${dd.name}」(${index + 1}件目): structuredSpec: model は構造化設計データの入力が必須です`
			);
			continue;
		}

		if (dd.structuredSpec) {
			const result = structuredDesignDocumentSpecSchema.safeParse(dd.structuredSpec);
			if (!result.success) {
				const issues = result.error.issues
					.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
					.join(", ");
				validationErrors.push(`DD「${dd.name}」(${index + 1}件目): ${issues}`);
			} else {
				const ruleRefErrors = collectMissingSideEffectRuleRefErrors(result.data);
				if (ruleRefErrors.length > 0) {
					validationErrors.push(
						`DD「${dd.name}」(${index + 1}件目): ${ruleRefErrors.join(", ")}`
					);
				}
			}
		}
	}

	if (validationErrors.length > 0) {
		return {
			error: `構造化設計書のバリデーションエラーが発生しました:\n${validationErrors.join("\n")}`,
		};
	}

	const { data: allProjectDds, error: allProjectDdsError } = await listDesignDocuments(projectId);
	if (allProjectDdsError) {
		return { error: allProjectDdsError };
	}

	const modelIntegrityIssues = collectModelRelationIntegrityIssues(
		designDocuments,
		allProjectDds ?? []
	);

	if (modelIntegrityIssues.length > 0) {
		const ddIndexMap = new Map(designDocuments.map((dd, index) => [dd.id, index]));
		const ddNameMap = new Map(designDocuments.map((dd) => [dd.id, dd.name]));
		for (const issue of modelIntegrityIssues) {
			const index = ddIndexMap.get(issue.ddId) ?? -1;
			const name = ddNameMap.get(issue.ddId) ?? issue.ddId;
			const indexLabel = index >= 0 ? `${index + 1}件目` : "保存対象";
			validationErrors.push(`DD「${name}」(${indexLabel}): ${issue.path}: ${issue.message}`);
		}
	}

	if (validationErrors.length > 0) {
		return {
			error: `構造化設計書のバリデーションエラーが発生しました:\n${validationErrors.join("\n")}`,
		};
	}
	// === バリデーションここまで ===

	// 既存DD IDを取得（依存リンク削除対象の特定）
	const { data: existingDDs, error: existingDdError } =
		await listDesignDocumentsBySrfId(srfId, projectId);
	if (existingDdError) {
		return { error: existingDdError };
	}
	const existingDdIds = (existingDDs ?? []).map((dd) => dd.id);

	// 1. DDを保存（既存削除 + 再作成）
	const { error: implDeleteError } = await deleteDesignDocumentsBySrfId(srfId, projectId);
	if (implDeleteError) {
		return { error: implDeleteError };
	}

	if (designDocuments.length > 0) {
		const implInputs = designDocuments.map((unit) => ({
			id: unit.id,
			srfId,
			name: unit.name.trim(),
			type: unit.type || "screen",
			summary: unit.summary.trim(),
			entryPoints: normalizeEntryPointsInput(unit.entryPoints),
			designPolicy: unit.designPolicy.trim(),
			details: composeStructuredDetails(unit.structuredSpec),
			projectId,
		}));
		const { error: implError } = await createDesignDocuments(implInputs);
		if (implError) {
			return { error: implError };
		}
	}

	const validDdIds = designDocuments.map((dd) => dd.id);
	const sourceDdIdsToReset = Array.from(new Set([...existingDdIds, ...validDdIds]));
	const dependencies = collectDdDependencyLinks(designDocuments);

	const { error: dependencySyncError } = await syncDdDependenciesForSrf({
		projectId,
		sourceDdIdsToReset,
		validDdIds,
		dependencies,
	});
	if (dependencySyncError) {
		return { error: `DD依存リンク同期エラー: ${dependencySyncError}` };
	}

	// 呼び出し元（受信方向）の同期
	const targetDdIdsToReset = Array.from(new Set([...existingDdIds, ...validDdIds]));
	const callers = collectDdCallerLinks(designDocuments);

	const { error: callerSyncError } = await syncDdCallersForSrf({
		projectId,
		targetDdIdsToReset,
		validDdIds,
		callers,
	});
	if (callerSyncError) {
		return { error: `DD呼び出し元リンク同期エラー: ${callerSyncError}` };
	}

	return { error: null };
}

/**
 * システム機能とその関連データを保存（旧関数: 非推奨）
 * @deprecated 分割された saveBasicInfo / saveSystemRequirements / saveDesignDocuments を使用してください
 */
export async function saveSystemFunction(
	input: SaveSystemFunctionInput
): Promise<{ error: string | null }> {
	const {
		srfId,
		existingSrf,
		systemDomainId,
		category,
		status,
		title,
		summary,
		designPolicy,
		designItemsV2,
		systemDesign,
		entryPoints,
		designDocuments,
		codeRefs,
		systemRequirements,
		projectId,
	} = input;

	const normalizedEntryPoints = normalizeEntryPointsInput(entryPoints);

	// V2とレガシーをマージ
	const mergedDesignItems = [...designItemsV2, ...systemDesign];

	// 1. システム機能を更新
	const { error: saveError } = await updateSystemFunction(
		srfId,
		{
			systemDomainId,
			category,
			status,
			title,
			summary,
			designPolicy,
			relatedTaskIds: existingSrf.relatedTaskIds ?? [],
			requirementIds: systemRequirements.map((req) => req.id),
			systemDesign: mergedDesignItems,
			entryPoints: normalizedEntryPoints,
			codeRefs,
		},
		projectId
	);

	if (saveError) {
		return { error: saveError };
	}

	// 2. 既存SRのIDを取得（リンク削除用）
	const { data: existingSystemReqs, error: existingSrError } =
		await listSystemRequirementsBySrfId(srfId, projectId);
	if (existingSrError) {
		return { error: existingSrError };
	}
	const existingSrIds = (existingSystemReqs ?? []).map((req) => req.id);

	// 3. システム要件を保存（既存削除 + 再作成）
	await deleteSystemRequirementsBySrfId(srfId, projectId);

	if (systemRequirements.length > 0) {
		const sysReqInputs = systemRequirements.map((req, index) => ({
			id: req.id,
			taskId: req.taskId || "",
			srfIds: [srfId],
			title: req.title,
			summary: req.summary,
			conceptIds: req.conceptIds,
			impacts: [],
			category: req.category,
			acceptanceCriteriaJson: req.acceptanceCriteriaJson,
			acceptanceCriteria: req.acceptanceCriteria,
			systemDomainIds: req.systemDomainIds,
			sortOrder: index,
			projectId,
		}));

		const { error: sysReqError } = await createSystemRequirements(sysReqInputs);
		if (sysReqError) {
			return { error: sysReqError };
		}
	}

	// 4. 受入基準を保存
	const acceptanceInputs = systemRequirements.flatMap((req) =>
		acceptanceCriteriaJsonToInputs(req.acceptanceCriteriaJson ?? [], req.id, projectId)
	);
	const { error: acError } = await createAcceptanceCriteria(acceptanceInputs);
	if (acError) {
		return { error: acError };
	}

	// 5. DDの既存IDを取得（依存リンク削除対象の特定）
	const { data: existingDDs, error: existingDdError } =
		await listDesignDocumentsBySrfId(srfId, projectId);
	if (existingDdError) {
		return { error: existingDdError };
	}
	const existingDdIds = (existingDDs ?? []).map((dd) => dd.id);

	// 5. DDを保存（既存削除 + 再作成）
	const { error: implDeleteError } = await deleteDesignDocumentsBySrfId(srfId, projectId);
	if (implDeleteError) {
		return { error: implDeleteError };
	}

	if (designDocuments.length > 0) {
		const implInputs = designDocuments.map((unit) => ({
			id: unit.id,
			srfId,
			name: unit.name.trim(),
			type: unit.type || "screen",
			summary: unit.summary.trim(),
			entryPoints: normalizeEntryPointsInput(unit.entryPoints),
			designPolicy: unit.designPolicy.trim(),
			details: composeStructuredDetails(unit.structuredSpec),
			projectId,
		}));
		const { error: implError } = await createDesignDocuments(implInputs);
		if (implError) {
			return { error: implError };
		}
	}

	const validDdIds = designDocuments.map((dd) => dd.id);
	const sourceDdIdsToReset = Array.from(new Set([...existingDdIds, ...validDdIds]));
	const dependencies = collectDdDependencyLinks(designDocuments);

	const { error: dependencySyncError } = await syncDdDependenciesForSrf({
		projectId,
		sourceDdIdsToReset,
		validDdIds,
		dependencies,
	});
	if (dependencySyncError) {
		return { error: `DD依存リンク同期エラー: ${dependencySyncError}` };
	}

	// 6. requirement_linksにSR↔BRリンクを同期
	const linkError = await syncBrSrLinksToRequirementLinks(
		systemRequirements.map((req) => ({
			id: req.id,
			businessRequirementIds: req.businessRequirementIds ?? [],
		})),
		projectId,
		{ deleteSourceIds: existingSrIds }
	);
	if (linkError) {
		return { error: `リンク同期エラー: ${linkError}` };
	}

	return { error: null };
}
