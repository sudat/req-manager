"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Boxes,
  Briefcase,
  Download,
  History,
  LayoutDashboard,
  ListChecks,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"

const primaryItems = [
  { key: "dashboard", label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { key: "query", label: "照会", href: "/query", icon: Search },
  { key: "business", label: "業務一覧", href: "/business", icon: Briefcase },
  { key: "tickets", label: "変更要求一覧", href: "/tickets", icon: ListChecks },
  { key: "baseline", label: "ベースライン履歴", href: "/baseline", icon: History },
  { key: "export", label: "エクスポート", href: "/export", icon: Download },
]

const managementItems = [
  { key: "ideas", label: "概念辞書", href: "/ideas", icon: BookOpen },
  { key: "system-domains", label: "システム領域一覧", href: "/system-domains", icon: Boxes },
  { key: "settings", label: "設定", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const { isCollapsed, isMobileOpen, setIsMobileOpen, toggleCollapsed } = useSidebar()
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const handleLinkClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false)
    }
  }

  const menuContent = (
    <>
      <div className="border-b border-slate-200 px-5 py-6">
        <h2 className="text-base font-semibold text-slate-900">要件管理ツール</h2>
      </div>
      <nav className="py-2">
        <ul className="space-y-0">
          {primaryItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900",
                    active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mx-5 my-2 h-px bg-slate-200" aria-hidden="true" />
        <div className="mt-4 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          管理
        </div>
        <ul className="mt-2 space-y-0">
          {managementItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900",
                    active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )

  return (
    <>
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          className="w-[80%] max-w-[300px] p-0 bg-white md:hidden"
          overlayClassName="md:hidden"
        >
          {menuContent}
        </SheetContent>
      </Sheet>
      <aside
        className={cn(
          "fixed left-0 top-0 hidden h-screen overflow-hidden border-r border-slate-200 bg-white/95 backdrop-blur transition-all duration-300 md:block",
          isCollapsed ? "w-[64px]" : "w-[280px]"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="absolute right-3 top-5"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>

        {!isCollapsed && (
          <div className="border-b border-slate-200 px-5 py-6">
            <h2 className="text-base font-semibold text-slate-900">要件管理ツール</h2>
          </div>
        )}
        <nav className={cn("flex flex-col py-2 pb-6", isCollapsed && "pt-[90px]")}>
          <ul className={cn("flex flex-col space-y-0", isCollapsed && "space-y-1.5")}>
            {primaryItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon

              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900",
                      isCollapsed && "justify-center px-0 py-2.5",
                      active
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-slate-600"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span
                      className={cn(
                        "transition-opacity duration-300",
                        isCollapsed && "sr-only"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div
            className={cn("mx-5 my-2 h-px bg-slate-200", isCollapsed && "mx-3 my-1")}
            aria-hidden="true"
          />
          {!isCollapsed && (
            <div className="mt-4 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              管理
            </div>
          )}
          <ul
            className={cn(
              "mt-2 flex flex-col space-y-0",
              isCollapsed && "mt-1 space-y-1.5"
            )}
          >
            {managementItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon

              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900",
                      isCollapsed && "justify-center px-0 py-2.5",
                      active
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-slate-600"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span
                      className={cn(
                        "transition-opacity duration-300",
                        isCollapsed && "sr-only"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
