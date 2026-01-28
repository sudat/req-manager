"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function SectionHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className="mb-6">
			<h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
			{description && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>}
		</div>
	);
}

export function NotificationSettingsContent() {
	const defaultSettings = {
		changeRequestUpdates: true,
		suspectLinkAlerts: true,
		reviewRequests: true,
		weeklySummary: false,
	};
	const [settings, setSettings] = useState(defaultSettings);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		setSuccess(null);

		// ダミーの非同期処理
		await new Promise((resolve) => setTimeout(resolve, 300));

		// 未実装であることを表示（infoスタイル）
		setError("この機能はまだ実装されていません");
		setSaving(false);
	};

	const handleReset = () => {
		setSettings(defaultSettings);
		setSuccess(null);
		setError(null);
	};

	return (
		<div className="rounded-md border border-slate-200 bg-white p-6">
			<SectionHeader
				title="通知設定"
				description="プロジェクト内の活動に関する通知を管理します"
			/>

			<div className="space-y-4">
				<div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
					<div className="space-y-1">
						<div className="text-[14px] font-medium text-slate-900">変更要求の更新通知</div>
						<div className="text-[13px] text-slate-500 leading-relaxed">変更要求のステータスが変更されたときに通知します</div>
					</div>
					<Switch
						checked={settings.changeRequestUpdates}
						onCheckedChange={(checked) =>
							setSettings((prev) => ({ ...prev, changeRequestUpdates: checked }))
						}
					/>
				</div>

				<div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
					<div className="space-y-1">
						<div className="text-[14px] font-medium text-slate-900">suspect link通知</div>
						<div className="text-[13px] text-slate-500 leading-relaxed">要再確認リンクが発生したときに通知します</div>
					</div>
					<Switch
						checked={settings.suspectLinkAlerts}
						onCheckedChange={(checked) =>
							setSettings((prev) => ({ ...prev, suspectLinkAlerts: checked }))
						}
					/>
				</div>

				<div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
					<div className="space-y-1">
						<div className="text-[14px] font-medium text-slate-900">レビュー依頼通知</div>
						<div className="text-[13px] text-slate-500 leading-relaxed">レビューが依頼されたときに通知します</div>
					</div>
					<Switch
						checked={settings.reviewRequests}
						onCheckedChange={(checked) =>
							setSettings((prev) => ({ ...prev, reviewRequests: checked }))
						}
					/>
				</div>

				<div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
					<div className="space-y-1">
						<div className="text-[14px] font-medium text-slate-900">週次サマリー</div>
						<div className="text-[13px] text-slate-500 leading-relaxed">毎週月曜日にプロジェクトのサマリーを送信します</div>
					</div>
					<Switch
						checked={settings.weeklySummary}
						onCheckedChange={(checked) =>
							setSettings((prev) => ({ ...prev, weeklySummary: checked }))
						}
					/>
				</div>

				{error && (
					<div className="rounded-md border border-amber-200 bg-amber-50 p-3">
						<p className="text-[13px] text-amber-700">{error}</p>
					</div>
				)}

				{success && (
					<div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
						<p className="text-[13px] text-emerald-700">{success}</p>
					</div>
				)}

				<div className="flex justify-end gap-3 pt-4">
					<Button
						variant="outline"
						onClick={handleReset}
						disabled={saving}
						className="h-8 px-6"
					>
						リセット
					</Button>
					<Button
						onClick={handleSave}
						disabled={saving}
						className="bg-slate-900 hover:bg-slate-800 h-8 px-6 text-[14px]"
					>
						{saving ? "保存中..." : "保存"}
					</Button>
				</div>
			</div>
		</div>
	);
}
