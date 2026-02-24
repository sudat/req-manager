"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BtDraft, BrDraft } from "./types";
import type { ConceptCandidate } from "./concept-suggestion";

type BdOption = { area: string; name: string };

type ExtractedItem = {
	id: string;
	title: string;
	summary: string;
	evidence: string;
	draftInput: string;
	suggestedBdArea?: string | null;
	systemNotes?: string[];
};

type ExtractResponse = {
	items: ExtractedItem[];
	bdOptions: BdOption[];
};

type GenerateResultOk = {
	itemId: string;
	ok: true;
	btDraft: BtDraft;
	brDrafts: BrDraft[];
	conceptCandidates: ConceptCandidate[];
	uncertainties: unknown[];
	previewAvailable: boolean;
};

type GenerateResultError = {
	itemId: string;
	ok: false;
	error: string;
};

type GenerateResponse = {
	results: Array<GenerateResultOk | GenerateResultError>;
};

type MinutesIntakeDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	onGenerated: (args: {
		generated: GenerateResultOk[];
		errors: GenerateResultError[];
	}) => void;
};

const buildBdLabel = (opt: BdOption) => `${opt.area}: ${opt.name}`;

export function MinutesIntakeDialog({
	open,
	onOpenChange,
	projectId,
	onGenerated,
}: MinutesIntakeDialogProps) {
	const [minutesText, setMinutesText] = useState("");
	const [extractResponse, setExtractResponse] = useState<ExtractResponse | null>(
		null,
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bdByItemId, setBdByItemId] = useState<Record<string, string>>({});
	const [isExtracting, setIsExtracting] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resetAll = useCallback(() => {
		setMinutesText("");
		setExtractResponse(null);
		setSelectedIds(new Set());
		setBdByItemId({});
		setIsExtracting(false);
		setIsGenerating(false);
		setError(null);
	}, []);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			onOpenChange(nextOpen);
			if (!nextOpen) resetAll();
		},
		[onOpenChange, resetAll],
	);

	const hasBdOptions = (extractResponse?.bdOptions?.length ?? 0) > 0;

	const selectedItems = useMemo(() => {
		const items = extractResponse?.items ?? [];
		return items.filter((i) => selectedIds.has(i.id));
	}, [extractResponse?.items, selectedIds]);

	const missingBdAssignments = useMemo(() => {
		const missing: string[] = [];
		for (const item of selectedItems) {
			if (!bdByItemId[item.id]) missing.push(item.id);
		}
		return missing;
	}, [selectedItems, bdByItemId]);

	const canGenerate =
		selectedItems.length > 0 && missingBdAssignments.length === 0 && hasBdOptions;

	const handleExtract = useCallback(async () => {
		setError(null);
		const trimmed = minutesText.trim();
		if (!trimmed) {
			setError("議事録テキストを入力してください。");
			return;
		}

		setIsExtracting(true);
		try {
			const response = await fetch("/api/intake/minutes/extract", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectId, text: trimmed }),
			});
			const json = (await response.json()) as
				| ExtractResponse
				| { error?: string };
			if (!response.ok) {
				throw new Error((json as any)?.error || "抽出に失敗しました");
			}

			const next = json as ExtractResponse;
			setExtractResponse(next);
			setSelectedIds(new Set(next.items.map((i) => i.id)));

			const suggested: Record<string, string> = {};
			for (const item of next.items) {
				if (item.suggestedBdArea) {
					suggested[item.id] = item.suggestedBdArea;
				}
			}
			setBdByItemId(suggested);
		} catch (e) {
			setError(e instanceof Error ? e.message : "抽出に失敗しました");
		} finally {
			setIsExtracting(false);
		}
	}, [minutesText, projectId]);

	const handleToggleItem = useCallback((id: string, next: boolean) => {
		setSelectedIds((prev) => {
			const copy = new Set(prev);
			if (next) copy.add(id);
			else copy.delete(id);
			return copy;
		});
	}, []);

	const handleSelectBdArea = useCallback((itemId: string, area: string) => {
		setBdByItemId((prev) => ({ ...prev, [itemId]: area }));
	}, []);

	const handleGenerate = useCallback(async () => {
		if (!extractResponse) return;
		if (!canGenerate) {
			if (!hasBdOptions) {
				setError(
					"業務領域（BD）が未登録です。先に /business で業務領域を作成してください。",
				);
				return;
			}
			if (selectedItems.length === 0) {
				setError("生成対象を選択してください。");
				return;
			}
			if (missingBdAssignments.length > 0) {
				setError("選択した候補の業務領域（BD）を指定してください。");
				return;
			}
			return;
		}

		setError(null);
		setIsGenerating(true);
		try {
			const payloadItems = selectedItems.map((item) => ({
				id: item.id,
				bdArea: bdByItemId[item.id],
				text: item.draftInput,
				generateBR: true,
			}));

			const response = await fetch("/api/intake/minutes/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectId, items: payloadItems }),
			});
			const json = (await response.json()) as GenerateResponse | { error?: string };
			if (!response.ok) {
				throw new Error((json as any)?.error || "草案生成に失敗しました");
			}

			const results = (json as GenerateResponse).results ?? [];
			const generated: GenerateResultOk[] = [];
			const errors: GenerateResultError[] = [];

			for (const result of results) {
				if (result.ok) generated.push(result);
				else errors.push(result);
			}

			onGenerated({ generated, errors });
			handleOpenChange(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "草案生成に失敗しました");
		} finally {
			setIsGenerating(false);
		}
	}, [
		bdByItemId,
		canGenerate,
		extractResponse,
		handleOpenChange,
		hasBdOptions,
		missingBdAssignments.length,
		onGenerated,
		projectId,
		selectedItems,
	]);

	const step = extractResponse ? "review" : "input";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[900px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-slate-700" />
						議事録から草案
					</DialogTitle>
					<DialogDescription>
						議事録を貼り付けて、業務タスク（BT）/業務要件（BR）の草案をまとめて作成します（確定は個別）。
					</DialogDescription>
				</DialogHeader>

				{step === "input" ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="minutesText">議事録テキスト</Label>
							<Textarea
								id="minutesText"
								value={minutesText}
								onChange={(e) => setMinutesText(e.target.value)}
								placeholder="ここに議事録を貼り付けてください（長文OK）"
								className="min-h-[240px]"
								disabled={isExtracting || isGenerating}
							/>
						</div>

						{error && (
							<div className="text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
								{error}
							</div>
						)}
					</div>
				) : (
					<div className="space-y-4">
						{!hasBdOptions && (
							<div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
								業務領域（BD）が未登録です。先に /business で業務領域を作成してください。
							</div>
						)}

						<div className="flex items-center justify-between">
							<div className="text-[12px] text-slate-500">
								候補: {extractResponse?.items.length ?? 0}件 / 選択: {selectedItems.length}件
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setExtractResponse(null)}
								disabled={isExtracting || isGenerating}
							>
								戻る
							</Button>
						</div>

						<div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
							{(extractResponse?.items ?? []).map((item) => {
								const checked = selectedIds.has(item.id);
								const currentBdArea = bdByItemId[item.id] ?? "";
								const bdPlaceholder = item.suggestedBdArea
									? `提案: ${item.suggestedBdArea}`
									: "業務領域を選択";

								return (
									<div
										key={item.id}
										className="rounded-lg border border-slate-200 bg-white px-4 py-3"
									>
										<div className="flex items-start gap-3">
											<Checkbox
												checked={checked}
												onCheckedChange={(v) =>
													handleToggleItem(item.id, Boolean(v))
												}
												disabled={isExtracting || isGenerating}
												className="mt-0.5"
											/>

											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-3">
													<div className="min-w-0">
														<div className="text-[13px] font-semibold text-slate-800 break-words">
															{item.title}
														</div>
														<div className="text-[12px] text-slate-600 mt-1 break-words">
															{item.summary}
														</div>
													</div>

													<div className="w-[240px] shrink-0">
														<Select
															value={currentBdArea}
															onValueChange={(value) =>
																handleSelectBdArea(item.id, value)
															}
															disabled={!checked || !hasBdOptions || isGenerating}
														>
															<SelectTrigger className="h-8">
																<SelectValue placeholder={bdPlaceholder} />
															</SelectTrigger>
															<SelectContent>
																{(extractResponse?.bdOptions ?? []).map((opt) => (
																	<SelectItem key={opt.area} value={opt.area}>
																		{buildBdLabel(opt)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
												</div>

												<details className="mt-2 text-[12px] text-slate-500">
													<summary className="cursor-pointer select-none">
														詳細（根拠 / 草案入力 / システムメモ）
													</summary>
													<div className="mt-2 space-y-2">
														<div>
															<div className="text-[11px] font-medium text-slate-600">
																根拠
															</div>
															<div className="whitespace-pre-wrap break-words">
																{item.evidence || "(なし)"}
															</div>
														</div>
														<div>
															<div className="text-[11px] font-medium text-slate-600">
																草案入力
															</div>
															<div className="whitespace-pre-wrap break-words">
																{item.draftInput}
															</div>
														</div>
														<div>
															<div className="text-[11px] font-medium text-slate-600">
																システムメモ
															</div>
															<div className="whitespace-pre-wrap break-words">
																{(item.systemNotes ?? []).length > 0
																	? (item.systemNotes ?? []).map((s, idx) => (
																			<div key={idx}>- {s}</div>
																	  ))
																	: "(なし)"}
															</div>
														</div>
													</div>
												</details>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{error && (
							<div className="text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
								{error}
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					{step === "input" ? (
						<Button
							onClick={handleExtract}
							disabled={isExtracting || isGenerating}
							className="gap-2"
						>
							{isExtracting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									抽出中...
								</>
							) : (
								<>抽出</>
							)}
						</Button>
					) : (
						<Button
							onClick={handleGenerate}
							disabled={!canGenerate || isGenerating}
							className="gap-2"
						>
							{isGenerating ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									草案生成中...
								</>
							) : (
								<>草案を生成</>
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

