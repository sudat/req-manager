import { Agentation } from "agentation"
import type { Metadata } from "next";
import "./globals.css";
import { ProjectProvider } from "@/components/project/project-context";
import { validateEnvVars } from "@/lib/config/env";
import { Toaster } from "@/components/ui/sonner";

// サーバーサイドでの環境変数バリデーション（起動時）
if (typeof window === "undefined") {
	const validation = validateEnvVars();
	if (!validation.valid && process.env.NODE_ENV === "development") {
		console.error("[Env Validation] " + validation.error);
		throw new Error(validation.error);
	}
}

export const metadata: Metadata = {
	title: "要件管理DB",
	description: "要件・仕様変更のベースライン管理ツール",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<body className="antialiased font-sans">
				<ProjectProvider>{children}</ProjectProvider>
				<Toaster position="bottom-right" />
				<Agentation />
			</body>
		</html>
	);
}
