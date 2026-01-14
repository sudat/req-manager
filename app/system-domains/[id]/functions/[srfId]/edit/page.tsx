"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import type { SystemFunction } from "@/lib/mock/data/types";
import { useSystemFunctionForm } from "./hooks/useSystemFunctionForm";
import {
	BasicInfoSection,
	SystemDesignSection,
	CodeRefsSection,
} from "./components";

// ============================================
// 型定義
// ============================================

interface PageProps {
	params: Promise<{ id: string; srfId: string }>;
}

// ============================================
// ローディング表示
// ============================================

function LoadingState() {
	return (
		<>
			<Sidebar />
			<div className="ml-[280px] flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-6 text-slate-500">
					読み込み中...
				</div>
			</div>
		</>
	);
}

// ============================================
// エラー表示（データ未取得）
// ============================================

interface NotFoundStateProps {
	systemDomainId: string;
	error: string | null;
}

function NotFoundState({
	systemDomainId,
	error,
}: NotFoundStateProps) {
	return (
		<>
			<Sidebar />
			<div className="ml-[280px] flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1400px] px-8 py-6">
					<div className="text-center py-20">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">
							システム機能が見つかりません
						</h1>
						{error && <p className="text-sm text-rose-600 mb-4">{error}</p>}
						<Link href={`/system-domains/${systemDomainId}`}>
							<Button className="bg-slate-900 hover:bg-slate-800">
								システム機能一覧に戻る
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</>
	);
}

// ============================================
// ページヘッダー
// ============================================

interface PageHeaderProps {
	srf: SystemFunction;
}

function PageHeader({ srf }: PageHeaderProps) {
	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<Link
					href={`/system-domains/${srf.systemDomainId}/functions/${srf.id}`}
					className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900"
				>
					<ArrowLeft className="h-4 w-4" />
					システム機能詳細に戻る
				</Link>
			</div>

			<div className="mb-6">
				<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
					編集: {srf.title}
				</h1>
				<p className="text-[13px] text-slate-500">
					システム機能の情報を編集します
				</p>
			</div>
		</>
	);
}

// ============================================
// アクションボタン
// ============================================

interface ActionButtonsProps {
	systemDomainId: string;
	srfId: string;
	saving: boolean;
	onSave: () => void;
}

function ActionButtons({
	systemDomainId,
	srfId,
	saving,
	onSave,
}: ActionButtonsProps) {
	return (
		<div className="flex gap-3">
			<Link href={`/system-domains/${systemDomainId}/functions/${srfId}`}>
				<Button type="button" variant="outline">
					キャンセル
				</Button>
			</Link>
			<Button
				type="button"
				className="bg-slate-900 hover:bg-slate-800"
				onClick={onSave}
				disabled={saving}
			>
				{saving ? "保存中..." : "保存"}
			</Button>
		</div>
	);
}

// ============================================
// メインページコンポーネント
// ============================================

export default function SystemFunctionEditPage({
	params,
}: PageProps) {
	const { id, srfId } = use(params);
	const router = useRouter();
	const { state, actions } = useSystemFunctionForm(srfId);

	// ローディング中
	if (state.loading) {
		return <LoadingState />;
	}

	// データ未取得
	if (!state.existingSrf) {
		return <NotFoundState systemDomainId={id} error={state.error} />;
	}

	// 保存処理
	async function handleSave(): Promise<void> {
		const success = await actions.save(id);
		if (success) {
			router.push(`/system-domains/${id}/functions/${srfId}`);
		}
	}

	return (
		<>
			<Sidebar />
			<div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1400px] px-8 py-6">
					<PageHeader srf={state.existingSrf} />

					<BasicInfoSection
						systemFunctionId={id}
						designDocNo={state.designDocNo}
						category={state.category}
						status={state.status}
						title={state.title}
						summary={state.summary}
						onDesignDocNoChange={actions.setDesignDocNo}
						onCategoryChange={actions.setCategory}
						onStatusChange={actions.setStatus}
						onTitleChange={actions.setTitle}
						onSummaryChange={actions.setSummary}
					/>

					<SystemDesignSection
						systemDesign={state.systemDesign}
						newDesignItem={state.newDesignItem}
						onNewDesignItemChange={actions.setNewDesignItem}
						onAddDesignItem={actions.addDesignItem}
						onRemoveDesignItem={actions.removeDesignItem}
					/>

					<CodeRefsSection
						codeRefs={state.codeRefs}
						newCodeRef={state.newCodeRef}
						onNewCodeRefChange={actions.setNewCodeRef}
						onAddCodeRef={actions.addCodeRef}
						onRemoveCodeRef={actions.removeCodeRef}
						onAddPath={actions.addPath}
						onUpdatePath={actions.updatePath}
						onRemovePath={actions.removePath}
					/>

					{state.error && (
						<p className="text-sm text-rose-600">{state.error}</p>
					)}

					<ActionButtons
						systemDomainId={id}
						srfId={srfId}
						saving={state.saving}
						onSave={handleSave}
					/>
				</div>
			</div>
		</>
	);
}
