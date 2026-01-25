"use client";

import { FadeIn, CountUp } from "./index";

interface StatItem {
	value: string | number;
	suffix?: string;
	label: string;
}

const stats: StatItem[] = [
	{ value: "80", suffix: "%", label: "要件変更効率化" },
	{ value: "0", label: "変更漏れ" },
	{ value: "1", label: "クリックで移行" },
];

export function StatsSection() {
	return (
		<section className="mb-24">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
				{stats.map((stat, index) => (
					<FadeIn key={index} delay={index * 0.1}>
						<div className="text-center">
							<CountUp value={stat.value} suffix={stat.suffix} />
							<p className="text-white/60 text-sm">{stat.label}</p>
						</div>
					</FadeIn>
				))}
			</div>
		</section>
	);
}
