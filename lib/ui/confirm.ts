/**
 * @deprecated 请使用 `ConfirmDialog` 组件代替
 * @see components/ui/confirm-dialog.tsx
 *
 * この関数はブラウザ標準の `window.confirm()` を使用しており、
 * モダンなUI体験を提供する `ConfirmDialog` コンポーネントに
 * 置き換えられました。
 *
 * 既存コードとの互換性維持のため残されていますが、
 * 新規実装では `ConfirmDialog` を使用してください。
 */
export const confirmDelete = (label: string) => {
  return window.confirm(`${label}を削除します。よろしいですか？`);
};
