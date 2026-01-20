"use client";

import type { AcceptanceCriterionJson } from "@/lib/data/structured";

type AcceptanceCriteriaDisplayProps = {
	items: AcceptanceCriterionJson[];
	emptyMessage?: string;
};

export function AcceptanceCriteriaDisplay({
	items,
	emptyMessage = "未登録",
}: AcceptanceCriteriaDisplayProps): React.ReactNode {
	if (!items || items.length === 0) {
		return <div className="text-[13px] text-slate-400">{emptyMessage}</div>;
	}

	return (
		<div className="space-y-2">
			{items.map((item) => (
				<div key={item.id} className="space-y-1">
					<div className="text-[13px] text-slate-700">{item.description}</div>
					{item.verification_method && (
						<div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
							<span>検証方法: {item.verification_method}</span>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
