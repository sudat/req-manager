"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DesignDocumentList } from "@/components/forms/design-document-list";
import { useDesignDocumentsForm } from "../hooks/useDesignDocumentsForm";
import { DEFAULT_PROJECT_ID, useProject } from "@/components/project/project-context";

export default function SystemFunctionEditDesignDocumentsPage({
	params,
}: {
	params: Promise<{ id: string; srfId: string }>;
}) {
	const { id: systemDomainId, srfId } = use(params);
	const router = useRouter();
	const { currentProjectId, loading: projectLoading } = useProject();
	const projectId = currentProjectId ?? DEFAULT_PROJECT_ID;

	const {
		loading,
		saving,
		error,
		designDocuments,
		setDesignDocuments,
		allModelDDs,
		allDDs,
		allSFs,
		handleSave,
	} = useDesignDocumentsForm(srfId, systemDomainId, projectId);

	if (projectLoading || loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error && loading) {
		return (
			<div className="p-8">
				<div className="text-center text-rose-600">エラー: {error}</div>
			</div>
		);
	}

	return (
		<div className="p-8">
			{/* Back Link */}
			<Link
				href={`/system/${systemDomainId}/${srfId}`}
				className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
			>
				<ArrowLeft className="h-4 w-4" />
				システム機能詳細に戻る
			</Link>

			{/* Page Title */}
			<div className="mb-6 flex items-center gap-2">
				<h1 className="text-2xl font-bold text-slate-900">
					編集: システム機能 - DD（Design Document）
				</h1>
				<Badge
					variant="outline"
					className="font-mono text-xs font-semibold border-emerald-300 bg-emerald-100 text-emerald-800 px-2 py-0.5"
				>
					{designDocuments.length}
				</Badge>
			</div>

			{/* Form */}
			<div className="max-w-[1400px]">
				<DesignDocumentList
					srfId={srfId}
					items={designDocuments}
					onChange={setDesignDocuments}
					modelDDs={allModelDDs}
					allDDs={allDDs}
					allSFs={allSFs}
				/>

				{/* Action Buttons */}
				<div className="mt-6 flex items-center gap-3">
					<Button onClick={() => handleSave(() => toast.success("DDを保存しました"))} disabled={saving}>
						{saving ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								保存中...
							</>
						) : (
							"保存"
						)}
					</Button>
					<Button
						variant="outline"
						onClick={() => router.push(`/system/${systemDomainId}/${srfId}`)}
						disabled={saving}
					>
						キャンセル
					</Button>
				</div>

				{/* Error Message */}
				{error && (
					<div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}
