"use client";

import { useEffect, useState } from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { useProject } from "@/components/project/project-context";

function SectionHeader({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	return (
		<div className="mb-6">
			<h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
			{description && (
				<p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
					{description}
				</p>
			)}
		</div>
	);
}

export default function SettingsPage() {
	const { currentProject } = useProject();

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-white">
				<div className="mx-auto max-w-[1200px] px-8 py-6">
					{/* Page Header */}
					<div className="mb-6">
						<h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
							設定
						</h1>
						<p className="text-[13px] text-slate-500">
							プロジェクトとシステムの設定を管理
						</p>
					</div>

					<SettingsLayout>
						<div className="rounded-md border border-slate-200 bg-white p-6">
							<SectionHeader
								title="プロジェクト設定"
								description="プロジェクト固有の設定はプロジェクト編集画面から管理できます"
							/>

							<div className="text-[13px] text-slate-600 leading-relaxed">
								<p>GitHubリポジトリ、要確認リンク判定基準、自動保存などの設定は、</p>
								<p className="mt-1">各プロジェクトの編集画面から変更できます。</p>
							</div>
						</div>
					</SettingsLayout>
				</div>
			</div>
		</>
	);
}
