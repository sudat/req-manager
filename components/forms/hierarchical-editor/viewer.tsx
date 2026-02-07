/**
 * 階層データビューア
 *
 * 階層データを読み取り専用で表示するコンポーネント
 * 展開/折りたたみ機能と再帰的な子ノードレンダリングを含む
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { HierarchicalValue } from "@/lib/utils/hierarchical-editor";

interface HierarchicalViewerProps {
	value: HierarchicalValue;
	className?: string;
	keyLabelMap?: Record<string, string>;
	showOriginalKey?: boolean;
}

const toSnakeCase = (value: string): string =>
	value
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.replace(/[-\s]+/g, "_")
		.toLowerCase();

const resolveKeyLabel = (key: string, keyLabelMap?: Record<string, string>): string | undefined => {
	if (!keyLabelMap) return undefined;
	const normalized = toSnakeCase(key);
	return keyLabelMap[key] ?? keyLabelMap[normalized] ?? keyLabelMap[key.toLowerCase()];
};

/**
 * 階層データビューア（エントリーポイント）
 */
export function HierarchicalViewer({
	value,
	className,
	keyLabelMap,
	showOriginalKey = false,
}: HierarchicalViewerProps) {
	return (
		<NodeViewer
			value={value}
			className={className}
			keyLabelMap={keyLabelMap}
			showOriginalKey={showOriginalKey}
		/>
	);
}

/**
 * ノードビューア（再帰ディスパッチャー）
 *
 * HierarchicalValue のタイプに応じて適切なビューアを表示し、
 * 階層構造を再帰的にレンダリングする
 */
function NodeViewer({
	value,
	className,
	keyLabelMap,
	showOriginalKey,
}: {
	value: HierarchicalValue;
	className?: string;
	keyLabelMap?: Record<string, string>;
	showOriginalKey: boolean;
}) {
	// プリミティブ型
	if (
		value.type === "string" ||
		value.type === "number" ||
		value.type === "boolean" ||
		value.type === "null"
	) {
		return <PrimitiveViewer value={value} className={className} />;
	}

	// オブジェクト型
	if (value.type === "object") {
		return (
			<ObjectViewer
				value={value}
				className={className}
				keyLabelMap={keyLabelMap}
				showOriginalKey={showOriginalKey}
			/>
		);
	}

	// 配列型
	if (value.type === "array") {
		return (
			<ArrayViewer
				value={value}
				className={className}
				keyLabelMap={keyLabelMap}
				showOriginalKey={showOriginalKey}
			/>
		);
	}

	// 不明な型（フォールバック）
	return (
		<div className={`text-[14px] text-red-500 ${className}`}>
			不明なタイプ: {JSON.stringify(value)}
		</div>
	);
}

/**
 * プリミティブ値ビューア
 */
function PrimitiveViewer({
	value,
	className,
}: {
	value: Extract<HierarchicalValue, { type: "string" | "number" | "boolean" | "null" }>;
	className?: string;
}) {
	return (
		<div className={`text-[14px] ${className}`}>
			{value.type === "string" && (
				<span className="text-slate-700">{value.value || <span className="text-slate-400 italic">空文字列</span>}</span>
			)}
			{value.type === "number" && (
				<span className="text-blue-600 font-mono">{value.value}</span>
			)}
			{value.type === "boolean" && (
				<span className={`font-medium ${value.value ? "text-green-600" : "text-red-500"}`}>
					{value.value ? "true" : "false"}
				</span>
			)}
			{value.type === "null" && (
				<span className="text-slate-400 italic">null</span>
			)}
		</div>
	);
}

/**
 * オブジェクトビューア
 */
function ObjectViewer({
	value,
	className,
	keyLabelMap,
	showOriginalKey,
}: {
	value: Extract<HierarchicalValue, { type: "object" }>;
	className?: string;
	keyLabelMap?: Record<string, string>;
	showOriginalKey: boolean;
}) {
	const [isOpen, setIsOpen] = useState(true);
	const entries = Object.entries(value.value);

	if (entries.length === 0) {
		return (
			<div className={`${className}`}>
				<span className="text-slate-400 italic text-[14px]">空のオブジェクト</span>
			</div>
		);
	}

	return (
		<div className={className}>
			{/* オブジェクトヘッダー（展開/折りたたみ） */}
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<div className="flex items-center gap-1">
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 flex-shrink-0 hover:bg-slate-100"
						>
							{isOpen ? (
								<ChevronDown className="w-4 h-4 text-slate-500" />
							) : (
								<ChevronRight className="w-4 h-4 text-slate-500" />
							)}
						</Button>
					</CollapsibleTrigger>
					<Label className="text-[12px] font-medium text-slate-500">
						object ({entries.length} keys)
					</Label>
				</div>

				<CollapsibleContent className="mt-1">
					{/* キー・バリューペアの一覧 */}
					<div className="space-y-1 ml-4 border-l-2 border-slate-200 pl-2">
						{entries.map(([key, childValue]) => {
							const label = resolveKeyLabel(key, keyLabelMap);
							const displayKey =
								showOriginalKey && label ? `${label} (${key})` : (label ?? key);
							return (
								<div key={key} className="flex items-start gap-2">
									{/* キー名 */}
									<div className="flex-shrink-0 pt-0.5">
										<span className="text-[14px] font-medium text-slate-600 min-w-[60px] inline-block">
											{displayKey}:
										</span>
									</div>

									{/* 子ノードビューア（再帰レンダリング） */}
									<div className="flex-1 min-w-0 pt-0.5">
										<NodeViewer
											value={childValue}
											keyLabelMap={keyLabelMap}
											showOriginalKey={showOriginalKey}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}

/**
 * 配列ビューア
 */
function ArrayViewer({
	value,
	className,
	keyLabelMap,
	showOriginalKey,
}: {
	value: Extract<HierarchicalValue, { type: "array" }>;
	className?: string;
	keyLabelMap?: Record<string, string>;
	showOriginalKey: boolean;
}) {
	const [isOpen, setIsOpen] = useState(true);

	if (value.value.length === 0) {
		return (
			<div className={className}>
				<span className="text-slate-400 italic text-[14px]">空の配列</span>
			</div>
		);
	}

	return (
		<div className={className}>
			{/* 配列ヘッダー（展開/折りたたみ） */}
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<div className="flex items-center gap-1">
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 flex-shrink-0 hover:bg-slate-100"
						>
							{isOpen ? (
								<ChevronDown className="w-4 h-4 text-slate-500" />
							) : (
								<ChevronRight className="w-4 h-4 text-slate-500" />
							)}
						</Button>
					</CollapsibleTrigger>
					<Label className="text-[12px] font-medium text-slate-500">
						array [{value.value.length} items]
					</Label>
				</div>

				<CollapsibleContent className="mt-1">
					{/* 要素の一覧 */}
					<div className="space-y-1 ml-4 border-l-2 border-slate-200 pl-2">
						{value.value.map((item, index) => (
							<div key={index} className="flex items-start gap-2">
								{/* インデックス */}
								<div className="flex-shrink-0 pt-0.5">
									<span className="text-[12px] text-slate-400 w-6 text-center inline-block">
										{index}
									</span>
								</div>

								{/* 要素ビューア（再帰レンダリング） */}
								<div className="flex-1 min-w-0 pt-0.5">
									<NodeViewer
										value={item}
										keyLabelMap={keyLabelMap}
										showOriginalKey={showOriginalKey}
									/>
								</div>
							</div>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
