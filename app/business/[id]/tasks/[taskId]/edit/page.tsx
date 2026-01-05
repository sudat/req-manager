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
			<div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1400px] p-8">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<Link
							href={`/business/${id}/tasks/${taskId}`}
							className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
						>
							<ArrowLeft className="h-4 w-4" />
							業務タスク詳細に戻る
						</Link>
						<div className="flex items-center gap-2">
							<Button variant="outline" className="gap-2" onClick={handleReset}>
								<RotateCcw className="h-4 w-4" />
								リセット
							</Button>
							<Button className="bg-brand hover:bg-brand-600 gap-2" onClick={handleSave}>
								<Save className="h-4 w-4" />
								保存
							</Button>
						</div>
					</div>

					<h1 className="text-2xl font-semibold text-slate-900 mb-2">業務タスク編集</h1>
					<div className="mb-6 text-sm text-slate-500">
						モックのため、保存先はブラウザのLocalStorageです（API/DBは未実装）。
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">基本情報</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>業務ID</Label>
									<Input value={knowledge.bizId} disabled />
								</div>
								<div className="space-y-2">
									<Label>業務タスクID</Label>
									<Input value={knowledge.taskId} disabled />
								</div>
							</div>
							<div className="space-y-2">
								<Label>業務タスク</Label>
								<Input
									value={knowledge.taskName}
									onChange={(e) => setKnowledge((p) => ({ ...p, taskName: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label>業務概要</Label>
								<Textarea
									className="min-h-[90px]"
									value={knowledge.taskSummary}
									onChange={(e) => setKnowledge((p) => ({ ...p, taskSummary: e.target.value }))}
								/>
							</div>
							<div className="grid gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<Label>担当者</Label>
									<Input
										value={knowledge.person ?? ""}
										onChange={(e) => setKnowledge((p) => ({ ...p, person: e.target.value }))}
									/>
								</div>
								<div className="space-y-2 md:col-span-1">
									<Label>インプット</Label>
									<Input
										value={knowledge.input ?? ""}
										onChange={(e) => setKnowledge((p) => ({ ...p, input: e.target.value }))}
									/>
								</div>
								<div className="space-y-2 md:col-span-1">
									<Label>アウトプット</Label>
									<Input
										value={knowledge.output ?? ""}
										onChange={(e) => setKnowledge((p) => ({ ...p, output: e.target.value }))}
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="mt-6">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-base">業務要件</CardTitle>
							<Button variant="outline" size="sm" className="gap-2" onClick={() => addRequirement("業務要件")}>
								<Plus className="h-4 w-4" />
								追加
							</Button>
						</CardHeader>
						<CardContent className="space-y-4">
							{knowledge.businessRequirements.length === 0 ? (
								<div className="text-sm text-slate-500">まだ登録されていません。</div>
							) : (
								knowledge.businessRequirements.map((req) => (
									<Card key={req.id} className="border-slate-100">
										<CardHeader className="flex flex-row items-start justify-between gap-3">
											<div>
												<div className="text-xs text-slate-400">{req.id}</div>
												<div className="mt-1 flex items-center gap-2">
													<Badge variant="outline" className="bg-slate-50">
														{req.type}
													</Badge>
												</div>
											</div>
											<Button
												variant="outline"
												size="icon"
												title="削除"
												onClick={() => removeRequirement("businessRequirements")(req.id)}
											>
												<Trash2 className="h-4 w-4 text-rose-500" />
											</Button>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="space-y-2">
												<Label>タイトル</Label>
												<Input
													value={req.title}
													onChange={(e) => updateRequirement("businessRequirements")(req.id, { title: e.target.value })}
												/>
											</div>
											<div className="space-y-2">
												<Label>概要</Label>
												<Textarea
													className="min-h-[90px]"
													value={req.summary}
													onChange={(e) => updateRequirement("businessRequirements")(req.id, { summary: e.target.value })}
												/>
											</div>
											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>影響領域（カンマ区切り）</Label>
													<Input
														value={joinCsv(req.impacts)}
														onChange={(e) => updateRequirement("businessRequirements")(req.id, { impacts: splitCsv(e.target.value) })}
													/>
												</div>
												<div className="space-y-2">
													<Label>関連要件（カンマ区切り）</Label>
													<Input
														value={joinCsv(req.related)}
														onChange={(e) => updateRequirement("businessRequirements")(req.id, { related: splitCsv(e.target.value) })}
													/>
												</div>
											</div>
											<div className="space-y-2">
												<Label>受入条件（1行=1条件）</Label>
												<Textarea
													className="min-h-[110px]"
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

					<Card className="mt-6">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-base">システム要件</CardTitle>
							<Button variant="outline" size="sm" className="gap-2" onClick={() => addRequirement("システム要件")}>
								<Plus className="h-4 w-4" />
								追加
							</Button>
						</CardHeader>
						<CardContent className="space-y-4">
							{knowledge.systemRequirements.length === 0 ? (
								<div className="text-sm text-slate-500">まだ登録されていません。</div>
							) : (
								knowledge.systemRequirements.map((req) => (
									<Card key={req.id} className="border-slate-100">
										<CardHeader className="flex flex-row items-start justify-between gap-3">
											<div>
												<div className="text-xs text-slate-400">{req.id}</div>
												<div className="mt-1 flex items-center gap-2">
													<Badge variant="outline" className="bg-slate-50">
														{req.type}
													</Badge>
												</div>
											</div>
											<Button
												variant="outline"
												size="icon"
												title="削除"
												onClick={() => removeRequirement("systemRequirements")(req.id)}
											>
												<Trash2 className="h-4 w-4 text-rose-500" />
											</Button>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="space-y-2">
												<Label>タイトル</Label>
												<Input
													value={req.title}
													onChange={(e) => updateRequirement("systemRequirements")(req.id, { title: e.target.value })}
												/>
											</div>
											<div className="space-y-2">
												<Label>概要</Label>
												<Textarea
													className="min-h-[90px]"
													value={req.summary}
													onChange={(e) => updateRequirement("systemRequirements")(req.id, { summary: e.target.value })}
												/>
											</div>
											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label>影響領域（カンマ区切り）</Label>
													<Input
														value={joinCsv(req.impacts)}
														onChange={(e) => updateRequirement("systemRequirements")(req.id, { impacts: splitCsv(e.target.value) })}
													/>
												</div>
												<div className="space-y-2">
													<Label>関連要件（カンマ区切り）</Label>
													<Input
														value={joinCsv(req.related)}
														onChange={(e) => updateRequirement("systemRequirements")(req.id, { related: splitCsv(e.target.value) })}
													/>
												</div>
											</div>
											<div className="space-y-2">
												<Label>受入条件（1行=1条件）</Label>
												<Textarea
													className="min-h-[110px]"
													value={joinLines(req.acceptanceCriteria)}
													onChange={(e) =>
														updateRequirement("systemRequirements")(req.id, { acceptanceCriteria: splitLines(e.target.value) })
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
