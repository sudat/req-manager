import { useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatProgressStep } from './types';

type ProgressStepsProps = {
  steps: ChatProgressStep[];
  isStreaming?: boolean;
};

export function ProgressSteps({ steps, isStreaming }: ProgressStepsProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const runningCount = steps.filter((step) => step.status === 'running').length;
  const doneCount = steps.filter((step) => step.status === 'done' || step.status === 'error').length;
  const currentCount = Math.min(doneCount + (runningCount > 0 ? 1 : 0), steps.length);
  const orderedSteps = [...steps].sort((a, b) => a.index - b.index);

  const statusLabel = (status: ChatProgressStep['status']) => {
    switch (status) {
      case 'running':
        return '進行中';
      case 'done':
        return '回答済';
      case 'error':
        return 'エラー';
      default:
        return status;
    }
  };

  const statusClass = (status: ChatProgressStep['status']) => {
    switch (status) {
      case 'running':
        return 'text-amber-600';
      case 'done':
        return 'text-emerald-600';
      case 'error':
        return 'text-rose-600';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 text-[12px] text-slate-600 hover:text-slate-800 cursor-pointer"
        aria-expanded={isOpen}
      >
        {isStreaming ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>処理中... ({currentCount}/{steps.length})</span>
          </>
        ) : (
          <>
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            <span>途中経過 ({steps.length}件)</span>
          </>
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        )}
      >
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2">
          {orderedSteps.map((step) => (
            <div
              key={`${step.id ?? 'step'}-${step.index}`}
              className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-slate-700">
                  Step {step.index}: {step.title}
                </span>
                <span className={cn('text-[10px] font-medium', statusClass(step.status))}>
                  {statusLabel(step.status)}
                </span>
              </div>
              {step.detail && (
                <div className="mt-1 text-[12px] text-slate-600 whitespace-pre-wrap break-words">
                  {step.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
