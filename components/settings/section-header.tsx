"use client";

type SectionHeaderProps = {
  title: string;
  description?: string;
};

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
