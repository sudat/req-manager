import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
}

export function SearchBox({ placeholder = "検索...", className = "" }: SearchBoxProps) {
  return (
    <div className={`relative flex-1 min-w-[240px] ${className}`}>
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <Input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10"
      />
    </div>
  );
}
