"use client"

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, RotateCcw, Plus, Trash2 } from "lucide-react";
import type { TaskKnowledge, Requirement } from "@/lib/mock/task-knowledge";
import { getDefaultTaskKnowledge } from "@/lib/mock/task-knowledge";

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

	const [knowledge, setKnowledge] = useState<TaskKnowledge>(() => {
		if (typeof window === "undefined") return defaultKnowledge;
		try {
			const raw = window.localStorage.getItem(storageKey);
			if (!raw) return defaultKnowledge;
			const parsed = JSON.parse(raw) as TaskKnowledge;
			if (parsed?.bizId !== id || parsed?.taskId !== taskId) return defaultKnowledge;
			return parsed;
		} catch {
			return defaultKnowledge;
		}
	});

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

	const handleSave = () => {
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(knowledge));
		} catch {
			// noop
		}
		router.push(`/business/${id}/tasks/${taskId}`);
	};

	const handleReset = () => {
		try {
			window.localStorage.removeItem(storageKey);
		} catch {
			// noop
		}
		setKnowledge(defaultKnowledge);
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
							<Button variant="outline" className="h-8 gap-2 text-[14px]" onClick={handleReset}>
								<RotateCcw className="h-4 w-4" />
								リセット
							</Button>
							<Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800" onClick={handleSave}>
								<Save className="h-4 w-4" />
								保存
							</Button>
						</div>
					</div>

					<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">業務タスク編集</h1>
					<div className="mb-6 text-[13px] text-slate-500">
						モックのため、保存先はブラウザのLocalStorageです（API/DBは未実装）。
					</div>

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
