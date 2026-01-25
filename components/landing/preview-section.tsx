"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "./fade-in";

export function PreviewSection() {
	return (
		<FadeIn>
			<section className="mb-24">
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						直感的なダッシュボード
					</h2>
					<p className="text-white/60 text-lg">一目で把握できる要件管理の全体像</p>
				</div>

				<motion.div
					className="relative max-w-5xl mx-auto"
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.8, ease: "easeOut" }}
				>
					<div className="glass-card rounded-2xl p-2 md:p-3">
						<img
							src="/images/dashboard-preview.png"
							alt="ReqManager ダッシュボード"
							className="w-full rounded-xl shadow-2xl"
						/>
					</div>

					<motion.div
						className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8 pointer-events-none"
						whileHover={{ opacity: 1 }}
					>
						<Link
							href="/dashboard"
							className="pointer-events-auto cta-button inline-flex items-center justify-center px-8 py-3 rounded-xl text-white font-semibold"
						>
							ダッシュボードを体験する
							<svg
								className="ml-2 w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 7l5 5m0 0l-5 5m5-5H6"
								/>
							</svg>
						</Link>
					</motion.div>
				</motion.div>
			</section>
		</FadeIn>
	);
}
