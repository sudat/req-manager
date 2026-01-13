"use client"

import { Sidebar } from "@/components/layout/sidebar";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { confirmDelete } from "@/lib/ui/confirm";
import { createSystemDomain, deleteSystemDomain, listSystemDomains, updateSystemDomain, type SystemDomain } from "@/lib/data/system-domains";

const domainCodePattern = /^[A-Z_-]+$/;

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export default function DomainsSettingsPage() {
  const [domains, setDomains] = useState<SystemDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingDomain, setEditingDomain] = useState<SystemDomain | null>(null);
  const [formState, setFormState] = useState({
    id: "",
    name: "",
    description: "",
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchDomains = async () => {
      setLoading(true);
      const { data, error: fetchError } = await listSystemDomains();
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        setDomains([]);
      } else {
        setError(null);
        setDomains(data ?? []);
      }
      setLoading(false);
    };
    fetchDomains();
    return () => {
      active = false;
    };
  }, []);

  const isCodeValid = useMemo(() => domainCodePattern.test(formState.id.trim()), [formState.id]);
  const canSave = useMemo(
    () => formState.id.trim() && formState.name.trim() && isCodeValid,
    [formState.id, formState.name, isCodeValid],
  );

  const openCreate = () => {
    setDialogMode("create");
    setEditingDomain(null);
    setFormState({ id: "", name: "", description: "", sortOrder: domains.length + 1 });
  };

  const openEdit = (domain: SystemDomain) => {
    setDialogMode("edit");
    setEditingDomain(domain);
    setFormState({
      id: domain.id,
      name: domain.name,
      description: domain.description ?? "",
      sortOrder: domain.sortOrder ?? 0,
    });
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingDomain(null);
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (dialogMode === "create") {
        const { data, error: createError } = await createSystemDomain({
          id: formState.id.trim(),
          name: formState.name.trim(),
          description: formState.description.trim(),
          sortOrder: Number(formState.sortOrder) || 0,
        });
        if (createError) {
          setError(createError);
          return;
        }
        setDomains((prev) => [...prev, data!].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        closeDialog();
      } else if (dialogMode === "edit" && editingDomain) {
        const { data, error: updateError } = await updateSystemDomain(editingDomain.id, {
          name: formState.name.trim(),
          description: formState.description.trim(),
          sortOrder: Number(formState.sortOrder) || 0,
        });
        if (updateError) {
          setError(updateError);
          return;
        }
        setDomains((prev) =>
          prev
            .map((item) => (item.id === editingDomain.id ? data! : item))
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        );
        closeDialog();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (domain: SystemDomain) => {
    if (!confirmDelete(`${domain.name}（${domain.id}）`)) return;
    const { error: deleteError } = await deleteSystemDomain(domain.id);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    setDomains((prev) => prev.filter((item) => item.id !== domain.id));
  };
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1200px] px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              設定
            </h1>
            <p className="text-[13px] text-slate-500">
              プロジェクトとシステムの設定を管理
            </p>
          </div>

          <SettingsLayout>
            <div className="rounded-md border border-slate-200 bg-white p-6">
              <SectionHeader
                title="システム領域マスタ"
                description="システム領域（ドメイン）を管理します"
                action={
                  <Button className="bg-slate-900 hover:bg-slate-800 gap-2 h-8 px-6 text-[14px]" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    領域を追加
                  </Button>
                }
              />

              <div className="space-y-4">
                {error && <p className="text-[13px] text-rose-600">{error}</p>}
                {loading ? (
                  <div className="text-[13px] text-slate-500">読み込み中...</div>
                ) : domains.length === 0 ? (
                  <div className="text-[13px] text-slate-500">まだ登録されていません。</div>
                ) : (
                  domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="flex items-center gap-4 rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200"
                    >
                      <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 font-mono text-[12px] font-medium px-2 py-0.5">
                        {domain.id}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-[14px] font-semibold text-slate-900">{domain.name}</div>
                        <div className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{domain.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                          title="編集"
                          onClick={() => openEdit(domain)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                          title="削除"
                          onClick={() => handleDelete(domain)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </SettingsLayout>
        </div>
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[16px]">
              {dialogMode === "create" ? "システム領域を追加" : "システム領域を編集"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">コード</Label>
              <Input
                value={formState.id}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    id: event.target.value.toUpperCase().replace(/\s+/g, ""),
                  }))
                }
                placeholder="例: AR"
                disabled={dialogMode === "edit"}
              />
              {!isCodeValid && formState.id.trim().length > 0 && (
                <p className="text-[11px] text-rose-600">英字と記号（-、_）のみ入力できます</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">名称</Label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="例: 債権管理"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">説明</Label>
              <Input
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="例: 売掛金管理、請求書発行、入金消込、債権回収"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">表示順</Label>
              <Input
                type="number"
                value={String(formState.sortOrder)}
                onChange={(event) => setFormState((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))}
                placeholder="例: 1"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog} className="h-8 text-[14px]">
              キャンセル
            </Button>
            <Button
              className="h-8 text-[14px] bg-slate-900 hover:bg-slate-800"
              onClick={handleSave}
              disabled={!canSave || saving}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
