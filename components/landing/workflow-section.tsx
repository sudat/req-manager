"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Bot, FileSearch, GitPullRequest, Sparkles } from "lucide-react";

const steps = [
	{
		icon: FileSearch,
		title: "変更要求の入力",
		description: "GitHub Issueや自然言語で変更内容を入力",
		status: "completed",
	},
	{
		icon: Bot,
		title: "影響範囲の特定",
		description: "AIがコード依存関係を解析し、影響ファイルを列挙",
		status: "active",
	},
	{
		icon: GitPullRequest,
		title: "改修パッケージの生成",
		description: "確定した影響範囲に対する実装変更を自動生成",
		status: "pending",
	},
];

const mockAnalysis = {
	targetFiles: [
		"app/api/invoices/route.ts",
		"lib/domain/invoice.ts",
		"components/invoice/form.tsx",
	],
	affectedModules: ["Billing", "Notification", "Report"],
	estimatedEffort: "2h 15m",
};

export function WorkflowSection() {
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [showResult, setShowResult] = useState(false);

	const handleAnalyze = () => {
		setIsAnalyzing(true);
		setTimeout(() => {
			setIsAnalyzing(false);
			setShowResult(true);
		}, 2000);
	};

	return (
		<section id="workflow" className="py-24 px-6">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="text-center mb-16"
				>
					<span className="text-sm font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
						[03] AI Workflow
					</span>
					<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-4">
						影響調査から改修まで
					</h2>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						AIエージェントがコードベースを解析し、変更の影響範囲を自動的に特定します
					</p>
				</motion.div>

				<div className="grid lg:grid-cols-2 gap-8">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						className="space-y-4"
					>
						{steps.map((step, index) => (
							<div
								key={step.title}
								className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
									step.status === "active"
										? "bg-violet-50 border-violet-200"
										: step.status === "completed"
											? "bg-gray-50 border-gray-200"
											: "bg-white border-gray-100"
								}`}
							>
								<div
									className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
										step.status === "active"
											? "bg-violet-500 text-white"
											: step.status === "completed"
												? "bg-gray-900 text-white"
												: "bg-gray-100 text-gray-400"
									}`}
								>
									<step.icon className="w-5 h-5" />
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<span className="text-xs font-mono text-gray-400">0{index + 1}</span>
										<h4 className="font-semibold text-gray-900">{step.title}</h4>
									</div>
									<p className="text-sm text-gray-600 mt-1">{step.description}</p>
								</div>
							</div>
						))}
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
					>
						<div className="flex items-center gap-3 mb-4">
							<div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
								<Sparkles className="w-4 h-4 text-violet-400" />
							</div>
							<span className="font-medium">AI Investigation Agent</span>
						</div>

						<div className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700">
							<p className="text-gray-300 text-sm mb-2">
								請求書発行機能に消費税計算を追加してください
							</p>
							<div className="flex items-center gap-2 text-xs text-gray-500">
								<span>GitHub Issue #142</span>
								<span>·</span>
								<span>2 hours ago</span>
							</div>
						</div>

						{!showResult && (
							<button
								type="button"
								onClick={handleAnalyze}
								disabled={isAnalyzing}
								className="w-full bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white font-medium py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
							>
								{isAnalyzing ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										<span>解析中...</span>
									</>
								) : (
									<>
										<span>影響調査を実行</span>
										<ArrowRight className="w-4 h-4" />
									</>
								)}
							</button>
						)}

						{showResult && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="space-y-4"
							>
								<div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
									<div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
										<div className="w-2 h-2 rounded-full bg-green-400" />
										解析完了
									</div>
								</div>

								<div className="space-y-3">
									<div>
										<p className="text-xs text-gray-500 mb-2">対象ファイル</p>
										<div className="space-y-1">
											{mockAnalysis.targetFiles.map((file) => (
												<div
													key={file}
													className="text-sm font-mono text-gray-300 bg-gray-800 px-3 py-2 rounded-lg"
												>
													{file}
												</div>
											))}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3 pt-3">
										<div className="bg-gray-800 rounded-xl p-3">
											<p className="text-xs text-gray-500">影響モジュール</p>
											<p className="text-lg font-semibold text-white">
												{mockAnalysis.affectedModules.length}
											</p>
										</div>
										<div className="bg-gray-800 rounded-xl p-3">
											<p className="text-xs text-gray-500">推定工数</p>
											<p className="text-lg font-semibold text-white">
												{mockAnalysis.estimatedEffort}
											</p>
										</div>
									</div>
								</div>
							</motion.div>
						)}
					</motion.div>
				</div>
			</div>
		</section>
	);
}
