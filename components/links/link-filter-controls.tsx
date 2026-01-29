import { Filter } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type FilterMode = "all" | "suspect";

interface LinkFilterControlsProps {
	filterMode: FilterMode;
	onFilterChange: (mode: FilterMode) => void;
	suspectCount: number;
	totalCount: number;
}

export function LinkFilterControls({
	filterMode,
	onFilterChange,
	suspectCount,
	totalCount,
}: LinkFilterControlsProps) {
	return (
		<div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex items-center gap-4">
			<Filter className="h-5 w-5 text-slate-400" />
			<Select
				value={filterMode}
				onValueChange={(value) => onFilterChange(value as FilterMode)}
			>
				<SelectTrigger className="w-[200px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">全件表示</SelectItem>
					<SelectItem value="suspect">
						疑義のみ {suspectCount > 0 && `(${suspectCount}件)`}
					</SelectItem>
				</SelectContent>
			</Select>
			<div className="ml-auto text-sm text-slate-600">
				{totalCount}件のリンク
			</div>
		</div>
	);
}
