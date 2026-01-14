"use client"

import { useSidebar } from "./sidebar-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <main
      className={cn(
        "flex-1 min-h-screen bg-white transition-all duration-300",
        isDesktop && (isCollapsed ? "ml-[64px]" : "ml-[280px]")
      )}
    >
      {children}
    </main>
  )
}
