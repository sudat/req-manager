"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { DataDesignContent } from "@/lib/domain/schemas/system-design";
import { AmbiguousWordLint } from "../ambiguous-word-lint";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";

interface DataDesignFormProps {
  content: DataDesignContent;
  onChange: (content: DataDesignContent) => void;
}

export function DataDesignForm({ content, onChange }: DataDesignFormProps) {
  const [newTable, setNewTable] = useState("");

  const addTable = () => {
    if (newTable.trim()) {
      onChange({
        ...content,
        tables: [...(content.tables || []), newTable.trim()],
      });
      setNewTable("");
    }
  };

  const removeTable = (index: number) => {
    onChange({
      ...content,
      tables: content.tables?.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="data-fields">対象項目 *</Label>
        <Textarea
          id="data-fields"
          placeholder="扱うデータ項目（カラム名、フィールド名など）"
          value={content.fields}
          onChange={(e) => onChange({ ...content, fields: e.target.value })}
          rows={3}
        />
        <AmbiguousWordLint text={content.fields} />
      </div>

      <div className="space-y-2">
        <Label>対象テーブル（任意）</Label>
        <div className="flex gap-2">
          <Input
            placeholder="テーブル名を入力"
            value={newTable}
            onChange={(e) => setNewTable(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTable();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addTable}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        {content.tables && content.tables.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {content.tables.map((table, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
              >
                <span>{table}</span>
                <button
                  type="button"
                  onClick={() => removeTable(index)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-constraints">制約条件（任意）</Label>
        <Textarea
          id="data-constraints"
          placeholder="NOT NULL、UNIQUE、外部キー制約など"
          value={content.constraints || ""}
          onChange={(e) =>
            onChange({ ...content, constraints: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.constraints || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-migration">マイグレーション（任意）</Label>
        <Textarea
          id="data-migration"
          placeholder="データ移行時の注意点、スクリプト概要など"
          value={content.migration || ""}
          onChange={(e) =>
            onChange({ ...content, migration: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.migration || ""} />
      </div>
    </div>
  );
}
