"use client";

import { motion } from "framer-motion";
import { FileText, ChevronDown } from "lucide-react";
import Link from "next/link";

const navItems = [
	{ label: "Platform", href: "#platform" },
	{ label: "Structure", href: "#structure" },
	{ label: "Workflow", href: "#workflow" },
	{ label: "Pricing", href: "#pricing" },
];

export function Nav() {
	return (
		<motion.nav
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			className="fixed top-4 left-4 right-4 z-50"
		>
			<div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm px-6 py-3">
				<div className="flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2 cursor-pointer group">
						<div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
							<FileText className="w-4 h-4 text-white" />
						</div>
						<span className="font-semibold text-gray-900 text-lg">Req Manager</span>
					</Link>

					<div className="hidden md:flex items-center gap-1">
						{navItems.map((item) => (
							<a
								key={item.label}
								href={item.href}
								className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
							>
								{item.label}
							</a>
						))}
					</div>

					<div className="flex items-center gap-3">
						<Link
							href="/dashboard"
							className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer hidden sm:block"
						>
							Sign in
						</Link>
						<Link
							href="/dashboard"
							className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
						>
							Start for free
						</Link>
					</div>
				</div>
			</div>
		</motion.nav>
	);
}
