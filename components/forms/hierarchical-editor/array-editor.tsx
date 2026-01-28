/**
 * 配列エディタ
 *
 * 階層データの配列を編集するコンポーネント
 * 要素の追加・削除・並べ替えと展開/折りたたみ機能を含む
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
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from "lucide-react";
import type { HierarchicalValue, HierarchicalPath } from "@/lib/utils/hierarchical-editor";
import { ChildNodeEditor } from "./node-editor";

interface ArrayEditorProps {
	value: Extract<HierarchicalValue, { type: "array" }>;
	onChange: (value: HierarchicalValue) => void;
	path: HierarchicalPath;
	className?: string;
}

interface AddItemDialogProps {
	onAdd: (value: HierarchicalValue) => void;
	onClose: () => void;
}

function AddItemDialog({ onAdd, onClose }: AddItemDialogProps) {
	const [selectedType, setSelectedType] = useState<HierarchicalValue["type"]>("string");

	const handleAdd = () => {
		let defaultValue: HierarchicalValue;
		switch (selectedType) {
			case "string":
				defaultValue = { type: "string", value: "" };
				break;
			case "number":
				defaultValue = { type: "number", value: 0 };
				break;
			case "boolean":
				defaultValue = { type: "boolean", value: false };
				break;
			case "null":
				defaultValue = { type: "null", value: null };
				break;
			case "object":
				defaultValue = { type: "object", value: {} };
				break;
			case "array":
				defaultValue = { type: "array", value: [] };
				break;
		}

		onAdd(defaultValue);
		onClose();
	};

	return (
		<div className="flex items-center gap-2 py-2">
			<Label className="text-[12px] text-slate-500">新しい要素のタイプ:</Label>
			<select
				value={selectedType}
				onChange={(e) => setSelectedType(e.target.value as HierarchicalValue["type"])}
				className="h-8 px-2 text-[13px] border rounded-md bg-background"
			>
				<option value="string">Text</option>
				<option value="number">Number</option>
				<option value="boolean">Boolean</option>
				<option value="null">Null</option>
				<option value="object">Object</option>
				<option value="array">Array</option>
			</select>
			<Button size="sm" onClick={handleAdd} className="h-8 text-[12px]">
				<Plus className="w-3 h-3 mr-1" />
				追加
			</Button>
			<Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-[12px]">
				キャンセル
			</Button>
		</div>
	);
}

export function ArrayEditor({ value, onChange, path, className }: ArrayEditorProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [isAdding, setIsAdding] = useState(false);

	const handleItemUpdate = (index: number, newValue: HierarchicalValue) => {
		const newArray = [...value.value];
		newArray[index] = newValue;
		onChange({ type: "array", value: newArray });
	};

	const handleItemRemove = (index: number) => {
		const newArray = value.value.filter((_, i) => i !== index);
		onChange({ type: "array", value: newArray });
	};

	const handleItemAdd = (newValue: HierarchicalValue) => {
		const newArray = [...value.value, newValue];
		onChange({ type: "array", value: newArray });
	};

	const handleItemMove = (fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex) return;

		const newArray = [...value.value];
		const [removed] = newArray.splice(fromIndex, 1);
		newArray.splice(toIndex, 0, removed);
		onChange({ type: "array", value: newArray });
	};

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
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsAdding(true)}
						className="h-6 px-2 text-[11px] text-slate-500 hover:text-slate-700 ml-auto"
					>
						<Plus className="w-3 h-3 mr-1" />
						要素追加
					</Button>
				</div>

				<CollapsibleContent className="mt-1">
					{/* 要素追加ダイアログ */}
					{isAdding && (
						<AddItemDialog
							onAdd={handleItemAdd}
							onClose={() => setIsAdding(false)}
						/>
					)}

					{/* 要素の一覧 */}
					<div className="space-y-1 ml-4 border-l-2 border-slate-200 pl-2">
						{value.value.map((item, index) => (
							<div key={index} className="flex items-start gap-2 group">
								{/* インデックスと操作ボタン */}
								<div className="flex items-center gap-1 flex-shrink-0 pt-1">
									<GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
									<span className="text-[12px] text-slate-400 w-6 text-center">
										{index}
									</span>

									{/* 上に移動ボタン */}
									{index > 0 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleItemMove(index, index - 1)}
											className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-100"
											title="上に移動"
										>
											<ChevronDown className="w-3 h-3 rotate-180" />
										</Button>
									)}

									{/* 下に移動ボタン */}
									{index < value.value.length - 1 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleItemMove(index, index + 1)}
											className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-100"
											title="下に移動"
										>
											<ChevronDown className="w-3 h-3" />
										</Button>
									)}

									{/* 削除ボタン */}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleItemRemove(index)}
										className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
										title="削除"
									>
										<Trash2 className="w-3 h-3" />
									</Button>
								</div>

								{/* 要素エディタ（再帰レンダリング） */}
								<div className="flex-1 min-w-0">
									<ChildNodeEditor
										value={item}
										onChange={(newValue) => handleItemUpdate(index, newValue)}
										parentPath={[...path, index]}
									/>
								</div>
							</div>
						))}

						{value.value.length === 0 && (
							<div className="text-[13px] text-slate-400 italic py-2">
								空の配列
							</div>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
