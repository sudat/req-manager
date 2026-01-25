"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "./fade-in";

export function CTASection() {
	return (
		<FadeIn>
			<section className="text-center pb-16">
				<motion.div
					className="glass-card rounded-2xl p-12 max-w-3xl mx-auto"
					whileHover={{
						y: -4,
						boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
					}}
					transition={{ duration: 0.3 }}
				>
					<h2 className="text-2xl md:text-3xl font-bold text-white mb-4">今すぐ始めましょう</h2>
					<p className="text-white/60 mb-8">要件管理の効率化、一歩先へ</p>
					<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
						<Link
							href="/dashboard"
							className="cta-button inline-flex items-center justify-center px-10 py-4 rounded-xl text-white font-semibold text-lg"
						>
							ダッシュボードを開く
							<motion.svg
								className="ml-2 w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								animate={{ x: [0, 4, 0] }}
								transition={{
									duration: 1.5,
									repeat: Infinity,
									repeatType: "loop",
									ease: "easeInOut",
								}}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 7l5 5m0 0l-5 5m5-5H6"
								/>
							</motion.svg>
						</Link>
					</motion.div>
				</motion.div>
			</section>
		</FadeIn>
	);
}
