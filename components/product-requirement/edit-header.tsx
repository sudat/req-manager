"use client";

import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

type EditHeaderProps = {
	onSave: () => void;
	onCancel: () => void;
	hasChanges: boolean;
	isSaving: boolean;
};

export function EditHeader({ onSave, onCancel, hasChanges, isSaving }: EditHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">プロダクト要件</h1>
				<p className="text-sm text-slate-500 mt-1">
					{hasChanges ? "編集中..." : "プロジェクトの前提と品質基準をまとめます"}
				</p>
			</div>
			<div className="flex gap-2">
				<Button variant="outline" onClick={onCancel}>
					<X className="w-4 h-4 mr-2" />
					キャンセル
				</Button>
				<Button onClick={onSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800">
					<Save className="w-4 h-4 mr-2" />
					{isSaving ? "保存中..." : "保存"}
				</Button>
			</div>
		</div>
	);
}
