/**
 * 階層型エディタ用ユーティリティ
 *
 * YAML/JSONデータを階層型UIで編集するための型定義と変換関数を提供する
 */

import { parseDocument, stringify } from "yaml";

// ============================================================
// 型定義
// ============================================================

/**
 * 階層データの値型
 * discriminated union により型安全に各タイプを扱う
 */
export type HierarchicalValue =
	| { type: "string"; value: string }
	| { type: "number"; value: number }
	| { type: "boolean"; value: boolean }
	| { type: "null"; value: null }
	| { type: "object"; value: HierarchicalNode }
	| { type: "array"; value: HierarchicalValue[] };

/**
 * 階層データのオブジェクトノード
 * キーと値のペアを持つレコード
 */
export interface HierarchicalNode {
	[key: string]: HierarchicalValue;
}

/**
 * 階層データのパス
 * 配列の場合は数値インデックス、オブジェクトの場合は文字列キー
 */
export type HierarchicalPath = (string | number)[];

/**
 * 階層データの編集操作
 */
export type HierarchicalEditOperation =
	| { type: "updateValue"; path: HierarchicalPath; value: unknown }
	| { type: "updateType"; path: HierarchicalPath; newType: HierarchicalValue["type"] }
	| { type: "addKey"; path: HierarchicalPath; key: string; value: HierarchicalValue }
	| { type: "removeKey"; path: HierarchicalPath; key: string }
	| { type: "addArrayItem"; path: HierarchicalPath; index: number; value: HierarchicalValue }
	| { type: "removeArrayItem"; path: HierarchicalPath; index: number }
	| { type: "moveArrayItem"; path: HierarchicalPath; fromIndex: number; toIndex: number };

// ============================================================
// 変換関数: YAML/JSON → HierarchicalValue
// ============================================================

/**
 * JSON文字列を HierarchicalValue に変換する
 * 既存データとの後方互換性のため、JSONパースに失敗した場合はYAMLパースを試す
 */
export function jsonStringToHierarchical(jsonString: string): HierarchicalValue {
	if (!jsonString.trim()) {
		return { type: "null", value: null };
	}

	// まずJSONパースを試みる
	try {
		const jsonValue = JSON.parse(jsonString);
		return jsonToHierarchical(jsonValue);
	} catch {
		// JSONパース失敗ならYAMLパースを試みる（後方互換性）
		return yamlToHierarchical(jsonString);
	}
}

/**
 * YAML文字列を HierarchicalValue に変換する
 * 既存データとの後方互換性のため、YAMLパースをサポート
 */
export function yamlToHierarchical(yamlString: string): HierarchicalValue {
	if (!yamlString.trim()) {
		return { type: "null", value: null };
	}

	try {
		const doc = parseDocument(yamlString, { prettyErrors: true, version: "1.2" });
		if (doc.errors?.length) {
			// パースエラーの場合は文字列として扱う（既存データを保持）
			return { type: "string", value: yamlString };
		}
		const jsonValue = doc.toJSON();
		return jsonToHierarchical(jsonValue);
	} catch {
		// エラーの場合は文字列として扱う（既存データを保持）
		return { type: "string", value: yamlString };
	}
}

/**
 * JSON値を HierarchicalValue に変換する
 */
export function jsonToHierarchical(jsonValue: unknown): HierarchicalValue {
	if (jsonValue === null || jsonValue === undefined) {
		return { type: "null", value: null };
	}

	switch (typeof jsonValue) {
		case "string":
			return { type: "string", value: jsonValue };
		case "number":
			return { type: "number", value: jsonValue };
		case "boolean":
			return { type: "boolean", value: jsonValue };
		case "object": {
			if (Array.isArray(jsonValue)) {
				return {
					type: "array",
					value: jsonValue.map((item) => jsonToHierarchical(item)),
				};
			}
			// 通常のオブジェクト
			const node: HierarchicalNode = {};
			for (const [key, value] of Object.entries(jsonValue)) {
				node[key] = jsonToHierarchical(value);
			}
			return { type: "object", value: node };
		}
		default:
			// その他の型は文字列として扱う
			return { type: "string", value: String(jsonValue) };
	}
}

// ============================================================
// 変換関数: HierarchicalValue → JSON/YAML
// ============================================================

/**
 * HierarchicalValue を JSON値に変換する
 */
export function hierarchicalToJson(hierarchicalValue: HierarchicalValue): unknown {
	switch (hierarchicalValue.type) {
		case "string":
			return hierarchicalValue.value;
		case "number":
			return hierarchicalValue.value;
		case "boolean":
			return hierarchicalValue.value;
		case "null":
			return null;
		case "array":
			return hierarchicalValue.value.map((item) => hierarchicalToJson(item));
		case "object": {
			const obj: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(hierarchicalValue.value)) {
				obj[key] = hierarchicalToJson(value);
			}
			return obj;
		}
	}
}

/**
 * HierarchicalValue を YAML文字列に変換する
 */
export function hierarchicalToYaml(hierarchicalValue: HierarchicalValue): string {
	const jsonValue = hierarchicalToJson(hierarchicalValue);
	try {
		return stringify(jsonValue, { prettyErrors: true, version: "1.2" }).trim();
	} catch {
		// YAML変換失敗時はJSONフォールバック
		return JSON.stringify(jsonValue, null, 2);
	}
}

/**
 * HierarchicalValue を JSON文字列に変換する
 */
export function hierarchicalToJsonString(hierarchicalValue: HierarchicalValue): string {
	const jsonValue = hierarchicalToJson(hierarchicalValue);
	return JSON.stringify(jsonValue, null, 2);
}

// ============================================================
// 階層データ操作
// ============================================================

/**
 * パスに従って階層データの値を取得する
 */
export function getValueAtPath(
	root: HierarchicalValue,
	path: HierarchicalPath,
): HierarchicalValue | undefined {
	let current: unknown = root;

	for (const segment of path) {
		if (current === null || current === undefined) {
			return undefined;
		}

		if (typeof current !== "object") {
			return undefined;
		}

		if (Array.isArray(current)) {
			if (typeof segment !== "number") {
				return undefined;
			}
			current = current[segment];
		} else {
			// HierarchicalValue の場合
			const hierarchical = current as HierarchicalValue;
			if (hierarchical.type === "array" && typeof segment === "number") {
				current = hierarchical.value[segment];
			} else if (hierarchical.type === "object" && typeof segment === "string") {
				current = hierarchical.value[segment];
			} else {
				return undefined;
			}
		}
	}

	return current as HierarchicalValue;
}

/**
 * パスに従って階層データの値を更新する
 * 新しいオブジェクトを返す（不変性維持）
 */
export function updateValueAtPath(
	root: HierarchicalValue,
	path: HierarchicalPath,
	newValue: HierarchicalValue,
): HierarchicalValue {
	if (path.length === 0) {
		return newValue;
	}

	const [first, ...rest] = path;

	switch (root.type) {
		case "array": {
			const newArray = [...root.value];
			if (typeof first === "number" && first >= 0 && first < newArray.length) {
				newArray[first] =
					rest.length === 0
						? newValue
						: updateValueAtPath(newArray[first], rest, newValue);
			}
			return { ...root, value: newArray };
		}
		case "object": {
			if (typeof first !== "string") {
				return root;
			}
			const newObj = { ...root.value };
			if (!(first in newObj)) {
				// 新しいキーの場合はデフォルト値を設定
				newObj[first] = { type: "null", value: null };
			}
			newObj[first] =
				rest.length === 0
					? newValue
					: updateValueAtPath(newObj[first], rest, newValue);
			return { ...root, value: newObj };
		}
		default:
			// プリミティブ型は更新不可
			return root;
	}
}

/**
 * オペレーションを適用して新しい階層データを作成する
 */
export function applyOperation(
	root: HierarchicalValue,
	operation: HierarchicalEditOperation,
): HierarchicalValue {
	switch (operation.type) {
		case "updateValue": {
			const newValue = jsonToHierarchical(operation.value);
			return updateValueAtPath(root, operation.path, newValue);
		}
		case "updateType": {
			const current = getValueAtPath(root, operation.path);
			if (!current) return root;

			const newDefaultValue = createDefaultValue(operation.newType);
			return updateValueAtPath(root, operation.path, newDefaultValue);
		}
		case "addKey": {
			const parentPath = operation.path.slice(0, -1);
			const key = operation.path[operation.path.length - 1] as string;
			const parent = getValueAtPath(root, parentPath);

			if (parent?.type !== "object") return root;

			const newObj = { ...parent.value, [key]: operation.value };
			const newParent: HierarchicalValue = { ...parent, value: newObj };
			return updateValueAtPath(root, parentPath, newParent);
		}
		case "removeKey": {
			const parentPath = operation.path.slice(0, -1);
			const key = operation.path[operation.path.length - 1] as string;
			const parent = getValueAtPath(root, parentPath);

			if (parent?.type !== "object") return root;

			const { [key]: removed, ...rest } = parent.value;
			const newParent: HierarchicalValue = { ...parent, value: rest };
			return updateValueAtPath(root, parentPath, newParent);
		}
		case "addArrayItem": {
			const parent = getValueAtPath(root, operation.path);
			if (parent?.type !== "array") return root;

			const newArray = [...parent.value];
			newArray.splice(operation.index, 0, operation.value);
			const newParent: HierarchicalValue = { ...parent, value: newArray };
			return updateValueAtPath(root, operation.path, newParent);
		}
		case "removeArrayItem": {
			const parent = getValueAtPath(root, operation.path);
			if (parent?.type !== "array") return root;

			const newArray = parent.value.filter((_, i) => i !== operation.index);
			const newParent: HierarchicalValue = { ...parent, value: newArray };
			return updateValueAtPath(root, operation.path, newParent);
		}
		case "moveArrayItem": {
			const parent = getValueAtPath(root, operation.path);
			if (parent?.type !== "array") return root;

			const newArray = [...parent.value];
			const [removed] = newArray.splice(operation.fromIndex, 1);
			newArray.splice(operation.toIndex, 0, removed);
			const newParent: HierarchicalValue = { ...parent, value: newArray };
			return updateValueAtPath(root, operation.path, newParent);
		}
		default:
			return root;
	}
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * タイプに対応するデフォルト値を作成する
 */
export function createDefaultValue(type: HierarchicalValue["type"]): HierarchicalValue {
	switch (type) {
		case "string":
			return { type: "string", value: "" };
		case "number":
			return { type: "number", value: 0 };
		case "boolean":
			return { type: "boolean", value: false };
		case "null":
			return { type: "null", value: null };
		case "object":
			return { type: "object", value: {} };
		case "array":
			return { type: "array", value: [] };
	}
}

/**
 * 値からタイプを推論する
 */
export function inferTypeFromValue(value: unknown): HierarchicalValue["type"] {
	if (value === null || value === undefined) return "null";
	if (Array.isArray(value)) return "array";
	switch (typeof value) {
		case "string":
			return "string";
		case "number":
			return "number";
		case "boolean":
			return "boolean";
		case "object":
			return "object";
		default:
			return "string";
	}
}

/**
 * 階層データが空かどうかを判定する
 */
export function isHierarchicalValueEmpty(value: HierarchicalValue): boolean {
	switch (value.type) {
		case "null":
			return true;
		case "string":
			return value.value === "";
		case "object":
			return Object.keys(value.value).length === 0;
		case "array":
			return value.value.length === 0;
		default:
			return false;
	}
}

/**
 * 階層データの統計情報を取得する
 */
export function getHierarchicalStats(value: HierarchicalValue): {
	totalKeys: number;
	maxDepth: number;
	typeCounts: Record<string, number>;
} {
	let totalKeys = 0;
	let maxDepth = 0;
	const typeCounts: Record<string, number> = {};

	function traverse(node: HierarchicalValue, depth: number) {
		maxDepth = Math.max(maxDepth, depth);
		typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;

		if (node.type === "object") {
			totalKeys += Object.keys(node.value).length;
			for (const child of Object.values(node.value)) {
				traverse(child, depth + 1);
			}
		} else if (node.type === "array") {
			totalKeys += node.value.length;
			for (const child of node.value) {
				traverse(child, depth + 1);
			}
		}
	}

	traverse(value, 0);

	return { totalKeys, maxDepth, typeCounts };
}
