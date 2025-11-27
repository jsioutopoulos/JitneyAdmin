import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function EditableText({ value, onChange, className, onContextMenu }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (isEditing) {
    return (
      <Input
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          onChange(tempValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setIsEditing(false);
            onChange(tempValue);
          }
        }}
        className={cn(
          "h-full w-full border-none shadow-none focus-visible:ring-0 px-1 py-0 bg-background font-bold text-primary rounded-none",
          className,
        )}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={() => {
        setTempValue(value);
        setIsEditing(true);
      }}
      onContextMenu={onContextMenu}
      className={cn("w-full h-full flex items-center justify-center cursor-text hover:bg-muted/20", className)}
    >
      {value}
    </div>
  );
}
