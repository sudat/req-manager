"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesignDocumentList } from "@/components/forms/design-document-list";
import { useDesignDocumentsForm } from "../hooks/useDesignDocumentsForm";
import { DEFAULT_PROJECT_ID } from "@/components/project/project-context";

export default function SystemFunctionEditDesignDocumentsPage({
	params,
}: {
	params: Promise<{ id: string; srfId: string }>;
}) {
	const { id: systemDomainId, srfId } = use(params);
	const router = useRouter();

	const {
		loading,
		saving,
		error,
		designDocuments,
		setDesignDocuments,
		handleSave,
	} = useDesignDocumentsForm(srfId, systemDomainId, DEFAULT_PROJECT_ID);

	if (loading) {
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
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-slate-900">
					編集: システム機能 - DD（Design Document）
				</h1>
			</div>

			{/* Form */}
			<div className="max-w-[1400px]">
				<DesignDocumentList
					srfId={srfId}
					items={designDocuments}
					onChange={setDesignDocuments}
				/>

				{/* Action Buttons */}
				<div className="mt-6 flex items-center gap-3">
					<Button onClick={handleSave} disabled={saving}>
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
