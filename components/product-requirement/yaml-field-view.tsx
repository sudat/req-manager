"use client";

import { Label } from "@/components/ui/label";
import { parse, stringify } from "yaml";

type YamlFieldViewProps = {
	label: string;
	content: string | null;
};

export function YamlFieldView({ label, content }: YamlFieldViewProps) {
	// YAMLをパースして整形表示
	const formattedContent = (() => {
		if (!content) return null;
		try {
			const parsed = parse(content);
			if (typeof parsed === "object" && parsed !== null) {
				// オブジェクトの場合はインデント付きで表示
				return stringify(parsed, {
					indent: 2,
					lineWidth: 0,
				});
			}
			return content;
		} catch {
			// パース失敗時は元の内容を表示
			return content;
		}
	})();

	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium text-slate-700">{label}</Label>
			{formattedContent ? (
				<pre className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap break-words">
					{formattedContent}
				</pre>
			) : (
				<div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
					未設定
				</div>
			)}
		</div>
	);
}
