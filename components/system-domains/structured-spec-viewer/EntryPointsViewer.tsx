"use client";

import type { ReactNode } from "react";
import { FileCode2 } from "lucide-react";
import type { EntryPoint } from "@/lib/domain";

interface EntryPointsViewerProps {
  entryPoints: EntryPoint[];
}

export function EntryPointsViewer({ entryPoints }: EntryPointsViewerProps): ReactNode {
  if (entryPoints.length === 0) {
    return <div className="text-sm text-slate-400 italic">未設定</div>;
  }

  return (
    <div className="space-y-4">
      {entryPoints.map((entry, index) => (
        <div key={index} className="flex items-start gap-2 text-[13px] pb-2">
          <FileCode2 className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <code className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {entry.path}
            </code>
            {(entry.type || entry.responsibility) && (
              <div className="text-[12px] text-slate-600 mt-1">
                {entry.type && (
                  <span className="font-medium">({entry.type})</span>
                )}
                {entry.type && entry.responsibility && " "}
                {entry.responsibility && (
                  <span className="text-slate-500">- {entry.responsibility}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
