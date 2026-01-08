"use client";

import { ArrowLeft, ExternalLink, Github, Pencil } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	getDesignCategoryLabel,
	getSrfRelatedRequirements,
	type SystemFunction,
	systemFunctions,
} from "@/lib/mock/data";

export default function SrfDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const srf = systemFunctions.find((s) => s.id === id);

	if (!srf) {
		return (
			<>
				<Sidebar />
				<div className="ml-[280px] flex-1 min-h-screen bg-white">
					<div className="mx-auto max-w-[1400px] px-8 py-4">
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
			<div className="ml-[280px] flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-4">
					<div className="flex items-center justify-between mb-4">
						<Link
							href="/srf"
							className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
						>
							<ArrowLeft className="h-4 w-4" />
							システム機能一覧に戻る
						</Link>
						<Link href={`/srf/${id}/edit`}>
							<Button variant="outline" className="h-8 gap-2 text-[14px]">
								<Pencil className="h-4 w-4" />
								編集
							</Button>
						</Link>
					</div>

					{/* Page Header */}
					<div className="mb-4">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
							システム機能: {srf.id}
						</h1>
						<p className="text-[13px] text-slate-500">システム機能の詳細情報</p>
					</div>

					<Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
						<CardContent className="p-0">
							<div className="px-4 py-2.5 border-b border-slate-100">
								<h2 className="text-[15px] font-semibold text-slate-900">
									基本情報
								</h2>
							</div>
							<div className="p-4 space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
										<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
											システム機能ID
										</div>
										<div className="mt-1 font-mono text-[14px] font-semibold text-slate-900">
											{srf.id}
										</div>
									</div>
									<div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
										<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
											設計書No
										</div>
										<div className="mt-1 text-[13px] font-semibold text-slate-900">
											{srf.designDocNo}
										</div>
									</div>
								</div>

								<div className="flex gap-3">
									<div>
										<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
											機能分類
										</div>
										<Badge
											variant="outline"
											className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
										>
											{srf.category}
										</Badge>
									</div>
									<div>
										<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
											ステータス
										</div>
										<Badge
											variant="outline"
											className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
										>
											{srf.status}
										</Badge>
									</div>
								</div>

								<div className="space-y-1.5">
									<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
										機能概要
									</div>
									<div className="text-[13px] text-slate-700 leading-relaxed">
										{srf.summary}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
						<div className="px-4 py-2.5 border-b border-slate-100">
							<h2 className="text-[15px] font-semibold text-slate-900">
								システム要件
							</h2>
						</div>
						<CardContent className="p-4">
							{(() => {
								const relatedReqs = getSrfRelatedRequirements(srf.id);
								return relatedReqs.length === 0 ? (
									<div className="text-[13px] text-slate-500">
										まだ登録されていません。
									</div>
								) : (
									<div className="space-y-3">
										{relatedReqs.map((req) => (
											<div
												key={req.systemReqId}
												className="rounded-md border border-slate-200 bg-slate-50/50 p-3"
											>
												<div className="flex items-center gap-2 mb-2">
													<Badge className="border-blue-200/60 bg-blue-50 text-blue-700 text-[12px] font-medium px-2 py-0.5">
														{req.systemReqId}
													</Badge>
													<span className="text-[13px] font-medium text-slate-900">
														{req.systemReqTitle}
													</span>
												</div>

												{/* 概要 */}
												{req.systemReqSummary && (
													<div className="text-[13px] text-slate-600 mb-2 ml-1">
														{req.systemReqSummary}
													</div>
												)}

												{/* 関連概念 */}
												{req.systemReqConcepts && req.systemReqConcepts.length > 0 && (
													<div className="ml-1 mb-2">
														<div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
															関連概念
														</div>
														<div className="flex flex-wrap gap-1.5">
															{req.systemReqConcepts.map((concept) => (
																<Link key={concept.id} href={`/ideas/${concept.id}`}>
																	<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
																		{concept.name}
																	</Badge>
																</Link>
															))}
														</div>
													</div>
												)}

												{/* 影響領域 */}
												{req.systemReqImpacts && req.systemReqImpacts.length > 0 && (
													<div className="ml-1 mb-2">
														<div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
															影響領域
														</div>
														<div className="flex flex-wrap gap-1.5">
															{req.systemReqImpacts.map((impact, i) => (
																<Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
																	{impact}
																</Badge>
															))}
														</div>
													</div>
												)}

												{/* 受入条件 */}
												{req.systemReqAcceptanceCriteria && req.systemReqAcceptanceCriteria.length > 0 && (
													<div className="ml-1 mb-2">
														<div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
															受入条件
														</div>
														<ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-0.5">
															{req.systemReqAcceptanceCriteria.map((ac, i) => (
																<li key={i}>{ac}</li>
															))}
														</ul>
													</div>
												)}

												{/* 業務要件へのリンク */}
												<div className="ml-1 pl-3 border-l-2 border-slate-200">
													<Link
														href={`/business/${req.businessId}/tasks/${req.taskId}`}
														className="block hover:bg-slate-100/50 rounded px-2 py-1 -ml-2 transition-colors"
													>
														<div className="flex items-center gap-2">
															<Badge
																variant="outline"
																className="border-emerald-200/60 bg-emerald-50 text-emerald-700 text-[12px] font-medium px-2 py-0.5"
															>
																{req.businessReqId}
															</Badge>
															<span className="text-[13px] text-slate-700">
																{req.businessReqTitle}
															</span>
															<ExternalLink className="h-3 w-3 text-slate-400 ml-auto" />
														</div>
													</Link>
												</div>
											</div>
										))}
									</div>
								);
							})()}
						</CardContent>
					</Card>

					<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
						<div className="px-4 py-2.5 border-b border-slate-100">
							<h2 className="text-[15px] font-semibold text-slate-900">
								システム設計
							</h2>
						</div>
						<CardContent className="p-4">
							{srf.systemDesign.length === 0 ? (
								<div className="text-[13px] text-slate-500">
									まだ登録されていません。
								</div>
							) : (
								<div className="space-y-3">
									{srf.systemDesign.map((item) => (
										<div
											key={item.id}
											className="rounded-md border border-slate-200 bg-slate-50/50 p-3"
										>
											<div className="flex items-center gap-2 mb-2">
												<Badge
													variant="outline"
													className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
												>
													{getDesignCategoryLabel(item.category)}
												</Badge>
												<span className="text-[11px] text-slate-400 font-mono">
													{item.id}
												</span>
												{item.priority === "high" && (
													<Badge className="border-red-200/60 bg-red-50 text-red-700 text-[11px] font-medium px-2 py-0.5">
														重要
													</Badge>
												)}
											</div>
											<div className="text-[13px] font-medium text-slate-900 mb-1">
												{item.title}
											</div>
											<div className="text-[13px] text-slate-600 leading-relaxed">
												{item.description}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
						<div className="px-4 py-2.5 border-b border-slate-100">
							<h2 className="text-[15px] font-semibold text-slate-900">実装</h2>
						</div>
						<CardContent className="p-4 space-y-3">
							{srf.codeRefs.length === 0 ? (
								<div className="text-[13px] text-slate-500">
									まだ登録されていません。
								</div>
							) : (
								srf.codeRefs.map((ref, index) => (
									<div
										key={index}
										className="rounded-md border border-slate-200 bg-white p-3"
									>
										{ref.githubUrl && (
											<div className="mb-3">
												<a
													href={ref.githubUrl}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:underline"
												>
													<Github className="h-4 w-4" />
													GitHubリポジトリ
													<ExternalLink className="h-3 w-3" />
												</a>
											</div>
										)}
										{ref.note && (
											<div className="mb-3 text-[12px] text-slate-600">
												{ref.note}
											</div>
										)}
										<div className="space-y-2">
											{ref.paths.map((path, i) => (
												<div key={i} className="rounded-md bg-slate-50 p-3">
													<code className="text-[13px] text-slate-800 font-mono">
														{path}
													</code>
												</div>
											))}
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
