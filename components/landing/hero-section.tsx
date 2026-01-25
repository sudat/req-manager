"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FadeIn } from "./fade-in";

export function HeroSection() {
	return (
		<section className="min-h-[80vh] flex flex-col justify-center items-center text-center mb-24">
			<FadeIn delay={0}>
				<span className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium mb-8">
					要件管理の新標準
				</span>
			</FadeIn>

			<FadeIn delay={0.1}>
				<h1 className="hero-title text-white mb-6">
					<motion.span
						className="text-gradient"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.8, ease: "easeOut" }}
					>
						ReqManager
					</motion.span>
				</h1>
			</FadeIn>

			<FadeIn delay={0.2}>
				<p className="text-xl md:text-2xl text-white/70 font-light leading-relaxed max-w-2xl mb-4">
					要件・仕様変更の
				</p>
				<p className="text-xl md:text-2xl text-white/70 font-light leading-relaxed max-w-2xl mb-12">
					ベースライン管理
				</p>
			</FadeIn>

			<FadeIn delay={0.3}>
				<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
					<Link
						href="/dashboard"
						className="cta-button inline-flex items-center justify-center px-10 py-4 rounded-xl text-white font-semibold text-lg"
					>
						ダッシュボードへ
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
			</FadeIn>
		</section>
	);
}
