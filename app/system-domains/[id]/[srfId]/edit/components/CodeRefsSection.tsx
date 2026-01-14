"use client";

import { Plus, Trash2, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { SystemFunction } from "@/lib/mock/data/types";
import type { CodeRef } from "../hooks/useSystemFunctionForm";

// ============================================
// 型定義
// ============================================

interface CodeRefsSectionProps {
	codeRefs: SystemFunction["codeRefs"];
	newCodeRef: CodeRef;
	onNewCodeRefChange: (ref: CodeRef) => void;
	onAddCodeRef: () => void;
	onRemoveCodeRef: (index: number) => void;
	onAddPath: () => void;
	onUpdatePath: (index: number, value: string) => void;
	onRemovePath: (index: number) => void;
}

// ============================================
// サブコンポーネント: コード参照カード
// ============================================

interface CodeRefCardProps {
	codeRef: SystemFunction["codeRefs"][number];
	onRemove: () => void;
}

function CodeRefCard({ codeRef, onRemove }: CodeRefCardProps) {
	return (
		<div className="rounded-md border border-slate-200 bg-white p-4">
			<div className="flex items-start justify-between mb-2">
				{codeRef.githubUrl && (
					<a
						href={codeRef.githubUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:underline"
					>
						<Github className="h-4 w-4" />
						GitHubリポジトリ
					</a>
				)}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onRemove}
					className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 ml-auto"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			{codeRef.note && (
				<div className="mb-2 text-[12px] text-slate-600">{codeRef.note}</div>
			)}
			<div className="space-y-1">
				{codeRef.paths.map((path, i) => (
					<div key={i} className="rounded-md bg-slate-50 p-2">
						<code className="text-[12px] text-slate-800 font-mono">{path}</code>
					</div>
				))}
			</div>
		</div>
	);
}

// ============================================
// サブコンポーネント: パス入力リスト
// ============================================

interface PathInputListProps {
	paths: string[];
	onUpdatePath: (index: number, value: string) => void;
	onRemovePath: (index: number) => void;
	onAddPath: () => void;
}

function PathInputList({
	paths,
	onUpdatePath,
	onRemovePath,
	onAddPath,
}: PathInputListProps) {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between">
				<Label className="text-xs">ファイルパス</Label>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onAddPath}
					className="h-6 text-xs"
				>
					<Plus className="h-3 w-3 mr-1" />
					パス追加
				</Button>
			</div>
			{paths.map((path, i) => (
				<div key={i} className="flex gap-2">
					<Input
						value={path}
						onChange={(e) => onUpdatePath(i, e.target.value)}
						placeholder="apps/billing/src/invoice/generateInvoice.ts"
						className="h-9"
					/>
					{paths.length > 1 && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onRemovePath(i)}
							className="h-9 w-9 p-0"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			))}
		</div>
	);
}

// ============================================
// サブコンポーネント: 新規コード参照フォーム
// ============================================

interface AddCodeRefFormProps {
	newCodeRef: CodeRef;
	onChange: (ref: CodeRef) => void;
	onAdd: () => void;
	onAddPath: () => void;
	onUpdatePath: (index: number, value: string) => void;
	onRemovePath: (index: number) => void;
}

function AddCodeRefForm({
	newCodeRef,
	onChange,
	onAdd,
	onAddPath,
	onUpdatePath,
	onRemovePath,
}: AddCodeRefFormProps) {
	return (
		<div className="border-t border-slate-200 pt-4">
			<h3 className="text-[13px] font-semibold text-slate-900 mb-3">
				コード参照を追加
			</h3>
			<div className="space-y-3">
				<div className="space-y-1">
					<Label className="text-xs">GitHub URL</Label>
					<Input
						value={newCodeRef.githubUrl}
						onChange={(e) =>
							onChange({
								...newCodeRef,
								githubUrl: e.target.value,
							})
						}
						placeholder="https://github.com/example/repo"
						className="h-9"
					/>
				</div>

				<PathInputList
					paths={newCodeRef.paths}
					onUpdatePath={onUpdatePath}
					onRemovePath={onRemovePath}
					onAddPath={onAddPath}
				/>

				<div className="space-y-1">
					<Label className="text-xs">備考（任意）</Label>
					<Input
						value={newCodeRef.note}
						onChange={(e) =>
							onChange({
								...newCodeRef,
								note: e.target.value,
							})
						}
						placeholder="メインロジックとテンプレート"
						className="h-9"
					/>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onAdd}
					disabled={!newCodeRef.githubUrl}
					className="h-8"
				>
					<Plus className="h-4 w-4 mr-1" />
					追加
				</Button>
			</div>
		</div>
	);
}

// ============================================
// メインコンポーネント
// ============================================

export function CodeRefsSection({
	codeRefs,
	newCodeRef,
	onNewCodeRefChange,
	onAddCodeRef,
	onRemoveCodeRef,
	onAddPath,
	onUpdatePath,
	onRemovePath,
}: CodeRefsSectionProps) {
	return (
		<Card className="rounded-md border border-slate-200/60 bg-white mb-4">
			<CardContent className="p-6">
				<h2 className="text-[20px] font-semibold text-slate-900 mb-4">
					コード参照
				</h2>

				{/* 既存のコード参照一覧 */}
				<div className="space-y-3 mb-4">
					{codeRefs.map((ref, index) => (
						<CodeRefCard
							key={index}
							codeRef={ref}
							onRemove={() => onRemoveCodeRef(index)}
						/>
					))}
					{codeRefs.length === 0 && (
						<div className="text-[13px] text-slate-500 text-center py-8">
							コード参照がありません
						</div>
					)}
				</div>

				{/* 新規コード参照追加フォーム */}
				<AddCodeRefForm
					newCodeRef={newCodeRef}
					onChange={onNewCodeRefChange}
					onAdd={onAddCodeRef}
					onAddPath={onAddPath}
					onUpdatePath={onUpdatePath}
					onRemovePath={onRemovePath}
				/>
			</CardContent>
		</Card>
	);
}
