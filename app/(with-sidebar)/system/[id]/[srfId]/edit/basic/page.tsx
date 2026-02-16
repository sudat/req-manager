"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BasicInfoSection } from "../components/BasicInfoSection";
import { useBasicInfoForm } from "../hooks/useBasicInfoForm";
import { DEFAULT_PROJECT_ID } from "@/components/project/project-context";

export default function SystemFunctionEditBasicPage({
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
		existingSrf,
		category,
		setCategory,
		status,
		setStatus,
		title,
		setTitle,
		summary,
		setSummary,
		designPolicy,
		setDesignPolicy,
		handleSave,
	} = useBasicInfoForm(srfId, systemDomainId, DEFAULT_PROJECT_ID);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error || !existingSrf) {
		return (
			<div className="p-8">
				<div className="text-center text-rose-600">
					エラー: {error || "システム機能が見つかりません"}
				</div>
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
					編集: {existingSrf.title} - 基本情報
				</h1>
			</div>

			{/* Form */}
			<div className="max-w-[1400px]">
				<BasicInfoSection
					systemFunctionId={srfId}
					category={category}
					status={status}
					title={title}
					summary={summary}
					designPolicy={designPolicy}
					onCategoryChange={setCategory}
					onStatusChange={setStatus}
					onTitleChange={setTitle}
					onSummaryChange={setSummary}
					onDesignPolicyChange={setDesignPolicy}
				/>

				{/* Action Buttons */}
				<div className="mt-6 flex items-center gap-3">
					<Button onClick={() => handleSave(() => toast.success("基本情報を保存しました"))} disabled={saving}>
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
