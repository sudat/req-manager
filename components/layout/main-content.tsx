"use client"

import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <main
      className={cn(
        "flex-1 min-h-screen bg-white transition-all duration-300",
        isCollapsed ? "md:ml-[64px]" : "md:ml-[280px]"
      )}
    >
      {children}
    </main>
  )
}
