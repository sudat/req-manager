"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { RequirementCard } from "./requirement-card";
import type { Requirement, SelectionDialogType } from "@/lib/domain";

type RequirementListSectionProps = {
	title: string;
	requirements: Requirement[];
	onAdd: () => void;
	onUpdate: (id: string, patch: Partial<Requirement>) => void;
	onRemove: (id: string) => void;
	conceptMap: Map<string, string>;
	systemFunctionMap: Map<string, string>;
	businessRequirementMap?: Map<string, string>;
	systemRequirementMap?: Map<string, string>;
	onOpenDialog: (type: SelectionDialogType, reqId: string) => void;
	withoutCard?: boolean;
	showTitle?: boolean;
	showCountBadge?: boolean;
};

export function RequirementListSection({
	title,
	requirements,
	onAdd,
	onUpdate,
	onRemove,
	conceptMap,
	systemFunctionMap,
	businessRequirementMap,
	systemRequirementMap,
	onOpenDialog,
	withoutCard = false,
	showTitle = true,
	showCountBadge = true,
}: RequirementListSectionProps): React.ReactElement {
	const hasHeaderLeft = showTitle || showCountBadge;
	const sectionContent = (
		<>
			{/* セクションヘッダー */}
			<div
				className={`flex items-center pb-2 border-b border-slate-100 ${
					hasHeaderLeft ? "justify-between" : "justify-end"
				}`}
			>
				{hasHeaderLeft && (
					<div className="flex items-center gap-2">
						{showTitle && (
							<h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
						)}
						{showCountBadge && (
							<Badge
								variant="outline"
								className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0"
							>
								{requirements.length}
							</Badge>
						)}
					</div>
				)}
				<Button
					variant="default"
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
				<div className="space-y-0">
					{requirements.map((req, index) => (
						<div key={req.id}>
							{index > 0 && (
								<div className="border-t-2 border-slate-300 my-2" />
							)}
							<RequirementCard
								requirement={req}
								conceptMap={conceptMap}
								systemFunctionMap={systemFunctionMap}
								businessRequirementMap={businessRequirementMap}
								systemRequirementMap={systemRequirementMap}
								onUpdate={(patch) => onUpdate(req.id, patch)}
								onRemove={() => onRemove(req.id)}
								onOpenDialog={(type) => onOpenDialog(type, req.id)}
							/>
						</div>
					))}
				</div>
			)}
		</>
	);

	if (withoutCard) {
		return <div className="py-4">{sectionContent}</div>;
	}

	return (
		<Card>
			<CardContent className="py-4">{sectionContent}</CardContent>
		</Card>
	);
}
