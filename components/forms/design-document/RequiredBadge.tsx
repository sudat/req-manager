"use client";

import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

export function RequiredBadge(): ReactNode {
	return (
		<Badge
			variant="outline"
			className="text-[10px] px-1.5 py-0 h-[18px] border-slate-200 bg-slate-100 text-slate-600 font-normal"
		>
			必須
		</Badge>
	);
}
