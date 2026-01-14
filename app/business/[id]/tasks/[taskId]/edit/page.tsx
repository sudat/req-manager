"use client"

import { use, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, RotateCcw, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { TaskKnowledge, Requirement } from "@/lib/mock/task-knowledge";
import { getDefaultTaskKnowledge } from "@/lib/mock/task-knowledge";
import {
	syncTaskBasicInfo,
	syncBusinessRequirements,
	syncSystemRequirements,
} from "@/lib/data/task-sync";
import {
	listBusinessRequirementsByTaskId,
} from "@/lib/data/business-requirements";
import {
	listSystemRequirementsByTaskId,
} from "@/lib/data/system-requirements";
import {
	fromBusinessRequirement,
	fromSystemRequirement,
} from "@/lib/data/requirement-mapper";

const splitLines = (value: string) =>
	value
		.split("\n")
		.map((v) => v.trim())
		.filter(Boolean);

const joinLines = (values: string[]) => values.join("\n");


const splitCsv = (value: string) =>
	value
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);

const joinCsv = (values: string[]) => values.join(", ");

const nextSequentialId = (prefix: string, existingIds: string[]) => {
	const used = new Set(existingIds);
	for (let i = 1; i < 1000; i++) {
		const candidate = `${prefix}-${String(i).padStart(3, "0")}`;
		if (!used.has(candidate)) return candidate;
	}
	return `${prefix}-${Date.now()}`;
};

export default function TaskDetailEditPage({
	params,
}: {
	params: Promise<{ id: string; taskId: string }>;
}) {
	const { id, taskId } = use(params);
	const router = useRouter();

	const storageKey = `task-knowledge:${id}:${taskId}`;
	const defaultKnowledge = useMemo(
		() => getDefaultTaskKnowledge({ bizId: id, taskId }),
		[id, taskId],
	);

	// 状態管理
	const [knowledge, setKnowledge] = useState<TaskKnowledge>(defaultKnowledge);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// マウント時にDBから既存データを読み込む
	useEffect(() => {
		async function loadExistingData() {
			setIsLoading(true);

			try {
				// 業務要件を読み込み
				const { data: businessReqs } = await listBusinessRequirementsByTaskId(taskId);
				// システム要件を読み込み
				const { data: systemReqs } = await listSystemRequirementsByTaskId(taskId);

				// 概念マスタを読み込み（名前解決用）
				const { listConcepts } = await import("@/lib/data/concepts");
				const { data: concepts } = await listConcepts();
				const conceptMap = new Map(concepts?.map((c) => [c.id, c.name]) ?? []);

				// DBデータをRequirement型に変換
				const loadedBusinessRequirements = businessReqs?.map((br) =>
					fromBusinessRequirement(br, conceptMap)
				) ?? [];

				const loadedSystemRequirements = systemReqs?.map((sr) =>
					fromSystemRequirement(sr, conceptMap)
				) ?? [];

				// DBデータがあれば優先、なければLocalStorageまたはデフォルト
				setKnowledge((prev) => ({
					...prev,
					businessRequirements: loadedBusinessRequirements.length > 0
						? loadedBusinessRequirements
						: prev.businessRequirements,
					systemRequirements: loadedSystemRequirements.length > 0
						? loadedSystemRequirements
						: prev.systemRequirements,
				}));
			} catch (e) {
				console.error("データ読み込みエラー:", e);
			} finally {
				setIsLoading(false);
			}
		}

		loadExistingData();
	}, [taskId]);

	const updateRequirement =
		(listKey: "businessRequirements" | "systemRequirements") =>
		(reqId: string, patch: Partial<Requirement>) => {
			setKnowledge((prev) => ({
				...prev,
				[listKey]: prev[listKey].map((r) => (r.id === reqId ? { ...r, ...patch } : r)),
			}));
		};

	const removeRequirement =
		(listKey: "businessRequirements" | "systemRequirements") =>
		(reqId: string) => {
			setKnowledge((prev) => ({
				...prev,
				[listKey]: prev[listKey].filter((r) => r.id !== reqId),
			}));
		};

	const addRequirement = (type: Requirement["type"]) => {
		setKnowledge((prev) => {
			const listKey = type === "業務要件" ? "businessRequirements" : "systemRequirements";
			const existingIds = [...prev.businessRequirements, ...prev.systemRequirements].map((r) => r.id);
			const prefix = type === "業務要件" ? `BR-${taskId}` : `SR-${taskId}`;
			const id = nextSequentialId(prefix, existingIds);

			const nextReq: Requirement = {
				id,
				type,
				title: "",
				summary: "",
				concepts: [],
				impacts: [],
				acceptanceCriteria: [],
				related: [],
			};

			return {
				...prev,
				[listKey]: [...prev[listKey], nextReq],
			};
		});
	};

	const handleSave = async () => {
	setIsSaving(true);
	setSaveError(null);

	try {
		// LocalStorageにバックアップ
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(knowledge));
		} catch {
			// LocalStorage保存失敗は無視
		}

		// タスク基本情報を同期
		const taskError = await syncTaskBasicInfo(
			taskId,
			knowledge.taskName,
			knowledge.taskSummary,
			knowledge.person ?? "",
			knowledge.input ?? "",
			knowledge.output ?? "",
		);
		if (taskError) {
			setSaveError(taskError);
			return;
		}

		// 業務要件を同期
		const bizError = await syncBusinessRequirements(taskId, knowledge.businessRequirements);
		if (bizError) {
			setSaveError(bizError);
			return;
		}

		// システム要件を同期
		const sysError = await syncSystemRequirements(taskId, knowledge.systemRequirements);
		if (sysError) {
			setSaveError(sysError);
			return;
		}

		// 成功時はLocalStorageをクリア
		try {
			window.localStorage.removeItem(storageKey);
		} catch {
			// クリア失敗は無視
		}

		// 詳細ページへ遷移
		router.push(`/business/${id}/tasks/${taskId}`);
	} catch (e) {
		setSaveError(e instanceof Error ? e.message : String(e));
	} finally {
		setIsSaving(false);
	}
};

	const handleReset = () => {
		try {
			window.localStorage.removeItem(storageKey);
		} catch {
			// noop
		}
		setKnowledge(defaultKnowledge);
		setSaveError(null);
	};

	return (
		<>
			<Sidebar />
			<div className="ml-[280px] flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-6">
					<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
						<Link
							href={`/business/${id}/tasks/${taskId}`}
							className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
						>
							<ArrowLeft className="h-4 w-4" />
							業務タスク詳細に戻る
						</Link>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								className="h-8 gap-2 text-[14px]"
								onClick={handleReset}
								disabled={isLoading || isSaving}
							>
								<RotateCcw className="h-4 w-4" />
								リセット
							</Button>
							<Button
								className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800"
								onClick={handleSave}
								disabled={isLoading || isSaving}
							>
								{isSaving ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										保存中...
									</>
								) : (
									<>
										<Save className="h-4 w-4" />
										保存
									</>
								)}
							</Button>
						</div>
					</div>

					<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">業務タスク編集</h1>

					{/* ローディング表示 */}
					{isLoading && (
						<div className="mb-6 flex items-center gap-2 text-[13px] text-slate-500">
							<Loader2 className="h-4 w-4 animate-spin" />
							データを読み込み中...
						</div>
					)}

					{/* エラー表示 */}
					{saveError && (
						<div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2">
							<AlertCircle className="h-4 w-4 text-rose-600 mt-0.5" />
							<div className="text-[13px] text-rose-700">保存エラー: {saveError}</div>
						</div>
					)}

					<Card className="rounded-md border border-slate-200">
						<CardContent className="p-3 space-y-3">
							<div className="flex items-center gap-3 text-[12px] text-slate-500">
								<span className="font-mono">{knowledge.bizId}</span>
								<span className="text-slate-300">/</span>
								<span className="font-mono">{knowledge.taskId}</span>
							</div>

							<div className="space-y-1.5">
								<Label className="text-[12px] font-medium text-slate-500">業務タスク</Label>
								<Input
									value={knowledge.taskName}
									onChange={(e) => setKnowledge((p) => ({ ...p, taskName: e.target.value }))}
									className="text-[16px] font-semibold"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-[12px] font-medium text-slate-500">業務概要</Label>
								<Textarea
									className="min-h-[90px] text-[14px]"
									value={knowledge.taskSummary}
									onChange={(e) => setKnowledge((p) => ({ ...p, taskSummary: e.target.value }))}
								/>
							</div>

							<div className="grid gap-3 md:grid-cols-3">
								<div className="space-y-1.5">
									<Label className="text-[12px] font-medium text-slate-500">担当者</Label>
									<Input
										value={knowledge.person ?? ""}
										onChange={(e) => setKnowledge((p) => ({ ...p, person: e.target.value }))}
										className="text-[14px]"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[12px] font-medium text-slate-500">インプット</Label>
									<Input
										value={knowledge.input ?? ""}
										onChange={(e) => setKnowledge((p) => ({ ...p, input: e.target.value }))}
										className="text-[14px]"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[12px] font-medium text-slate-500">アウトプット</Label>
									<Input
										value={knowledge.output ?? ""}
										onChange={(e) => setKnowledge((p) => ({ ...p, output: e.target.value }))}
										className="text-[14px]"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="mt-4 rounded-md border border-slate-200">
						<CardContent className="p-3 space-y-3">
							<div className="flex items-center justify-between pb-2 border-b border-slate-100">
								<div className="flex items-center gap-2">
									<h3 className="text-[14px] font-semibold text-slate-900">業務要件</h3>
									<Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
										{knowledge.businessRequirements.length}
									</Badge>
								</div>
								<Button variant="outline" size="sm" className="h-7 gap-2 text-[12px]" onClick={() => addRequirement("業務要件")}>
									<Plus className="h-4 w-4" />
									追加
								</Button>
							</div>
							{knowledge.businessRequirements.length === 0 ? (
								<div className="text-[14px] text-slate-500">まだ登録されていません。</div>
							) : (
								knowledge.businessRequirements.map((req) => (
									<Card key={req.id} className="rounded-md border border-slate-200">
										<CardContent className="p-3 space-y-3">
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-2">
													<span className="font-mono text-[11px] text-slate-400">{req.id}</span>
													<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
														{req.type}
													</Badge>
												</div>
												<Button
													variant="outline"
													size="icon"
													title="削除"
													className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
													onClick={() => removeRequirement("businessRequirements")(req.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
											<div className="space-y-1.5">
												<Label className="text-[12px] font-medium text-slate-500">タイトル</Label>
												<Input
													value={req.title}
													onChange={(e) => updateRequirement("businessRequirements")(req.id, { title: e.target.value })}
													className="text-[14px]"
												/>
											</div>
											<div className="space-y-1.5">
												<Label className="text-[12px] font-medium text-slate-500">概要</Label>
												<Textarea
													className="min-h-[90px] text-[14px]"
													value={req.summary}
													onChange={(e) => updateRequirement("businessRequirements")(req.id, { summary: e.target.value })}
												/>
											</div>
											<div className="grid gap-3 md:grid-cols-2">
												<div className="space-y-1.5">
													<Label className="text-[12px] font-medium text-slate-500">関連概念（カンマ区切り）</Label>
													<Input
														value={req.concepts?.map(c => c.name).join(", ") ?? ""}
														onChange={(e) => {
															const names = splitCsv(e.target.value);
															updateRequirement("businessRequirements")(req.id, {
																concepts: names.map((name, i) => ({ id: `concept-${i}`, name }))
															});
														}}
														className="text-[14px]"
													/>
												</div>
												<div className="space-y-1.5">
													<Label className="text-[12px] font-medium text-slate-500">関連システム機能</Label>
													<Input
														value={req.srfId ?? ""}
														onChange={(e) => updateRequirement("businessRequirements")(req.id, { srfId: e.target.value })}
														className="text-[14px]"
														placeholder="例: SRF-001"
													/>
												</div>
											</div>
											<div className="grid gap-3 md:grid-cols-2">
												<div className="space-y-1.5">
													<Label className="text-[12px] font-medium text-slate-500">影響領域（カンマ区切り）</Label>
													<Input
														value={joinCsv(req.impacts)}
														onChange={(e) => updateRequirement("businessRequirements")(req.id, { impacts: splitCsv(e.target.value) })}
														className="text-[14px]"
													/>
												</div>
												<div className="space-y-1.5">
													<Label className="text-[12px] font-medium text-slate-500">関連要件（カンマ区切り）</Label>
													<Input
														value={joinCsv(req.related)}
														onChange={(e) => updateRequirement("businessRequirements")(req.id, { related: splitCsv(e.target.value) })}
														className="text-[14px]"
													/>
												</div>
											</div>
											<div className="space-y-1.5">
												<Label className="text-[12px] font-medium text-slate-500">受入条件（1行=1条件）</Label>
												<Textarea
													className="min-h-[110px] text-[14px]"
													value={joinLines(req.acceptanceCriteria)}
													onChange={(e) =>
														updateRequirement("businessRequirements")(req.id, { acceptanceCriteria: splitLines(e.target.value) })
													}
												/>
											</div>
										</CardContent>
									</Card>
								))
							)}
						</CardContent>
					</Card>


				</div>
			</div>
		</>
	);
}
