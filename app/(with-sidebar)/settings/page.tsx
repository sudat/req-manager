"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ProjectSettingsContent } from "@/components/settings/project-settings-content";
import { LLMSettingsContent } from "@/components/settings/llm-settings-content";
import { NotificationSettingsContent } from "@/components/settings/notification-settings-content";

export default function SettingsPage() {
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

					{/* Stateベースのタブ */}
					<Tabs defaultValue="project" className="w-full">
						<TabsList className="w-full justify-start">
							<TabsTrigger value="project" className="px-6">プロジェクト設定</TabsTrigger>
							<TabsTrigger value="llm" className="px-6">LLM設定</TabsTrigger>
							<TabsTrigger value="notification" className="px-6">通知設定</TabsTrigger>
						</TabsList>

						<TabsContent value="project" className="mt-6">
							<ProjectSettingsContent />
						</TabsContent>

						<TabsContent value="llm" className="mt-6">
							<LLMSettingsContent />
						</TabsContent>

						<TabsContent value="notification" className="mt-6">
							<NotificationSettingsContent />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</>
	);
}
