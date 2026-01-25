"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
	CustomCursor,
	LoadingSplash,
	ScrollProgressBar,
	ParticleBackground,
	HeroSection,
	StatsSection,
	FeaturesSection,
	PreviewSection,
	CTASection,
	Footer,
} from "@/components/landing";

export default function Home() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1500);

		return () => clearTimeout(timer);
	}, []);

	return (
		<>
			<AnimatePresence mode="wait">
				{isLoading && <LoadingSplash />}
			</AnimatePresence>

			{!isLoading && <ScrollProgressBar />}

			<CustomCursor />

			<motion.div
				className="mesh-gradient min-h-screen relative overflow-hidden"
				initial={{ opacity: 0 }}
				animate={{ opacity: isLoading ? 0 : 1 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<ParticleBackground />

				<div
					className="absolute inset-0 opacity-10"
					style={{
						backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
             linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
						backgroundSize: "60px 60px",
					}}
				/>

				<div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
					<HeroSection />
					<StatsSection />
					<FeaturesSection />
					<PreviewSection />
					<CTASection />
					<Footer />
				</div>
			</motion.div>
		</>
	);
}
