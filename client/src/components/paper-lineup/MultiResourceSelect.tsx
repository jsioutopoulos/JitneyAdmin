import { MouseEvent, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { ResourceType } from "./types";

export const MultiResourceSelect = ({
  values,
  options,
  onChange,
  placeholder,
  icon: Icon,
  onResourceRightClick,
  onResourceClick,
  onEmptyContextMenu,
}: {
  values: string[];
  options: any[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  icon: any;
  onResourceRightClick?: (e: MouseEvent, id: string, type: ResourceType) => void;
  onResourceClick?: (id: string, type: ResourceType) => void;
  onEmptyContextMenu?: (e: MouseEvent) => void;
}) => {
  const [open, setOpen] = useState(false);

  const selectedItems = options.filter((o) => values.includes(o.id));

  const toggleItem = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  };

  return (
    <div className="w-full h-full relative group">
      {values.length > 0 && (
        <div className="absolute inset-0 flex flex-wrap gap-1 items-center px-2 py-1 z-20 pointer-events-none">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="h-5 px-1 text-[10px] font-medium gap-1 hover:bg-primary/10 cursor-pointer transition-colors group/badge select-none pointer-events-auto shadow-sm border border-transparent hover:border-primary/20"
              onContextMenu={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onResourceRightClick?.(e, item.id, item.role || "driver");
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onResourceClick) {
                  onResourceClick(item.id, item.role || "driver");
                }
              }}
            >
              {item.name}
              <X
                className="h-2 w-2 opacity-0 group-hover/badge:opacity-100 transition-opacity hover:text-destructive cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              />
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className="w-full h-full flex items-center px-2 hover:bg-muted/50 cursor-pointer"
            onContextMenu={(e) => {
              if (onEmptyContextMenu) {
                onEmptyContextMenu(e);
              }
            }}
          >
            {values.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground/50 text-sm pointer-events-none">
                <Icon className="h-3.5 w-3.5 opacity-50" />
                <span>{placeholder}</span>
              </div>
            )}

            {values.length > 0 && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 z-[60]" align="start" sideOffset={5} alignOffset={-10}>
          <Command>
            <CommandInput placeholder="Search..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => toggleItem(option.id)}
                    className="text-xs"
                  >
                    <Check
                      className={cn("mr-2 h-3 w-3", values.includes(option.id) ? "opacity-100" : "opacity-0")}
                    />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
