import { MouseEvent } from "react";
import { format } from "date-fns";
import { GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Crew, Vehicle } from "@/lib/mockData";

import { DraggableData, ResourceType } from "./types";

export const DraggableResource = ({
  resource,
  type,
  compact = false,
  onContextMenu,
}: {
  resource: Crew | Vehicle;
  type: ResourceType;
  compact?: boolean;
  onContextMenu?: (e: MouseEvent) => void;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resource-${type}-${resource.id}`,
    data: { type, id: resource.id, data: resource } as DraggableData,
  });

  const displayName = "name" in resource ? resource.name : (resource as Vehicle).plate;

  const getResourceColor = (r: Crew | Vehicle) => {
    if ("plate" in r) {
      const v = r as Vehicle;
      switch (v.type) {
        case "Coach":
          return "border-emerald-500 bg-emerald-50/50 text-emerald-900";
        case "Ambassador":
          return "border-blue-500 bg-blue-50/50 text-blue-900";
        case "Trolley":
          return "border-red-500 bg-red-50/50 text-red-900";
        case "SCT":
          return "border-purple-500 bg-purple-50/50 text-purple-900";
        default:
          return "border-muted bg-muted/20";
      }
    }

    return "border-border bg-card hover:bg-accent/5 text-foreground";
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={onContextMenu}
      className={cn(
        "cursor-grab active:cursor-grabbing select-none group relative mb-2",
        isDragging && "opacity-50",
      )}
    >
      <div
        className={cn(
          "flex items-center border-l-[3px] rounded-r-md border-y border-r pl-2 pr-2 py-2 shadow-sm hover:shadow-md transition-all",
          getResourceColor(resource),
          compact ? "py-1 text-xs" : "",
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 mr-2" />

        <div className="flex-1 grid grid-cols-[1fr_auto_auto] gap-3 items-center">
          <div className="font-bold truncate text-sm leading-tight">{displayName}</div>

          {!("plate" in resource) && (resource as Crew).reportTime && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-medium opacity-80">
                {format((resource as Crew).reportTime!, "HH:mm")}
              </span>

              {(resource as Crew).reportDepot && (
                <Badge
                  variant="secondary"
                  className="text-[9px] h-4 px-1.5 font-bold tracking-wider opacity-90 bg-background/50 border-current"
                >
                  {(resource as Crew).reportDepot.substring(0, 3).toUpperCase()}
                </Badge>
              )}
            </div>
          )}

          {"plate" in resource && <div className="text-xs opacity-80 font-medium">{(resource as Vehicle).capacity} PAX</div>}
        </div>
      </div>
    </div>
  );
};
