import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DraftInfoRowProps = {
  label: string;
  value: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  multiline?: boolean;
  readOnly?: boolean;
  /** Badge表示用のクラス名（DDの種別など） */
  valueClassName?: string;
};

/**
 * 草案カード用の読取/編集兼用 InfoRow
 *
 * - 読取モード: ラベル + 値のテーブル行（既存 InfoRow と同じ見た目）
 * - 編集モード: Input or Textarea に切り替え。readOnly の場合はグレーアウト表示。
 */
export function DraftInfoRow({
  label,
  value,
  isEditing,
  onChange,
  multiline,
  readOnly,
  valueClassName,
}: DraftInfoRowProps) {
  const showInput = isEditing && !readOnly;

  return (
    <div className="flex">
      <div className="w-40 flex-shrink-0 px-4 py-2 bg-slate-50 text-[12px] font-medium text-slate-600">
        {label}
      </div>
      <div className="flex-1 px-4 py-2 text-[12px] text-slate-700">
        {showInput ? (
          multiline ? (
            <Textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="min-h-[60px] text-[12px]"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="h-8 text-[12px]"
            />
          )
        ) : isEditing && readOnly ? (
          <span className="text-slate-400 whitespace-pre-wrap">{value}</span>
        ) : valueClassName ? (
          <Badge variant="outline" className={`${valueClassName} text-[11px] font-medium`}>
            {value}
          </Badge>
        ) : (
          <span className="whitespace-pre-wrap">{value}</span>
        )}
      </div>
    </div>
  );
}
