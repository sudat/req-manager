/**
 * オブジェクトエディタ
 *
 * 階層データのオブジェクト（キー・バリューペア）を編集するコンポーネント
 * 展開/折りたたみ機能と再帰的な子ノードレンダリングを含む
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { HierarchicalValue, HierarchicalPath } from "@/lib/utils/hierarchical-editor";
import { ChildNodeEditor } from "./node-editor";

interface ObjectEditorProps {
	value: Extract<HierarchicalValue, { type: "object" }>;
	onChange: (value: HierarchicalValue) => void;
	path: HierarchicalPath;
	className?: string;
}

interface AddKeyDialogProps {
	onAdd: (key: string, value: HierarchicalValue) => void;
	existingKeys: string[];
	onClose: () => void;
}

function AddKeyDialog({ onAdd, existingKeys, onClose }: AddKeyDialogProps) {
	const [newKey, setNewKey] = useState("");
	const [selectedType, setSelectedType] = useState<HierarchicalValue["type"]>("string");

	const handleAdd = () => {
		const trimmedKey = newKey.trim();
		if (!trimmedKey) return;
		if (existingKeys.includes(trimmedKey)) return;

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

		onAdd(trimmedKey, defaultValue);
		setNewKey("");
		onClose();
	};

	return (
		<div className="flex items-center gap-2 py-2">
			<Input
				value={newKey}
				onChange={(e) => setNewKey(e.target.value)}
				placeholder="新しいキー名"
				className="h-8 text-[13px] flex-1"
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						handleAdd();
					} else if (e.key === "Escape") {
						onClose();
					}
				}}
				autoFocus
			/>
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

export function ObjectEditor({ value, onChange, path, className }: ObjectEditorProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [isAdding, setIsAdding] = useState(false);
	const entries = Object.entries(value.value);

	const handleKeyUpdate = (key: string, newValue: HierarchicalValue) => {
		const newObj = { ...value.value, [key]: newValue };
		onChange({ type: "object", value: newObj });
	};

	const handleKeyRemove = (key: string) => {
		const { [key]: removed, ...rest } = value.value;
		onChange({ type: "object", value: rest });
	};

	const handleKeyAdd = (newKey: string, newValue: HierarchicalValue) => {
		const newObj = { ...value.value, [newKey]: newValue };
		onChange({ type: "object", value: newObj });
	};

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
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsAdding(true)}
						className="h-6 px-2 text-[11px] text-slate-500 hover:text-slate-700 ml-auto"
					>
						<Plus className="w-3 h-3 mr-1" />
						キー追加
					</Button>
				</div>

				<CollapsibleContent className="mt-1">
					{/* キー追加ダイアログ */}
					{isAdding && (
						<AddKeyDialog
							onAdd={handleKeyAdd}
							existingKeys={Object.keys(value.value)}
							onClose={() => setIsAdding(false)}
						/>
					)}

					{/* キー・バリューペアの一覧 */}
					<div className="space-y-1 ml-4 border-l-2 border-slate-200 pl-2">
						{entries.map(([key, childValue]) => (
							<div key={key} className="flex items-start gap-2 group">
								{/* キー名と削除ボタン */}
								<div className="flex items-center gap-1 flex-shrink-0 pt-1">
									<span className="text-[13px] font-medium text-slate-600 min-w-[60px]">
										{key}:
									</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleKeyRemove(key)}
										className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity"
									>
										<Trash2 className="w-3 h-3" />
									</Button>
								</div>

								{/* 子ノードエディタ（再帰レンダリング） */}
								<div className="flex-1 min-w-0">
									<ChildNodeEditor
										value={childValue}
										onChange={(newValue) => handleKeyUpdate(key, newValue)}
										parentPath={[...path, key]}
									/>
								</div>
							</div>
						))}

						{entries.length === 0 && (
							<div className="text-[13px] text-slate-400 italic py-2">
								空のオブジェクト
							</div>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
