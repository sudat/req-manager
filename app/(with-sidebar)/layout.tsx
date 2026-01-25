import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ProjectProvider } from "@/components/project/project-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MainContent } from "@/components/layout/main-content";

export default function WithSidebarLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<ProjectProvider>
				<div className="flex min-h-screen">
					<Sidebar />
					<MainContent>{children}</MainContent>
				</div>
			</ProjectProvider>
		</SidebarProvider>
	);
}
