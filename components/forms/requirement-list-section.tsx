"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { RequirementCard } from "./requirement-card";
import type { Requirement } from "@/lib/mock/task-knowledge";

type RequirementListSectionProps = {
	title: string;
	requirements: Requirement[];
	onAdd: () => void;
	onUpdate: (id: string, patch: Partial<Requirement>) => void;
	onRemove: (id: string) => void;
};

export function RequirementListSection({
	title,
	requirements,
	onAdd,
	onUpdate,
	onRemove,
}: RequirementListSectionProps): React.ReactElement {
	return (
		<Card className="mt-4 rounded-md border border-slate-200">
			<CardContent className="p-3 space-y-3">
				{/* セクションヘッダー */}
				<div className="flex items-center justify-between pb-2 border-b border-slate-100">
					<div className="flex items-center gap-2">
						<h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
						<Badge
							variant="outline"
							className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0"
						>
							{requirements.length}
						</Badge>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-7 gap-2 text-[12px]"
						onClick={onAdd}
					>
						<Plus className="h-4 w-4" />
						追加
					</Button>
				</div>

				{/* コンテンツ */}
				{requirements.length === 0 ? (
					<div className="text-[14px] text-slate-500">まだ登録されていません。</div>
				) : (
					requirements.map((req) => (
						<RequirementCard
							key={req.id}
							requirement={req}
							onUpdate={(patch) => onUpdate(req.id, patch)}
							onRemove={() => onRemove(req.id)}
						/>
					))
				)}
			</CardContent>
		</Card>
	);
}
