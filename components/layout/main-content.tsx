"use client"

import { usePathname } from "next/navigation"
import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const pathname = usePathname()
  const isChatRoute = pathname.startsWith("/chat")

  return (
    <main
      className={cn(
        "flex-1 h-full min-h-0 bg-white transition-all duration-300",
        isChatRoute ? "overflow-hidden" : "overflow-y-auto hide-scrollbar",
        isCollapsed ? "md:ml-[64px]" : "md:ml-[280px]"
      )}
    >
      {children}
    </main>
  )
}
