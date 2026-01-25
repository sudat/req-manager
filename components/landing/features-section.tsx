"use client";

import { motion } from "framer-motion";
import { FadeIn, FeatureCard } from "./index";

interface Feature {
	icon: string;
	title: string;
	description: string;
}

const features: Feature[] = [
	{
		icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
		title: "変更履歴の自動追跡",
		description:
			"すべての要件変更を自動的に記録。誰がいつ何を変更したか、一目で把握できます。",
	},
	{
		icon: "M13 10V3L4 14h7v7l9-11h-7z",
		title: "ベースライン比較",
		description:
			"任意のタイミングでベースラインを作成し、現在の状態との差分を簡単に確認できます。",
	},
	{
		icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
		title: "影響分析の自動化",
		description:
			"要件変更の影響範囲を自動的に分析。関連するドキュメントやタスクを即座に把握できます。",
	},
];

const iconGradients = [
	"from-indigo-500 to-purple-500",
	"from-cyan-500 to-blue-500",
	"from-pink-500 to-rose-500",
];

export function FeaturesSection() {
	return (
		<section className="mb-24">
			<FadeIn>
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">3つの特徴</h2>
					<p className="text-white/60 text-lg">要件管理の課題を解決する機能</p>
				</div>
			</FadeIn>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
				{features.map((feature, index) => (
					<FeatureCard key={index} index={index}>
						<motion.div
							className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconGradients[index]} flex items-center justify-center mb-6`}
							whileHover={{ rotate: 360, scale: 1.1 }}
							transition={{ duration: 0.6 }}
						>
							<svg
								className="w-6 h-6 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d={feature.icon}
								/>
							</svg>
						</motion.div>
						<h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
						<p className="text-white/60 leading-relaxed">{feature.description}</p>
					</FeatureCard>
				))}
			</div>
		</section>
	);
}
