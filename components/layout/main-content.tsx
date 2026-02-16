"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"
import { buildDocumentTitle } from "@/lib/ui/page-title"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const pathname = usePathname()
  const isChatRoute = pathname.startsWith("/chat")

  useEffect(() => {
    const nextTitle = buildDocumentTitle(pathname)
    const syncTitle = () => {
      if (document.title !== nextTitle) {
        document.title = nextTitle
      }
    }

    syncTitle()
    const rafId = window.requestAnimationFrame(() => {
      syncTitle()
    })
    const timeoutId = window.setTimeout(syncTitle, 0)
    let retryCount = 0
    const intervalId = window.setInterval(() => {
      syncTitle()
      retryCount += 1
      if (retryCount >= 20) {
        window.clearInterval(intervalId)
      }
    }, 200)

    const observer = new MutationObserver(syncTitle)
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
      observer.disconnect()
    }
  }, [pathname])

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
