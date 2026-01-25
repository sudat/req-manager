"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import type {
  DesignTarget,
  DesignTargetType,
} from "@/lib/domain/schemas/system-design";
import type { EntryPoint } from "@/lib/domain/value-objects";

interface DesignTargetSelectorProps {
  targets: DesignTarget[];
  selectedTargetName: string | null;
  entryPoints?: EntryPoint[];
  onTargetSelect: (targetName: string) => void;
  onTargetAdd: (target: DesignTarget) => void;
}

const TARGET_TYPE_LABELS: Record<DesignTargetType, string> = {
  screen: "画面",
  batch: "バッチ",
  api: "API",
  job: "ジョブ",
  template: "テンプレート",
  service: "サービス",
};

export function DesignTargetSelector({
  targets,
  selectedTargetName,
  entryPoints = [],
  onTargetSelect,
  onTargetAdd,
}: DesignTargetSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTargetName, setNewTargetName] = useState("");
  const [newTargetType, setNewTargetType] = useState<DesignTargetType>("screen");
  const [newTargetEntryPoint, setNewTargetEntryPoint] = useState<string | null>(null);

  const handleAddTarget = () => {
    if (newTargetName.trim()) {
      onTargetAdd({
        name: newTargetName.trim(),
        type: newTargetType,
        entryPoint: newTargetEntryPoint,
      });
      setNewTargetName("");
      setNewTargetType("screen");
      setNewTargetEntryPoint(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="flex gap-2 items-center mb-4">
      <Label htmlFor="target-select" className="min-w-[80px]">
        対象物
      </Label>
      <Select value={selectedTargetName || ""} onValueChange={onTargetSelect}>
        <SelectTrigger id="target-select" className="flex-1">
          <SelectValue placeholder="対象物を選択してください" />
        </SelectTrigger>
        <SelectContent position="popper">
          {targets.map((target) => (
            <SelectItem key={target.name} value={target.name}>
              {target.name} ({TARGET_TYPE_LABELS[target.type]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しい対象物を追加</DialogTitle>
            <DialogDescription>
              設計対象となる画面、バッチ、APIなどの情報を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target-name">名前 *</Label>
              <Input
                id="target-name"
                placeholder="例: 発行指示画面"
                value={newTargetName}
                onChange={(e) => setNewTargetName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-type">種別 *</Label>
              <Select
                value={newTargetType}
                onValueChange={(value) =>
                  setNewTargetType(value as DesignTargetType)
                }
              >
                <SelectTrigger id="target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-entry-point">エントリポイント</Label>
              <Select
                value={newTargetEntryPoint ?? undefined}
                onValueChange={(value) => setNewTargetEntryPoint(value || null)}
              >
                <SelectTrigger id="target-entry-point">
                  <SelectValue placeholder="なし（エントリポイントを選択）" />
                </SelectTrigger>
                <SelectContent>
                  {entryPoints.map((ep, index) => (
                    <SelectItem key={index} value={ep.path}>
                      {ep.path} {ep.type && `(${ep.type})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entryPoints.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  エントリポイントが未登録です
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleAddTarget} disabled={!newTargetName.trim()}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
