import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MainContent } from "@/components/layout/main-content";

export const metadata: Metadata = {
	title: "要件管理ツール",
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
				<SidebarProvider>
					<div className="flex min-h-screen">
						<Sidebar />
						<MainContent>{children}</MainContent>
					</div>
				</SidebarProvider>
			</body>
		</html>
	);
}
