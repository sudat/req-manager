import type { Metadata } from "next";
import "./globals.css";
import { ProjectProvider } from "@/components/project/project-context";

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
				<ProjectProvider>{children}</ProjectProvider>
			</body>
		</html>
	);
}
