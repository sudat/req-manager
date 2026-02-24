import { parseDocument, stringify } from "yaml";

export type YamlValidationResult = {
	ok: boolean;
	message?: string;
};

export type KeySourceItem = {
	name: string;
	source: string;
};

export type ProcessStepItem = {
	id?: string;
	when: string;
	who: string;
	action: string;
	condition?: string;
	parallel?: string;
	exception?: {
		condition: string;
		to: string;
	};
};

export type ProcessFlowExitType = "next" | "step" | "end";

export type ProcessFlowExit = {
	type: ProcessFlowExitType;
	to?: string;
};

export type ProcessFlowBranch = {
	label: string;
	steps: ProcessStepItem[];
	exit?: ProcessFlowExit;
};

export type ProcessFlowElse = {
	steps: ProcessStepItem[];
	exit?: ProcessFlowExit;
};

export type ProcessFlowBlock =
	| {
			type: "step";
			step: ProcessStepItem;
	  }
	| {
			type: "branch";
			decisionLabel?: string;
			branches: ProcessFlowBranch[];
			else?: ProcessFlowElse;
			defaultExit?: ProcessFlowExit;
	  };

export type ProcessFlowDocument = {
	version: 2;
	blocks: ProcessFlowBlock[];
};

type YamlErrorLike = {
	message?: string;
	linePos?: {
		start?: {
			line?: number;
			col?: number;
		};
	};
};

export const YAML_PARSE_OPTIONS = {
	prettyErrors: true,
	version: "1.2",
	schema: "core",
} as const;

export function validateYaml(src: string): YamlValidationResult {
	try {
		const doc = parseDocument(src, YAML_PARSE_OPTIONS);
		const err = doc.errors?.[0] as YamlErrorLike | undefined;
		if (!err) return { ok: true };

		const line = err.linePos?.start?.line;
		const col = err.linePos?.start?.col;
		const pos = line && col ? `line ${line}, col ${col}` : "";
		const message = [pos, err.message ?? String(err)].filter(Boolean).join(": ");
		return { ok: false, message };
	} catch (e) {
		return {
			ok: false,
			message: e instanceof Error ? e.message : String(e),
		};
	}
}

type YamlParseResult<T> = {
	value: T;
	error: string | null;
};

function parseYamlValue<T>(src: string): YamlParseResult<T | null> {
	if (!src.trim()) return { value: null, error: null };
	const doc = parseDocument(src, YAML_PARSE_OPTIONS);
	if (doc.errors?.length) {
		const err = doc.errors[0] as YamlErrorLike;
		return { value: null, error: err.message ?? "YAML parse error" };
	}
	return { value: doc.toJSON() as T, error: null };
}

function hasProcessStepContent(step: ProcessStepItem): boolean {
	return Boolean(
		step.id?.trim() ||
			step.when.trim() ||
			step.who.trim() ||
			step.action.trim() ||
			step.condition?.trim() ||
			step.parallel?.trim() ||
			step.exception?.condition?.trim() ||
			step.exception?.to?.trim()
	);
}

function normalizeProcessStepItem(entry: unknown): ProcessStepItem {
	if (typeof entry === "string") {
		return { id: "", when: "", who: "", action: entry, condition: "", parallel: "" };
	}
	if (!entry || typeof entry !== "object") {
		return { id: "", when: "", who: "", action: "", condition: "", parallel: "" };
	}

	const obj = entry as Record<string, unknown>;
	const rawException = obj.exception;
	let exception: ProcessStepItem["exception"] | undefined;
	if (rawException && typeof rawException === "object") {
		const exceptionObj = rawException as Record<string, unknown>;
		const condition = exceptionObj.condition ? String(exceptionObj.condition) : "";
		const to = exceptionObj.to ? String(exceptionObj.to) : "";
		if (condition || to) {
			exception = { condition, to };
		}
	}

	return {
		id: obj.id ? String(obj.id) : "",
		when: obj.when ? String(obj.when) : "",
		who: obj.who ? String(obj.who) : "",
		action: obj.action ? String(obj.action) : "",
		condition: obj.condition ? String(obj.condition) : "",
		parallel: obj.parallel ? String(obj.parallel) : "",
		exception,
	};
}

function normalizeProcessFlowExit(raw: unknown): ProcessFlowExit | undefined {
	if (!raw || typeof raw !== "object") return undefined;
	const obj = raw as Record<string, unknown>;
	const rawType = String(obj.type ?? "").trim();
	if (rawType !== "next" && rawType !== "step" && rawType !== "end") {
		return undefined;
	}
	if (rawType === "step") {
		const to = obj.to ? String(obj.to).trim() : "";
		return to ? { type: "step", to } : undefined;
	}
	return { type: rawType };
}

function parseLegacyProcessSteps(value: unknown): ProcessStepItem[] {
	let listValue: unknown = value;
	if (
		value &&
		typeof value === "object" &&
		!Array.isArray(value) &&
		"process_steps" in (value as Record<string, unknown>)
	) {
		listValue = (value as Record<string, unknown>).process_steps;
	}

	if (!Array.isArray(listValue)) {
		return [];
	}
	return listValue.map(normalizeProcessStepItem);
}

function parseFlowBlocks(blocks: unknown): ProcessFlowBlock[] {
	if (!Array.isArray(blocks)) return [];

	return blocks
		.map((rawBlock): ProcessFlowBlock | null => {
			if (!rawBlock || typeof rawBlock !== "object") return null;
			const blockObj = rawBlock as Record<string, unknown>;
			const blockType = String(blockObj.type ?? "").trim();
			if (blockType === "step") {
				return {
					type: "step",
					step: normalizeProcessStepItem(blockObj.step ?? {}),
				};
			}
			if (blockType === "branch") {
				const rawBranches = Array.isArray(blockObj.branches)
					? blockObj.branches
					: [];
				const branches: ProcessFlowBranch[] = [];
				for (const rawBranch of rawBranches) {
					if (!rawBranch || typeof rawBranch !== "object") continue;
					const branchObj = rawBranch as Record<string, unknown>;
					const rawSteps = Array.isArray(branchObj.steps) ? branchObj.steps : [];
					const exit = normalizeProcessFlowExit(branchObj.exit);
					const branch: ProcessFlowBranch = {
						label: branchObj.label ? String(branchObj.label) : "",
						steps: rawSteps.map(normalizeProcessStepItem),
					};
					if (exit) branch.exit = exit;
					branches.push(branch);
				}
				const rawElse = blockObj.else;
				let elseBranch: ProcessFlowElse | undefined;
				if (rawElse && typeof rawElse === "object") {
					const elseObj = rawElse as Record<string, unknown>;
					const rawElseSteps = Array.isArray(elseObj.steps) ? elseObj.steps : [];
					const elseExit = normalizeProcessFlowExit(elseObj.exit);
					if (rawElseSteps.length > 0 || elseExit) {
						elseBranch = {
							steps: rawElseSteps.map(normalizeProcessStepItem),
						};
						if (elseExit) elseBranch.exit = elseExit;
					}
				}
				if (!elseBranch) {
					const legacyDefaultExit = normalizeProcessFlowExit(blockObj.defaultExit);
					if (legacyDefaultExit) {
						elseBranch = {
							steps: [],
							exit: legacyDefaultExit,
						};
					}
				}
				return {
					type: "branch",
					decisionLabel: blockObj.decisionLabel
						? String(blockObj.decisionLabel)
						: "",
					branches,
					else: elseBranch,
				};
			}
			return null;
		})
		.filter((block): block is ProcessFlowBlock => Boolean(block));
}

function normalizeFlowForBuild(flow: ProcessFlowDocument): ProcessFlowDocument {
	const normalizedBlocks = flow.blocks
		.map((block): ProcessFlowBlock | null => {
			if (block.type === "step") {
				const step = normalizeProcessStepItem(block.step);
				return hasProcessStepContent(step)
					? {
							type: "step",
							step,
						}
					: null;
			}
			const branches = block.branches
				.map((branch): ProcessFlowBranch | null => {
					const steps = branch.steps
						.map(normalizeProcessStepItem)
						.filter(hasProcessStepContent);
					const label = branch.label.trim();
					const exit = branch.exit;
					if (steps.length === 0 && !label && !exit) return null;
					const nextBranch: ProcessFlowBranch = {
						label,
						steps,
					};
					if (exit) nextBranch.exit = exit;
					return nextBranch;
				})
				.filter((branch): branch is ProcessFlowBranch => Boolean(branch));
			const decisionLabel = block.decisionLabel?.trim() ?? "";
			const rawElse = block.else
				? block.else
				: block.defaultExit
					? { steps: [], exit: block.defaultExit }
					: undefined;
			const elseSteps = (rawElse?.steps ?? [])
				.map(normalizeProcessStepItem)
				.filter(hasProcessStepContent);
			const elseExit = rawElse?.exit;
			const elseBranch =
				elseSteps.length > 0 || elseExit
					? {
							steps: elseSteps,
							exit: elseExit,
						}
					: undefined;
			if (branches.length === 0 && !decisionLabel && !elseBranch) return null;
			return {
				type: "branch",
				decisionLabel,
				branches,
				else: elseBranch,
			} satisfies ProcessFlowBlock;
		})
		.filter((block): block is ProcessFlowBlock => Boolean(block));

	return {
		version: 2,
		blocks: normalizedBlocks,
	};
}

export function parseYamlProcessFlow(src: string): YamlParseResult<ProcessFlowDocument> {
	const { value, error } = parseYamlValue<unknown>(src);
	if (!value) {
		return {
			value: {
				version: 2,
				blocks: [],
			},
			error,
		};
	}

	if (
		value &&
		typeof value === "object" &&
		!Array.isArray(value) &&
		(value as Record<string, unknown>).version === 2
	) {
		const obj = value as Record<string, unknown>;
		return {
			value: {
				version: 2,
				blocks: parseFlowBlocks(obj.blocks),
			},
			error,
		};
	}

	const legacySteps = parseLegacyProcessSteps(value);
	return {
		value: {
			version: 2,
			blocks: legacySteps.map((step) => ({ type: "step", step })),
		},
		error,
	};
}

export function isProcessFlowV2Yaml(src: string): boolean {
	const { value, error } = parseYamlValue<unknown>(src);
	if (error || !value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}
	const obj = value as Record<string, unknown>;
	return obj.version === 2 && Array.isArray(obj.blocks);
}

export function flattenProcessFlowSteps(flow: ProcessFlowDocument): ProcessStepItem[] {
	const steps: ProcessStepItem[] = [];
	for (const block of flow.blocks) {
		if (block.type === "step") {
			steps.push(block.step);
			continue;
		}
		for (const branch of block.branches) {
			steps.push(...branch.steps);
		}
		if (block.else) {
			steps.push(...block.else.steps);
		}
	}
	return steps;
}

export function buildYamlProcessFlow(flow: ProcessFlowDocument): string {
	const normalized = normalizeFlowForBuild(flow);
	if (normalized.blocks.length === 0) return "";
	try {
		return stringify(normalized, YAML_PARSE_OPTIONS).trim();
	} catch {
		return JSON.stringify(normalized, null, 2);
	}
}

export function parseYamlKeySourceList(src: string): YamlParseResult<KeySourceItem[]> {
	const { value, error } = parseYamlValue<unknown>(src);
	if (!value) return { value: [], error };

	if (!Array.isArray(value)) {
		if (typeof value === "string") {
			return { value: [{ name: value, source: "" }], error };
		}
		return { value: [], error };
	}

	const items = value.map((entry) => {
		if (typeof entry === "string") {
			return { name: entry, source: "" };
		}
		if (entry && typeof entry === "object") {
			const obj = entry as Record<string, unknown>;
			const name = obj.name ? String(obj.name) : "";
			const source = obj.source ? String(obj.source) : obj.destination ? String(obj.destination) : "";
			return { name, source };
		}
		return { name: "", source: "" };
	});

	return { value: items, error };
}

export function parseYamlProcessSteps(src: string): YamlParseResult<ProcessStepItem[]> {
	const parsedFlow = parseYamlProcessFlow(src);
	return {
		value: flattenProcessFlowSteps(parsedFlow.value),
		error: parsedFlow.error,
	};
}

export function buildYamlKeySourceList(items: KeySourceItem[]): string {
	const trimmed = items
		.map((item) => ({
			name: item.name.trim(),
			source: item.source.trim(),
		}))
		.filter((item) => item.name.length > 0 || item.source.length > 0);

	if (trimmed.length === 0) return "";

	try {
		return stringify(trimmed, YAML_PARSE_OPTIONS).trim();
	} catch {
		return JSON.stringify(trimmed, null, 2);
	}
}

export function buildYamlProcessSteps(items: ProcessStepItem[]): string {
	const trimmed = items
		.map((item) => ({
			id: item.id?.trim() ?? "",
			when: item.when.trim(),
			who: item.who.trim(),
			action: item.action.trim(),
			condition: item.condition?.trim() ?? "",
			parallel: item.parallel?.trim() ?? "",
			exceptionCondition: item.exception?.condition?.trim() ?? "",
			exceptionTo: item.exception?.to?.trim() ?? "",
		}))
		.filter(
			(item) =>
				item.id.length > 0 ||
				item.when.length > 0 ||
				item.who.length > 0 ||
				item.action.length > 0 ||
				item.condition.length > 0 ||
				item.parallel.length > 0 ||
				item.exceptionCondition.length > 0 ||
				item.exceptionTo.length > 0
		)
		.map((item) => {
			const entry: Record<string, string | Record<string, string>> = {};
			if (item.id) entry.id = item.id;
			if (item.when) entry.when = item.when;
			if (item.who) entry.who = item.who;
			if (item.action) entry.action = item.action;
			if (item.condition) entry.condition = item.condition;
			if (item.parallel) entry.parallel = item.parallel;
			if (item.exceptionCondition || item.exceptionTo) {
				const exception: Record<string, string> = {};
				if (item.exceptionCondition) exception.condition = item.exceptionCondition;
				if (item.exceptionTo) exception.to = item.exceptionTo;
				entry.exception = exception;
			}
			return entry;
		});

	if (trimmed.length === 0) return "";

	try {
		return stringify(trimmed, YAML_PARSE_OPTIONS).trim();
	} catch {
		return JSON.stringify(trimmed, null, 2);
	}
}

export function parseYamlIdList(src: string): YamlParseResult<string[]> {
	const { value, error } = parseYamlValue<unknown>(src);
	if (!value) return { value: [], error };
	if (Array.isArray(value)) {
		const ids = value.map((entry) => (entry == null ? "" : String(entry))).filter(Boolean);
		return { value: ids, error };
	}
	if (typeof value === "string") return { value: [value], error };
	return { value: [], error };
}

export function parseYamlObject(src: string): Record<string, unknown> {
	if (!src.trim()) return {};
	const doc = parseDocument(src, YAML_PARSE_OPTIONS);
	if (doc.errors?.length) return {};
	const value = doc.toJSON() as unknown;
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	if (Array.isArray(value)) return { items: value };
	return value === null || value === undefined ? {} : { value };
}

export function buildYamlIdList(ids: string[]): string {
	const trimmed = ids.map((id) => id.trim()).filter(Boolean);
	if (trimmed.length === 0) return "";
	try {
		return stringify(trimmed, YAML_PARSE_OPTIONS).trim();
	} catch {
		return JSON.stringify(trimmed, null, 2);
	}
}

export function toYamlText(value: unknown): string {
	if (typeof value === "string") return value;
	if (value === null || value === undefined) return "";
	try {
		return stringify(value, YAML_PARSE_OPTIONS);
	} catch {
		return typeof value === "string" ? value : JSON.stringify(value, null, 2);
	}
}
