"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
	content: string;
	className?: string;
};

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
	if (!content || content.trim().length === 0) {
		return <span className="text-slate-500">未入力</span>;
	}

	return (
		<div className={`markdown-content text-[14px] text-slate-700 leading-relaxed ${className}`}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					h1: ({ children }) => <h1 className="text-[20px] font-semibold text-slate-900 mt-4 mb-2">{children}</h1>,
					h2: ({ children }) => <h2 className="text-[18px] font-semibold text-slate-900 mt-3 mb-2">{children}</h2>,
					h3: ({ children }) => <h3 className="text-[16px] font-semibold text-slate-900 mt-2 mb-1">{children}</h3>,
					p: ({ children }) => <p className="mb-2">{children}</p>,
					ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
					ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
					li: ({ children }) => <li className="text-[14px]">{children}</li>,
					strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
					em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
					code: ({ children }) => <code className="font-mono text-[13px] bg-slate-100 px-1 py-0.5 rounded text-slate-800">{children}</code>,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
