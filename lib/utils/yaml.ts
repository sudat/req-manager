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
	const { value, error } = parseYamlValue<unknown>(src);
	if (!value) return { value: [], error };

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
		return { value: [], error };
	}

	const items = listValue.map((entry) => {
		if (typeof entry === "string") {
			return { when: "", who: "", action: entry };
		}
		if (entry && typeof entry === "object") {
			const obj = entry as Record<string, unknown>;
			const rawException = obj.exception;
			let exception: ProcessStepItem["exception"] | undefined;
			if (rawException && typeof rawException === "object") {
				const exceptionObj = rawException as Record<string, unknown>;
				const condition = exceptionObj.condition
					? String(exceptionObj.condition)
					: "";
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
		return { when: "", who: "", action: "" };
	});

	return { value: items, error };
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
