import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AcDraft } from "./types";

// ---------------------------------------------------------------------------
// ProcessStepsEditor
// ---------------------------------------------------------------------------

type ProcessStep = { when: string; who: string; action: string };

type ProcessStepsEditorProps = {
  steps: ProcessStep[];
  onChange: (steps: ProcessStep[]) => void;
};

/**
 * 業務プロセスのインラインエディタ
 *
 * BT草案カード用。{when, who, action}[] を直接編集する。
 */
export function ProcessStepsEditor({ steps, onChange }: ProcessStepsEditorProps) {
  const update = (index: number, field: keyof ProcessStep, value: string) => {
    const next = steps.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    onChange(next);
  };
  const add = () => onChange([...steps, { when: "", who: "", action: "" }]);
  const remove = (index: number) => onChange(steps.filter((_, i) => i !== index));

  return (
    <div className="border-t border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
        <h4 className="text-[12px] font-semibold text-slate-700">業務プロセス</h4>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={add}>
          <Plus className="h-3 w-3" />
          追加
        </Button>
      </div>
      {steps.length === 0 ? (
        <div className="px-4 py-3 text-[12px] text-slate-500">プロセスなし</div>
      ) : (
        <table className="w-full text-[12px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">いつ</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">だれが</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">何を</th>
              <th className="w-10 border-b border-slate-200" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {steps.map((step, idx) => (
              <tr key={idx}>
                <td className="px-4 py-1.5">
                  <Input value={step.when} onChange={(e) => update(idx, "when", e.target.value)} className="h-7 text-[12px]" />
                </td>
                <td className="px-4 py-1.5">
                  <Input value={step.who} onChange={(e) => update(idx, "who", e.target.value)} className="h-7 text-[12px]" />
                </td>
                <td className="px-4 py-1.5">
                  <Input value={step.action} onChange={(e) => update(idx, "action", e.target.value)} className="h-7 text-[12px]" />
                </td>
                <td className="px-2 py-1.5">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => remove(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KeySourceEditor
// ---------------------------------------------------------------------------

type KeySourceItem = { name: string; source: string };

type KeySourceEditorProps = {
  label: string;
  sourceLabel?: string;
  items: KeySourceItem[];
  onChange: (items: KeySourceItem[]) => void;
};

/**
 * 名称/取得元（or 出力先）のインラインエディタ
 *
 * BT草案カード用。input/output の {name, source}[] を直接編集する。
 */
export function KeySourceEditor({ label, sourceLabel = "取得元", items, onChange }: KeySourceEditorProps) {
  const update = (index: number, field: keyof KeySourceItem, value: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  };
  const add = () => onChange([...items, { name: "", source: "" }]);
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="border-t border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
        <h4 className="text-[12px] font-semibold text-slate-700">{label}</h4>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={add}>
          <Plus className="h-3 w-3" />
          追加
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-3 text-[12px] text-slate-500">なし</div>
      ) : (
        <table className="w-full text-[12px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">名称</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600 border-b border-slate-200">{sourceLabel}</th>
              <th className="w-10 border-b border-slate-200" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-1.5">
                  <Input value={item.name} onChange={(e) => update(idx, "name", e.target.value)} className="h-7 text-[12px]" />
                </td>
                <td className="px-4 py-1.5">
                  <Input value={item.source} onChange={(e) => update(idx, "source", e.target.value)} className="h-7 text-[12px]" />
                </td>
                <td className="px-2 py-1.5">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => remove(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AcDraftEditor
// ---------------------------------------------------------------------------

type AcDraftEditorProps = {
  acs: AcDraft[];
  onChange: (acs: AcDraft[]) => void;
};

/**
 * 受入基準（AC）のインラインエディタ
 *
 * SR草案カード用。AcDraft[] を直接編集する。
 */
export function AcDraftEditor({ acs, onChange }: AcDraftEditorProps) {
  const update = (index: number, field: keyof AcDraft, value: string) => {
    const next = acs.map((ac, i) => (i === index ? { ...ac, [field]: value } : ac));
    onChange(next);
  };
  const add = () =>
    onChange([...acs, { code: `AC-NEW-${acs.length + 1}`, given: "", when: "", then: "" }]);
  const remove = (index: number) => onChange(acs.filter((_, i) => i !== index));

  return (
    <div className="border-t border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
        <h4 className="text-[12px] font-semibold text-slate-700">受入基準 ({acs.length}件)</h4>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={add}>
          <Plus className="h-3 w-3" />
          追加
        </Button>
      </div>
      {acs.length === 0 ? (
        <div className="px-4 py-3 text-[12px] text-slate-500">受入基準なし</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {acs.map((ac, idx) => (
            <div key={ac.code} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">{ac.code}</span>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-600" onClick={() => remove(idx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center">
                <span className="text-[11px] font-medium text-slate-500">Given:</span>
                <Input value={ac.given} onChange={(e) => update(idx, "given", e.target.value)} className="h-7 text-[11px]" />
                <span className="text-[11px] font-medium text-slate-500">When:</span>
                <Input value={ac.when} onChange={(e) => update(idx, "when", e.target.value)} className="h-7 text-[11px]" />
                <span className="text-[11px] font-medium text-slate-500">Then:</span>
                <Input value={ac.then} onChange={(e) => update(idx, "then", e.target.value)} className="h-7 text-[11px]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
