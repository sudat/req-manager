"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EntryPoint } from "@/lib/domain";

type EntryPointsInlineEditorProps = {
	entryPoints: EntryPoint[];
	onChange: (entryPoints: EntryPoint[]) => void;
};

const emptyEntryPoint: EntryPoint = { path: "", type: null, responsibility: null };

export function EntryPointsInlineEditor({
	entryPoints,
	onChange,
}: EntryPointsInlineEditorProps): ReactNode {
	const lastInputRef = useRef<HTMLInputElement>(null);

	const pathCounts = useMemo(() => {
		return entryPoints.reduce((map, entry) => {
			const trimmed = entry.path.trim();
			if (!trimmed) return map;
			map.set(trimmed, (map.get(trimmed) ?? 0) + 1);
			return map;
		}, new Map<string, number>());
	}, [entryPoints]);

	const updateEntry = (index: number, patch: Partial<EntryPoint>) => {
		onChange(
			entryPoints.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
		);
	};

	const addEntryPoint = () => {
		onChange([...entryPoints, { ...emptyEntryPoint }]);
		// 追加後に最後のinputにfocus
		setTimeout(() => lastInputRef.current?.focus(), 0);
	};

	const removeEntryPoint = (index: number) => {
		onChange(entryPoints.filter((_, i) => i !== index));
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-[12px] font-medium text-slate-500">
					エントリポイント<span className="text-rose-500">*</span>
				</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-7 gap-2 text-[12px]"
					onClick={addEntryPoint}
				>
					<Plus className="h-4 w-4" />
					追加
				</Button>
			</div>
			{entryPoints.length === 0 ? (
				<div className="text-[13px] text-slate-500 text-center py-4">
					エントリポイントがありません
				</div>
			) : (
				<div className="space-y-3">
					{entryPoints.map((entry, index) => {
						const trimmed = entry.path.trim();
						const hasDuplicate =
							trimmed.length > 0 && (pathCounts.get(trimmed) ?? 0) > 1;
						const hasEmpty = trimmed.length === 0;
						const isLast = index === entryPoints.length - 1;

						return (
							<div
								key={`${entry.path}-${index}`}
								className="rounded-md border border-slate-200 bg-white p-3 space-y-3"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="space-y-1 flex-1">
										<Label className="text-xs">パス</Label>
										<Input
											ref={isLast ? lastInputRef : undefined}
											value={entry.path}
											onChange={(e) =>
												updateEntry(index, { path: e.target.value })
											}
											placeholder="/billing/invoices/{id}"
											className="h-9"
										/>
										{hasEmpty && (
											<div className="text-[11px] text-rose-600">
												パスは必須です
											</div>
										)}
										{hasDuplicate && (
											<div className="text-[11px] text-rose-600">
												同じパスは登録できません
											</div>
										)}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										aria-label={`エントリポイント ${entry.path || index + 1} を削除`}
										onClick={() => removeEntryPoint(index)}
										className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>

								<div className="grid gap-3 md:grid-cols-2">
									<div className="space-y-1">
										<Label className="text-xs">種別（任意）</Label>
										<Input
											value={entry.type ?? ""}
											onChange={(e) =>
												updateEntry(index, {
													type: e.target.value.trim() ? e.target.value : null,
												})
											}
											placeholder="api | screen"
											className="h-9"
										/>
									</div>
									<div className="space-y-1">
										<Label className="text-xs">責務（任意）</Label>
										<Input
											value={entry.responsibility ?? ""}
											onChange={(e) =>
												updateEntry(index, {
													responsibility: e.target.value.trim()
														? e.target.value
														: null,
												})
											}
											placeholder="請求書詳細の取得"
											className="h-9"
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
