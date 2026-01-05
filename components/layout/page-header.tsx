import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeMeta?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  badgeMeta,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {badge ? (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <Badge className="bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100">
            {badge}
          </Badge>
        </div>
      ) : (
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      )}
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {badgeMeta && <p className="mt-2 text-xs text-slate-500">{badgeMeta}</p>}
      {children}
    </div>
  );
}
