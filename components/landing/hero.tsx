"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
	return (
		<section className="pt-32 pb-20 px-6">
			<div className="max-w-4xl mx-auto text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8"
				>
					<Sparkles className="w-4 h-4" />
					<span>AI-powered requirement management</span>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6"
				>
					Ask more from
					<br />
					<span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
						requirement management.
					</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed"
				>
					コーディングエージェントによる開発を支援する、次世代の要件管理システム。
					仕様変更の影響範囲を自動特定し、品質を担保します。
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.3 }}
					className="flex flex-col sm:flex-row items-center justify-center gap-4"
				>
					<Link
						href="/dashboard"
						className="group bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-gray-900/20"
					>
						Start for free
						<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
					</Link>
					<button
						type="button"
						className="text-gray-600 hover:text-gray-900 font-medium px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
					>
						Send me a demo
					</button>
				</motion.div>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.5 }}
					className="text-sm text-gray-400 mt-6"
				>
					No credit card required · Free 14-day trial
				</motion.p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.4 }}
				className="mt-20 max-w-5xl mx-auto"
			>
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl shadow-gray-900/30 overflow-hidden border border-gray-700">
					<div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
						<div className="w-3 h-3 rounded-full bg-red-500/80" />
						<div className="w-3 h-3 rounded-full bg-yellow-500/80" />
						<div className="w-3 h-3 rounded-full bg-green-500/80" />
						<span className="ml-4 text-xs text-gray-400 font-mono">req-manager.ai</span>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-12 gap-4">
							<div className="col-span-3 space-y-2">
								{["Dashboard", "Business", "System", "Schema", "Settings"].map((item) => (
									<div
										key={item}
										className="text-sm text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
									>
										{item}
									</div>
								))}
							</div>
							<div className="col-span-9 bg-gray-800/50 rounded-xl p-4">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
										<Sparkles className="w-4 h-4 text-violet-400" />
									</div>
									<span className="text-gray-300 font-medium">Ask AI</span>
								</div>
								<div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
									<p className="text-gray-400 text-sm">
										この変更が影響するシステム機能を特定してください...
									</p>
									<span className="inline-block mt-2 w-2 h-4 bg-violet-400 animate-pulse" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</motion.div>
		</section>
	);
}
