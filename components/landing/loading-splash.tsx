"use client";

import { motion } from "framer-motion";

export function LoadingSplash() {
	return (
		<motion.div
			className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0f0f1e]"
			initial={{ opacity: 1 }}
			animate={{ opacity: 0 }}
			transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
			exit={{ opacity: 0 }}
		>
			<motion.div
				className="text-center"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.6, delay: 0.2 }}
			>
				<motion.h1
					className="hero-title text-white mb-4"
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.4 }}
				>
					<span className="text-gradient">ReqManager</span>
				</motion.h1>

				<div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
					<motion.div
						className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
						initial={{ width: 0 }}
						animate={{ width: "100%" }}
						transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
					/>
				</div>
			</motion.div>
		</motion.div>
	);
}
