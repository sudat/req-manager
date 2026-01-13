"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, TrendingUp, Grid3x3, Bell } from "lucide-react";
import { ReactNode } from "react";

interface SettingsLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { key: "settings", label: "プロジェクト設定", href: "/settings", icon: Settings },
  { key: "llm", label: "LLM設定", href: "/settings/llm", icon: TrendingUp },
  { key: "domains", label: "システム領域マスタ", href: "/settings/system-domains", icon: Grid3x3 },
  { key: "notification", label: "通知設定", href: "/settings/notification", icon: Bell },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-1 gap-8">
      <div className="h-fit w-[260px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
