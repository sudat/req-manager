"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { SectionHeader } from "@/components/settings/section-header";
import { StatusAlert } from "@/components/settings/status-alert";
import { SettingsActionBar } from "@/components/settings/settings-action-bar";

const defaultSettings = {
	changeRequestUpdates: true,
	suspectLinkAlerts: true,
	reviewRequests: true,
	weeklySummary: false,
};

type NotificationSettings = typeof defaultSettings;

const notificationItems: Array<{
	key: keyof NotificationSettings;
	title: string;
	description: string;
}> = [
	{
		key: "changeRequestUpdates",
		title: "変更要求の更新通知",
		description: "変更要求のステータスが変更されたときに通知します",
	},
	{
		key: "suspectLinkAlerts",
		title: "suspect link通知",
		description: "要再確認リンクが発生したときに通知します",
	},
	{
		key: "reviewRequests",
		title: "レビュー依頼通知",
		description: "レビューが依頼されたときに通知します",
	},
	{
		key: "weeklySummary",
		title: "週次サマリー",
		description: "毎週月曜日にプロジェクトのサマリーを送信します",
	},
];

export function NotificationSettingsContent() {
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
				{notificationItems.map((item) => (
					<div
						key={item.key}
						className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200"
					>
						<div className="space-y-1">
							<div className="text-[14px] font-medium text-slate-900">{item.title}</div>
							<div className="text-[13px] text-slate-500 leading-relaxed">{item.description}</div>
						</div>
						<Switch
							checked={settings[item.key]}
							onCheckedChange={(checked) =>
								setSettings((prev) => ({ ...prev, [item.key]: checked }))
							}
						/>
					</div>
				))}

				{error && <StatusAlert variant="warning" message={error} />}
				{success && <StatusAlert variant="success" message={success} />}

				<SettingsActionBar
					saving={saving}
					onReset={handleReset}
					onSave={handleSave}
					saveClassName="bg-slate-900 hover:bg-slate-800 h-8 px-6 text-[14px]"
				/>
			</div>
		</div>
	);
}
