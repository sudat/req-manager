"use client";

import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ScreenInput } from "@/lib/domain/schemas/io-schemas";
import { SCREEN_TRIGGERS } from "../constants";

export function ScreenInputSection({
	inputSchema,
	route,
	onRouteChange,
	onChange,
}: {
	inputSchema: ScreenInput;
	route: string;
	onRouteChange: (route: string) => void;
	onChange: (inputSchema: ScreenInput) => void;
}): ReactNode {
	const [preconditionFocused, setPreconditionFocused] = useState(false);

	return (
		<div className="overflow-x-auto pb-1">
			<div className="grid min-w-[980px] gap-2 grid-cols-[minmax(140px,1.1fr)_minmax(140px,1.1fr)_minmax(120px,0.9fr)_minmax(220px,1.7fr)_minmax(260px,2fr)]">
				<div className="space-y-1">
					<Label className="text-[11px] text-slate-500">画面URLパス</Label>
					<Input
						value={route}
						onChange={(e) => onRouteChange(e.target.value)}
						placeholder="例: /billing"
						className="h-8 text-sm"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-[11px] text-slate-500">操作対象</Label>
					<Input
						value={inputSchema.targetElement ?? ""}
						onChange={(e) => onChange({ ...inputSchema, targetElement: e.target.value })}
						placeholder="例: 発行ボタン"
						className="h-8 text-sm"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-[11px] text-slate-500">トリガー</Label>
					<Select
						value={inputSchema.trigger}
						onValueChange={(value) =>
							onChange({ ...inputSchema, trigger: value as ScreenInput["trigger"] })
						}
					>
						<SelectTrigger className="h-8 text-sm w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SCREEN_TRIGGERS.map((trigger) => (
								<SelectItem key={trigger} value={trigger}>
									{trigger}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-[11px] text-slate-500">操作内容</Label>
					<Input
						value={inputSchema.action ?? ""}
						onChange={(e) => onChange({ ...inputSchema, action: e.target.value })}
						placeholder="例: 請求書を発行"
						className="h-8 text-sm"
					/>
				</div>
				<div className="space-y-1">
					<Label className="text-[11px] text-slate-500">前提条件</Label>
					<Textarea
						value={inputSchema.precondition ?? ""}
						onChange={(e) => onChange({ ...inputSchema, precondition: e.target.value })}
						onFocus={() => setPreconditionFocused(true)}
						onBlur={() => setPreconditionFocused(false)}
						placeholder="例: 請求対象が1件以上選択されている"
						className="text-sm min-h-[32px] resize-y transition-[min-height]"
						style={{ minHeight: preconditionFocused ? 56 : 32 }}
					/>
				</div>
			</div>
		</div>
	);
}
