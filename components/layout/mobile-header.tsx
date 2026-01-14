"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "./sidebar-context"

export function MobileHeader() {
  const { toggleMobileOpen } = useSidebar()

  return (
    <div className="sticky top-0 z-30 bg-white border-b md:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={toggleMobileOpen}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-slate-900">要件管理ツール</span>
      </div>
    </div>
  )
}
