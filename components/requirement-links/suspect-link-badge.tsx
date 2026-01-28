import { AlertTriangle } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export interface SuspectLinkBadgeProps {
	/** 疑義フラグ */
	suspect: boolean;
	/** 疑義理由（オプション） */
	suspectReason?: string | null;
	/** サイズ（デフォルト: sm） */
	size?: "sm" | "md";
}

/**
 * 疑義リンクを示すバッジコンポーネント
 *
 * suspect=trueの場合に警告色のバッジを表示。
 * suspectReasonがあればツールチップで理由を表示。
 */
export function SuspectLinkBadge({
	suspect,
	suspectReason,
	size = "sm",
}: SuspectLinkBadgeProps): React.ReactNode {
	if (!suspect) {
		return null;
	}

	const sizeClasses = {
		sm: "px-2 py-0.5 text-[10px]",
		md: "px-2.5 py-1 text-xs",
	};

	const iconSize = size === "sm" ? 10 : 12;

	const badge = (
		<span
			className={`inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200 ${sizeClasses[size]}`}
		>
			<AlertTriangle className={`h-[${iconSize}px] w-[${iconSize}px]`} />
			<span>疑義あり</span>
		</span>
	);

	if (suspectReason) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>{badge}</TooltipTrigger>
					<TooltipContent className="max-w-xs">
						<p className="text-xs">{suspectReason}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return badge;
}
