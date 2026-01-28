"use client";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

type ViewHeaderProps = {
	onEdit: () => void;
	hasData: boolean;
};

export function ViewHeader({ onEdit, hasData }: ViewHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">プロダクト要件</h1>
				<p className="text-sm text-slate-500 mt-1">
					プロジェクトの前提と品質基準をまとめます
				</p>
			</div>
			<Button onClick={onEdit} className="bg-slate-900 hover:bg-slate-800">
				<Pencil className="w-4 h-4 mr-2" />
				{hasData ? "編集" : "新規作成"}
			</Button>
		</div>
	);
}
