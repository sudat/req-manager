/**
 * 階層型エディタ（メインコンテナ）
 *
 * YAML/JSONデータを階層型UIで編集するためのメインコンポーネント
 * 既存のYamlTextareaFieldと置き換え可能なインターフェースを提供する
 */

"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileCode, ChevronDown, ChevronRight } from "lucide-react";
import {
	HierarchicalValue,
	jsonToHierarchical,
	jsonStringToHierarchical,
	hierarchicalToJsonString,
	getHierarchicalStats,
} from "@/lib/utils/hierarchical-editor";
import { NodeEditor } from "./hierarchical-editor/node-editor";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface HierarchicalEditorProps {
	/** 表示ラベル */
	label: string;
	/** JSON文字列またはYAML文字列（既存データ互換） */
	value: string;
	/** 変更ハンドラー（JSON文字列で返す） */
	onChange: (value: string) => void;
	/** プレースホルダー（初期値が空の場合に表示） */
	placeholder?: string;
	/** 必須項目かどうか */
	required?: boolean;
	/** ヘルプテキスト */
	helperText?: string;
	/** コンテナクラス名 */
	className?: string;
}

/**
 * 階層型エディタメインコンポーネント
 *
 * 使用例:
 * ```tsx
 * <HierarchicalEditor
 *   label="技術スタック"
 *   value={techStackProfile} // JSON文字列
 *   onChange={(newValue) => setTechStackProfile(newValue)}
 * />
 * ```
 */
export function HierarchicalEditor({
	label,
	value,
	onChange,
	placeholder,
	required = false,
	helperText,
	className = "",
}: HierarchicalEditorProps) {
	// 内部状態：HierarchicalValue
	const [hierarchicalValue, setHierarchicalValue] = useState<HierarchicalValue>(() => {
		return jsonStringToHierarchical(value);
	});

	// 展開/折りたたみ状態
	const [isExpanded, setIsExpanded] = useState(true);

	// 初期値が変更されたら内部状態を更新
	React.useEffect(() => {
		setHierarchicalValue(jsonStringToHierarchical(value));
	}, [value]);

	// 統計情報を計算（メモ化）
	const stats = useMemo(() => getHierarchicalStats(hierarchicalValue), [hierarchicalValue]);

	// 値が変更されたらJSON文字列に変換して親に通知
	const handleChange = useCallback(
		(newValue: HierarchicalValue) => {
			setHierarchicalValue(newValue);
			const jsonString = hierarchicalToJsonString(newValue);
			onChange(jsonString);
		},
		[onChange],
	);

	// JSONコピー機能
	const handleExportAsJson = useCallback(() => {
		const jsonString = hierarchicalToJsonString(hierarchicalValue);
		navigator.clipboard.writeText(jsonString);
	}, [hierarchicalValue]);

	return (
		<div className={`space-y-1.5 ${className}`}>
			{/* ヘッダー */}
			<div className="flex items-center gap-2">
				<Label className="text-[12px] font-medium text-slate-500">
					{label}
					{required && <span className="text-rose-500">*</span>}
				</Label>

				{/* 統計情報バッジ */}
				{stats.totalKeys > 0 && (
					<div className="ml-auto flex items-center gap-1">
						<span className="text-[11px] text-slate-400">
							{stats.totalKeys} 項目 • 深さ {stats.maxDepth}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleExportAsJson}
							className="h-5 px-2 text-[10px] text-slate-400 hover:text-slate-600"
							title="JSONとしてクリップボードにコピー"
						>
							<FileCode className="w-3 h-3 mr-1" />
							JSON
						</Button>
					</div>
				)}
			</div>

			{/* エディタ本体 */}
			<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
				<div className="border rounded-md bg-background">
					{/* 折りたたみトリガー */}
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							className="w-full h-8 px-2 flex items-center justify-between hover:bg-slate-50 rounded-t-md border-b rounded-b-none"
						>
							<span className="text-[12px] font-medium text-slate-600">
								{isExpanded ? (
									<ChevronDown className="w-4 h-4 mr-1 inline" />
								) : (
									<ChevronRight className="w-4 h-4 mr-1 inline" />
								)}
								{stats.totalKeys > 0 ? "データを編集" : "データを追加"}
							</span>
						</Button>
					</CollapsibleTrigger>

					<CollapsibleContent>
						<div className="p-3">
							{/* 再帰ノードエディタ */}
							<NodeEditor
								value={hierarchicalValue}
								onChange={handleChange}
								path={[]}
							/>

							{/* 空の場合のプレースホルダー */}
							{stats.totalKeys === 0 && placeholder && (
								<div className="text-[13px] text-slate-400 italic py-4 text-center">
									{placeholder}
								</div>
							)}
						</div>
					</CollapsibleContent>
				</div>
			</Collapsible>

			{/* ヘルプテキスト */}
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}

			{/* 情報アラート */}
			{stats.totalKeys > 0 && (
				<Alert className="py-2">
					<FileCode className="h-4 w-4" />
					<AlertDescription className="text-[11px]">
						データはJSON形式で保存されます。既存のデータは自動的に変換されます。
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
