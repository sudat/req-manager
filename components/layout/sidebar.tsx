"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Calendar,
  Edit3,
  Clock,
  FileText,
  Settings,
  Cpu
} from "lucide-react";

const primaryItems = [
  { key: "dashboard", label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { key: "query", label: "照会", href: "/query", icon: Search },
  { key: "business", label: "業務一覧", href: "/business", icon: BookOpen },
  { key: "tickets", label: "変更要求一覧", href: "/tickets", icon: Edit3 },
  { key: "baseline", label: "ベースライン履歴", href: "/baseline", icon: Clock },
  { key: "export", label: "エクスポート", href: "/export", icon: FileText },
];

const managementItems = [
  { key: "ideas", label: "概念辞書", href: "/ideas", icon: Calendar },
  { key: "srf", label: "システム機能", href: "/srf", icon: Cpu },
  { key: "settings", label: "設定", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] border-r border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-200 px-5 py-6">
        <h2 className="text-base font-semibold text-slate-900">要件管理ツール</h2>
      </div>
      <nav className="py-2">
        <ul className="space-y-0">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900 ${
                    active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 px-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          管理
        </div>
        <ul className="mt-2 space-y-0">
          {managementItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-slate-100 hover:text-slate-900 ${
                    active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
