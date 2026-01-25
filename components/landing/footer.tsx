"use client";

import Link from "next/link";

interface FooterLink {
	href: string;
	label: string;
}

interface FooterSection {
	title: string;
	links: FooterLink[];
}

const footerSections: FooterSection[] = [
	{
		title: "プロダクト",
		links: [
			{ href: "/dashboard", label: "ダッシュボード" },
			{ href: "/business", label: "業務一覧" },
			{ href: "/system-domains", label: "システム領域" },
			{ href: "/baseline", label: "ベースライン履歴" },
		],
	},
	{
		title: "サポート",
		links: [
			{ href: "/settings", label: "設定" },
			{ href: "/tickets", label: "変更要求一覧" },
			{ href: "/export", label: "エクスポート" },
		],
	},
];

export function Footer() {
	return (
		<footer className="border-t border-white/10">
			<div className="max-w-7xl mx-auto px-6 py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
					<div className="md:col-span-2">
						<h3 className="text-2xl font-bold text-white mb-4">
							<span className="text-gradient">ReqManager</span>
						</h3>
						<p className="text-white/60 leading-relaxed max-w-md">
							要件・仕様変更のベースライン管理を効率化。変更履歴の自動追跡、ベースライン比較、影響分析をワンストップで実現。
						</p>
					</div>

					{footerSections.map((section) => (
						<div key={section.title}>
							<h4 className="text-white font-semibold mb-4">{section.title}</h4>
							<ul className="space-y-2">
								{section.links.map((link) => (
									<li key={link.href}>
										<Link href={link.href} className="footer-link">
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
					<p className="text-white/40 text-sm">© 2026 ReqManager. All rights reserved.</p>
					<div className="flex items-center gap-6">
						<Link href="/settings" className="footer-link text-sm">
							プライバシー
						</Link>
						<Link href="/settings" className="footer-link text-sm">
							利用規約
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
