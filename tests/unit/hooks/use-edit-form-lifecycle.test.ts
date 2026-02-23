import { Window } from "happy-dom";

const window = new Window();
Object.assign(globalThis, {
  document: window.document,
  window,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
});

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";

let pushMock = mock((_: string) => {});

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

import { useEditFormLifecycle } from "../../../hooks/use-edit-form-lifecycle";

describe("useEditFormLifecycle", () => {
  beforeEach(() => {
    pushMock = mock((_: string) => {});
  });

  it("初期状態を返す", () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path"));

    expect(result.current.loading).toBe(true);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("runLoad成功時にloadingをfalseにしerrorをクリアする", async () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path", false));

    act(() => {
      result.current.setError("old error");
    });

    await act(async () => {
      await result.current.runLoad(async () => {
        return;
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("runLoad失敗時にerrorを設定する", async () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path", false));

    await act(async () => {
      await result.current.runLoad(async () => {
        throw new Error("load failed");
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("load failed");
  });

  it("runSave成功時にonSuccess実行と遷移を行う", async () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path", false));
    const onSuccess = mock(() => {});

    let saveResult = false;
    await act(async () => {
      saveResult = await result.current.runSave(async () => null, { onSuccess });
    });

    expect(saveResult).toBe(true);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/next-path");
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("runSaveでnavigateOnSuccess=falseなら遷移しない", async () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path", false));

    await act(async () => {
      await result.current.runSave(async () => null, { navigateOnSuccess: false });
    });

    expect(pushMock).toHaveBeenCalledTimes(0);
  });

  it("runSaveがエラー文字列を返した時はfalseを返しerror設定する", async () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path", false));

    let saveResult = true;
    await act(async () => {
      saveResult = await result.current.runSave(async () => "save failed");
    });

    expect(saveResult).toBe(false);
    expect(result.current.error).toBe("save failed");
    expect(pushMock).toHaveBeenCalledTimes(0);
  });

  it("runSaveが例外を投げた時はfalseとerrorを返す", async () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path", false));

    let saveResult = true;
    await act(async () => {
      saveResult = await result.current.runSave(async () => {
        throw new Error("unexpected error");
      });
    });

    expect(saveResult).toBe(false);
    expect(result.current.error).toBe("unexpected error");
    expect(pushMock).toHaveBeenCalledTimes(0);
  });

  it("navigateToSuccessで遷移できる", () => {
    const { result } = renderHook(() => useEditFormLifecycle("/next-path", false));

    act(() => {
      result.current.navigateToSuccess();
    });

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/next-path");
  });
});
