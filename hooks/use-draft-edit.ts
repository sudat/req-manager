"use client";

import { useCallback, useRef, useState } from "react";

/**
 * 草案インライン編集フック
 *
 * 読取モード ↔ 編集モードを管理し、元のdraftのコピーを作成して安全に編集する。
 * 保存時に onSave を呼び出し、キャンセル時は元に戻す。
 */
export function useDraftEdit<T extends Record<string, unknown>>(
  draft: T,
  onSave?: (edited: T) => void,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingDraft, setEditingDraft] = useState<T | null>(null);
  const snapshotRef = useRef<T | null>(null);

  const startEdit = useCallback(() => {
    const copy = structuredClone(draft);
    snapshotRef.current = copy;
    setEditingDraft(copy);
    setIsEditing(true);
  }, [draft]);

  const cancelEdit = useCallback(() => {
    snapshotRef.current = null;
    setEditingDraft(null);
    setIsEditing(false);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingDraft && onSave) {
      onSave(editingDraft);
    }
    snapshotRef.current = null;
    setEditingDraft(null);
    setIsEditing(false);
  }, [editingDraft, onSave]);

  const updateField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setEditingDraft((prev) => {
        if (!prev) return prev;
        return { ...prev, [key]: value };
      });
    },
    [],
  );

  return {
    isEditing,
    /** 編集中のdraft（編集モードでない場合は元のdraftを返す） */
    currentDraft: editingDraft ?? draft,
    startEdit,
    cancelEdit,
    saveEdit,
    updateField,
    /** 編集機能が利用可能か（onSaveが渡されている場合のみtrue） */
    canEdit: Boolean(onSave),
  } as const;
}
