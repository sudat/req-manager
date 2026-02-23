"use client";

type StatusAlertProps = {
  variant: "warning" | "error" | "success";
  message: string;
};

const STYLES: Record<StatusAlertProps["variant"], string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function StatusAlert({ variant, message }: StatusAlertProps) {
  return (
    <div className={`rounded-md border p-3 ${STYLES[variant]}`}>
      <p className="text-[13px]">{message}</p>
    </div>
  );
}
