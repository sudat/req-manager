"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

const footerLinks = {
	platform: [
		{ href: "/dashboard", label: "Dashboard" },
		{ href: "/business", label: "Business" },
		{ href: "/system", label: "System" },
		{ href: "/baseline", label: "Baseline" },
	],
	support: [
		{ href: "/tickets", label: "Tickets" },
		{ href: "/ideas", label: "Ideas" },
		{ href: "/export", label: "Export" },
		{ href: "/settings", label: "Settings" },
	],
	company: [
		{ href: "#", label: "About" },
		{ href: "#", label: "Blog" },
		{ href: "#", label: "Careers" },
	],
};

export function Footer() {
	return (
		<footer className="bg-white border-t border-gray-100">
			<div className="max-w-6xl mx-auto px-6 py-16">
				<div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
					<div className="col-span-2">
						<Link href="/" className="flex items-center gap-2 cursor-pointer mb-4">
							<div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
								<FileText className="w-4 h-4 text-white" />
							</div>
							<span className="font-semibold text-gray-900 text-lg">Req Manager</span>
						</Link>
						<p className="text-gray-500 text-sm leading-relaxed max-w-xs">
							コーディングエージェントによる開発を支援する、次世代の要件管理システム。
						</p>
					</div>

					<div>
						<h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
						<ul className="space-y-3">
							{footerLinks.platform.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-gray-500 hover:text-gray-900 text-sm transition-colors cursor-pointer"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-semibold text-gray-900 mb-4">Support</h4>
						<ul className="space-y-3">
							{footerLinks.support.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-gray-500 hover:text-gray-900 text-sm transition-colors cursor-pointer"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-semibold text-gray-900 mb-4">Company</h4>
						<ul className="space-y-3">
							{footerLinks.company.map((link) => (
								<li key={link.label}>
									<Link
										href={link.href}
										className="text-gray-500 hover:text-gray-900 text-sm transition-colors cursor-pointer"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-gray-400 text-sm">© 2026 Req Manager. All rights reserved.</p>
					<div className="flex items-center gap-6">
						<Link
							href="#"
							className="text-gray-400 hover:text-gray-600 text-sm transition-colors cursor-pointer"
						>
							Privacy
						</Link>
						<Link
							href="#"
							className="text-gray-400 hover:text-gray-600 text-sm transition-colors cursor-pointer"
						>
							Terms
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
