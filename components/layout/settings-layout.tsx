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
  { key: "domains", label: "影響領域マスタ", href: "/settings/domains", icon: Grid3x3 },
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
      <div className="h-fit w-[280px] rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`mb-2 flex items-center gap-3 rounded-md px-4 py-3 text-sm transition hover:bg-slate-50 ${
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
