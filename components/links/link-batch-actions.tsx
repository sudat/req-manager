import { Check, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkBatchActionsProps {
	suspectCount: number;
	selectedCount: number;
	isBatchConfirming: boolean;
	onToggleSelectAll: () => void;
	onBatchConfirm: () => void;
}

export function LinkBatchActions({
	suspectCount,
	selectedCount,
	isBatchConfirming,
	onToggleSelectAll,
	onBatchConfirm,
}: LinkBatchActionsProps) {
	if (suspectCount === 0) return null;

	return (
		<div className="bg-white rounded-lg border border-slate-200 p-3 mb-4 flex items-center gap-3">
			<input
				type="checkbox"
				checked={selectedCount === suspectCount}
				onChange={onToggleSelectAll}
				className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
			/>
			<span className="text-sm text-slate-600">
				{selectedCount > 0
					? `${selectedCount}件を選択中`
					: "疑義リンクを一括選択"}
			</span>
			{selectedCount > 0 && (
				<Button
					variant="outline"
					size="sm"
					className="h-8 px-3 text-[13px] ml-auto"
					onClick={onBatchConfirm}
					disabled={isBatchConfirming}
				>
					{isBatchConfirming ? (
						<>
							<Check className="h-4 w-4 mr-1.5" />
							確認中...
						</>
					) : (
						<>
							<CheckSquare className="h-4 w-4 mr-1.5" />
							一括確認 ({selectedCount}件)
						</>
					)}
				</Button>
			)}
		</div>
	);
}
