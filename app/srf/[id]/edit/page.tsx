"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Github } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getSystemFunctionById,
	getDesignCategoryLabel,
	type SystemFunction,
	type SrfCategory,
	type SrfStatus,
	type DesignItemCategory,
} from "@/lib/mock/data";

export default function SrfEditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const existingSrf = getSystemFunctionById(id);

	// フォーム状態
	const [designDocNo, setDesignDocNo] = useState(existingSrf?.designDocNo || "");
	const [category, setCategory] = useState<SrfCategory>(
		existingSrf?.category || "screen",
	);
	const [status, setStatus] = useState<SrfStatus>(
		existingSrf?.status || "not_implemented",
	);
	const [summary, setSummary] = useState(existingSrf?.summary || "");

	// システム設計項目
	const [systemDesign, setSystemDesign] = useState(
		existingSrf?.systemDesign || [],
	);

	// 新規設計項目入力状態
	const [newDesignItem, setNewDesignItem] = useState({
		category: "database" as DesignItemCategory,
		title: "",
		description: "",
		priority: "medium" as "high" | "medium" | "low",
	});

	// コード参照
	const [codeRefs, setCodeRefs] = useState(
		existingSrf?.codeRefs || [],
	);

	// 新規コード参照入力状態
	const [newCodeRef, setNewCodeRef] = useState({
		githubUrl: "",
		paths: [""],
		note: "",
	});

	// localStorageに保存
	useEffect(() => {
		const data = {
			id,
			designDocNo,
			category,
			status,
			summary,
			systemDesign,
			codeRefs,
		};
		localStorage.setItem(`srf-edit-${id}`, JSON.stringify(data));
	}, [id, designDocNo, category, status, summary, systemDesign, codeRefs]);

	// 設計項目を追加
	const addDesignItem = () => {
		if (!newDesignItem.title || !newDesignItem.description) return;

		const newItem = {
			id: `SD-${id}-${Date.now()}`,
			...newDesignItem,
		};

		setSystemDesign([...systemDesign, newItem]);
		setNewDesignItem({
			category: "database",
			title: "",
			description: "",
			priority: "medium",
		});
	};

	// 設計項目を削除
	const removeDesignItem = (itemId: string) => {
		setSystemDesign(systemDesign.filter((item) => item.id !== itemId));
	};

	// コード参照を追加
	const addCodeRef = () => {
		if (!newCodeRef.githubUrl) return;

		const validPaths = newCodeRef.paths.filter((p) => p.trim() !== "");
		if (validPaths.length === 0) return;

		setCodeRefs([...codeRefs, { ...newCodeRef, paths: validPaths }]);
		setNewCodeRef({
			githubUrl: "",
			paths: [""],
			note: "",
		});
	};

	// コード参照を削除
	const removeCodeRef = (index: number) => {
		setCodeRefs(codeRefs.filter((_, i) => i !== index));
	};

	// パスを追加
	const addPath = () => {
		setNewCodeRef({ ...newCodeRef, paths: [...newCodeRef.paths, ""] });
	};

	// パスを更新
	const updatePath = (index: number, value: string) => {
		const newPaths = [...newCodeRef.paths];
		newPaths[index] = value;
		setNewCodeRef({ ...newCodeRef, paths: newPaths });
	};

	// パスを削除
	const removePath = (index: number) => {
		setNewCodeRef({
			...newCodeRef,
			paths: newCodeRef.paths.filter((_, i) => i !== index),
		});
	};

	if (!existingSrf) {
		return (
			<>
				<Sidebar />
				<div className="ml-[280px] flex-1 min-h-screen bg-white">
					<div className="mx-auto max-w-[1400px] px-8 py-6">
						<div className="text-center py-20">
							<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">
								システム機能が見つかりません
							</h1>
							<Link href="/srf">
								<Button className="bg-slate-900 hover:bg-slate-800">
									システム機能一覧に戻る
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Sidebar />
			<div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1400px] px-8 py-6">
					<div className="flex items-center justify-between mb-6">
						<Link
							href={`/srf/${id}`}
							className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
						>
							<ArrowLeft className="h-4 w-4" />
							システム機能詳細に戻る
						</Link>
					</div>

					<div className="mb-6">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
							システム機能編集: {id}
						</h1>
						<p className="text-[13px] text-slate-500">
							システム機能の情報を編集します
						</p>
					</div>

					{/* 基本情報セクション */}
					<Card className="rounded-md border border-slate-200/60 bg-white mb-4">
						<CardContent className="p-6">
							<h2 className="text-[15px] font-semibold text-slate-900 mb-4">
								基本情報
							</h2>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>システム機能ID</Label>
									<Input value={id} disabled />
									<p className="text-xs text-slate-500">
										IDは変更できません
									</p>
								</div>

								<div className="space-y-2">
									<Label>
										設計書No<span className="text-rose-500">*</span>
									</Label>
									<Input
										value={designDocNo}
										onChange={(e) => setDesignDocNo(e.target.value)}
										placeholder="DD-TASK-001-001"
									/>
								</div>

								<div className="space-y-2">
									<Label>
										機能分類<span className="text-rose-500">*</span>
									</Label>
									<Select
										value={category}
										onValueChange={(value) => setCategory(value as SrfCategory)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="screen">画面（screen）</SelectItem>
											<SelectItem value="internal">
												内部処理（internal）
											</SelectItem>
											<SelectItem value="interface">
												インターフェース（interface）
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label>
										ステータス<span className="text-rose-500">*</span>
									</Label>
									<Select
										value={status}
										onValueChange={(value) => setStatus(value as SrfStatus)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="not_implemented">
												未実装
											</SelectItem>
											<SelectItem value="implementing">
												実装中
											</SelectItem>
											<SelectItem value="testing">テスト中</SelectItem>
											<SelectItem value="implemented">
												実装済
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="mt-4 space-y-2">
								<Label>
									機能概要<span className="text-rose-500">*</span>
								</Label>
								<Textarea
									value={summary}
									onChange={(e) => setSummary(e.target.value)}
									placeholder="機能の概要を入力"
									className="min-h-[100px]"
								/>
							</div>
						</CardContent>
					</Card>

					{/* システム設計セクション */}
					<Card className="rounded-md border border-slate-200/60 bg-white mb-4">
						<CardContent className="p-6">
							<h2 className="text-[15px] font-semibold text-slate-900 mb-4">
								システム設計
							</h2>

							{/* 既存の設計項目一覧 */}
							<div className="space-y-3 mb-4">
								{systemDesign.map((item) => (
									<div
										key={item.id}
										className="rounded-md border border-slate-200 bg-slate-50/50 p-4"
									>
										<div className="flex items-start justify-between mb-2">
											<div className="flex items-center gap-2">
												<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
													{getDesignCategoryLabel(item.category)}
												</span>
												<span className="text-[11px] text-slate-400 font-mono">
													{item.id}
												</span>
												{item.priority === "high" && (
													<span className="text-[11px] font-medium text-red-600">
														重要
													</span>
												)}
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeDesignItem(item.id)}
												className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
										<div className="text-[13px] font-medium text-slate-900 mb-1">
											{item.title}
										</div>
										<div className="text-[13px] text-slate-600 leading-relaxed">
											{item.description}
										</div>
									</div>
								))}
								{systemDesign.length === 0 && (
									<div className="text-[13px] text-slate-500 text-center py-8">
										設計項目がありません
									</div>
								)}
							</div>

							{/* 新規設計項目追加フォーム */}
							<div className="border-t border-slate-200 pt-4">
								<h3 className="text-[13px] font-semibold text-slate-900 mb-3">
									設計項目を追加
								</h3>
								<div className="grid gap-3 md:grid-cols-2">
									<div className="space-y-1">
										<Label className="text-xs">カテゴリ</Label>
										<Select
											value={newDesignItem.category}
											onValueChange={(value) =>
												setNewDesignItem({
													...newDesignItem,
													category: value as DesignItemCategory,
												})
											}
										>
											<SelectTrigger className="h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="database">
													データベース設計
												</SelectItem>
												<SelectItem value="api">API設計</SelectItem>
												<SelectItem value="logic">
													ビジネスロジック
												</SelectItem>
												<SelectItem value="ui">UI/画面設計</SelectItem>
												<SelectItem value="integration">
													外部連携
												</SelectItem>
												<SelectItem value="batch">バッチ処理</SelectItem>
												<SelectItem value="error_handling">
													エラーハンドリング
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-1">
										<Label className="text-xs">優先度</Label>
										<Select
											value={newDesignItem.priority}
											onValueChange={(value) =>
												setNewDesignItem({
													...newDesignItem,
													priority: value as "high" | "medium" | "low",
												})
											}
										>
											<SelectTrigger className="h-9">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="high">高</SelectItem>
												<SelectItem value="medium">中</SelectItem>
												<SelectItem value="low">低</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="mt-3 space-y-1">
									<Label className="text-xs">タイトル</Label>
									<Input
										value={newDesignItem.title}
										onChange={(e) =>
											setNewDesignItem({ ...newDesignItem, title: e.target.value })
										}
										placeholder="設計項目のタイトル"
										className="h-9"
									/>
								</div>

								<div className="mt-3 space-y-1">
									<Label className="text-xs">説明</Label>
									<Textarea
										value={newDesignItem.description}
										onChange={(e) =>
											setNewDesignItem({
												...newDesignItem,
												description: e.target.value,
											})
										}
										placeholder="設計項目の説明"
										className="min-h-[80px]"
									/>
								</div>

								<div className="mt-3">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addDesignItem}
										disabled={!newDesignItem.title || !newDesignItem.description}
										className="h-8"
									>
										<Plus className="h-4 w-4 mr-1" />
										追加
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* コード参照セクション */}
					<Card className="rounded-md border border-slate-200/60 bg-white mb-4">
						<CardContent className="p-6">
							<h2 className="text-[15px] font-semibold text-slate-900 mb-4">
								コード参照
							</h2>

							{/* 既存のコード参照一覧 */}
							<div className="space-y-3 mb-4">
								{codeRefs.map((ref, index) => (
									<div
										key={index}
										className="rounded-md border border-slate-200 bg-white p-4"
									>
										<div className="flex items-start justify-between mb-2">
											{ref.githubUrl && (
												<a
													href={ref.githubUrl}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:underline"
												>
													<Github className="h-4 w-4" />
													GitHubリポジトリ
												</a>
											)}
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeCodeRef(index)}
												className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 ml-auto"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
										{ref.note && (
											<div className="mb-2 text-[12px] text-slate-600">
												{ref.note}
											</div>
										)}
										<div className="space-y-1">
											{ref.paths.map((path, i) => (
												<div
													key={i}
													className="rounded-md bg-slate-50 p-2"
												>
													<code className="text-[12px] text-slate-800 font-mono">
														{path}
													</code>
												</div>
											))}
										</div>
									</div>
								))}
								{codeRefs.length === 0 && (
									<div className="text-[13px] text-slate-500 text-center py-8">
										コード参照がありません
									</div>
								)}
							</div>

							{/* 新規コード参照追加フォーム */}
							<div className="border-t border-slate-200 pt-4">
								<h3 className="text-[13px] font-semibold text-slate-900 mb-3">
									コード参照を追加
								</h3>
								<div className="space-y-3">
									<div className="space-y-1">
										<Label className="text-xs">GitHub URL</Label>
										<Input
											value={newCodeRef.githubUrl}
											onChange={(e) =>
												setNewCodeRef({
													...newCodeRef,
													githubUrl: e.target.value,
												})
											}
											placeholder="https://github.com/example/repo"
											className="h-9"
										/>
									</div>

									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<Label className="text-xs">ファイルパス</Label>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={addPath}
												className="h-6 text-xs"
											>
												<Plus className="h-3 w-3 mr-1" />
												パス追加
											</Button>
										</div>
										{newCodeRef.paths.map((path, i) => (
											<div key={i} className="flex gap-2">
												<Input
													value={path}
													onChange={(e) => updatePath(i, e.target.value)}
													placeholder="apps/billing/src/invoice/generateInvoice.ts"
													className="h-9"
												/>
												{newCodeRef.paths.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removePath(i)}
														className="h-9 w-9 p-0"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												)}
											</div>
										))}
									</div>

									<div className="space-y-1">
										<Label className="text-xs">備考（任意）</Label>
										<Input
											value={newCodeRef.note}
											onChange={(e) =>
												setNewCodeRef({
													...newCodeRef,
													note: e.target.value,
												})
											}
											placeholder="メインロジックとテンプレート"
											className="h-9"
										/>
									</div>

									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addCodeRef}
										disabled={!newCodeRef.githubUrl}
										className="h-8"
									>
										<Plus className="h-4 w-4 mr-1" />
										追加
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* アクションボタン */}
					<div className="flex gap-3">
						<Link href={`/srf/${id}`}>
							<Button type="button" variant="outline">
								キャンセル
							</Button>
						</Link>
						<Button
							type="button"
							className="bg-slate-900 hover:bg-slate-800"
							onClick={() => {
								// 保存処理（mock）
								alert("保存しました（デモ）");
							}}
						>
							保存
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
