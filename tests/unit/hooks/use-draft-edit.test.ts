import { Window } from "happy-dom";

// happy-dom でDOM環境をセットアップ
const window = new Window();
Object.assign(globalThis, {
  document: window.document,
  window,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
});

import { describe, it, expect, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useDraftEdit } from "../../../hooks/use-draft-edit";

type TestDraft = {
  code: string;
  name: string;
  items: string[];
};

const baseDraft: TestDraft = {
  code: "BT-001",
  name: "テスト業務",
  items: ["a", "b"],
};

describe("useDraftEdit", () => {
  it("初期状態では編集モードOFFで元のdraftを返す", () => {
    const { result } = renderHook(() => useDraftEdit(baseDraft));
    expect(result.current.isEditing).toBe(false);
    expect(result.current.currentDraft).toBe(baseDraft);
  });

  it("onSaveが未指定のときcanEditはfalse", () => {
    const { result } = renderHook(() => useDraftEdit(baseDraft));
    expect(result.current.canEdit).toBe(false);
  });

  it("onSaveが指定されているときcanEditはtrue", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));
    expect(result.current.canEdit).toBe(true);
  });

  it("startEditで編集モードON、draftのコピーが作られる", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));

    act(() => result.current.startEdit());

    expect(result.current.isEditing).toBe(true);
    expect(result.current.currentDraft).toEqual(baseDraft);
    expect(result.current.currentDraft).not.toBe(baseDraft);
  });

  it("updateFieldでフィールドを更新できる", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));

    act(() => result.current.startEdit());
    act(() => result.current.updateField("name", "更新後の名前"));

    expect(result.current.currentDraft.name).toBe("更新後の名前");
    expect(result.current.currentDraft.code).toBe("BT-001");
  });

  it("updateFieldで配列フィールドを丸ごと置換できる", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));

    act(() => result.current.startEdit());
    act(() => result.current.updateField("items", ["x", "y", "z"]));

    expect(result.current.currentDraft.items).toEqual(["x", "y", "z"]);
  });

  it("cancelEditで元のdraftに戻り、編集モードOFF", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));

    act(() => result.current.startEdit());
    act(() => result.current.updateField("name", "変更中"));
    act(() => result.current.cancelEdit());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.currentDraft).toBe(baseDraft);
  });

  it("saveEditでonSaveが呼ばれ、編集モードOFF", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));

    act(() => result.current.startEdit());
    act(() => result.current.updateField("name", "保存する名前"));
    act(() => result.current.saveEdit());

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedArg = onSave.mock.calls[0]![0];
    expect(savedArg.name).toBe("保存する名前");
    expect(savedArg.code).toBe("BT-001");
    expect(result.current.isEditing).toBe(false);
  });

  it("saveEdit後はcurrentDraftが元のdraftに戻る", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));

    act(() => result.current.startEdit());
    act(() => result.current.updateField("name", "一時的な変更"));
    act(() => result.current.saveEdit());

    expect(result.current.currentDraft).toBe(baseDraft);
  });

  it("編集モードでないときupdateFieldを呼んでも何も起きない", () => {
    const onSave = mock(() => {});
    const { result } = renderHook(() => useDraftEdit(baseDraft, onSave));

    act(() => result.current.updateField("name", "これは無視される"));

    expect(result.current.currentDraft.name).toBe("テスト業務");
  });
});
