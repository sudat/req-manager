"use client";

type MarkdownGuideProps = {
	className?: string;
};

/**
 * Markdown記法ガイドコンポーネント
 */
export function MarkdownGuide({ className = "" }: MarkdownGuideProps) {
	return (
		<div className={`p-2 bg-slate-50 border border-slate-200 rounded-md ${className}`}>
			<div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
				Markdown記法ガイド
			</div>
			<div className="text-[12px] text-slate-600 space-y-1">
				<p>
					<strong>見出し:</strong> ## 見出し2 ### 見出し3
				</p>
				<p>
					<strong>箇条書き:</strong> - 項目1
				</p>
				<p>
					<strong>番号付き:</strong> 1. 項目1
				</p>
				<p>
					<strong>強調:</strong> **太字** *斜体*
				</p>
			</div>
			<div className="mt-2 pt-2 border-t border-slate-200">
				<div className="text-[11px] font-semibold text-slate-600 mb-1">記載例:</div>
				<div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200 font-mono whitespace-pre-wrap">
					{"## プロセス概要\n\n"}- **担当者**が**タイミング**で**アクション**を実行
					{"  1. 最初の手順\n  2. 次の手順\n\n"}## 注意事項
					{"\n\n"}* 重要なポイントは箇条書きで
				</div>
			</div>
		</div>
	);
}
