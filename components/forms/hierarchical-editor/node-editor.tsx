/**
 * 再帰ノードエディタ
 *
 * 階層データの任意のノードを編集するためのディスパッチャーコンポーネント
 * 値のタイプに応じて適切なエディタ（プリミティブ/オブジェクト/配列）を表示する
 */

"use client";

import React from "react";
import type { HierarchicalValue, HierarchicalPath } from "@/lib/utils/hierarchical-editor";
import { PrimitiveEditor } from "./primitive-editor";
import { ObjectEditor } from "./object-editor";
import { ArrayEditor } from "./array-editor";

interface NodeEditorProps {
	value: HierarchicalValue;
	onChange: (value: HierarchicalValue) => void;
	path: HierarchicalPath;
	className?: string;
}

/**
 * 再帰ノードエディタ
 *
 * HierarchicalValue のタイプに応じて適切なエディタを表示し、
 * 階層構造を再帰的にレンダリングする
 */
export function NodeEditor({ value, onChange, path, className }: NodeEditorProps) {
	// プリミティブ型（string, number, boolean, null）
	if (
		value.type === "string" ||
		value.type === "number" ||
		value.type === "boolean" ||
		value.type === "null"
	) {
		return <PrimitiveEditor value={value} onChange={onChange} className={className} />;
	}

	// オブジェクト型
	if (value.type === "object") {
		return <ObjectEditor value={value} onChange={onChange} path={path} className={className} />;
	}

	// 配列型
	if (value.type === "array") {
		return <ArrayEditor value={value} onChange={onChange} path={path} className={className} />;
	}

	// 不明な型（フォールバック）
	return (
		<div className={`text-[13px] text-red-500 ${className}`}>
			不明なタイプ: {JSON.stringify(value)}
		</div>
	);
}

/**
 * 子ノードエディタ（再帰用）
 *
 * オブジェクトや配列の子要素をレンダリングするためのヘルパーコンポーネント
 * パス情報を管理し、深さに応じたインデントを適用する
 */
interface ChildNodeEditorProps {
	value: HierarchicalValue;
	onChange: (value: HierarchicalValue) => void;
	parentPath: HierarchicalPath;
	depth?: number;
}

export function ChildNodeEditor({
	value,
	onChange,
	parentPath,
	depth = 0,
}: ChildNodeEditorProps) {
	const childPath = [...parentPath];
	const maxDepth = 10; // 最大深さを制限して無限再帰を防止

	if (depth > maxDepth) {
		return (
			<div className="text-[13px] text-orange-500 italic">
				最大深さ（{maxDepth}）を超えています
			</div>
		);
	}

	return (
		<NodeEditor
			value={value}
			onChange={onChange}
			path={childPath}
			className=""
		/>
	);
}
