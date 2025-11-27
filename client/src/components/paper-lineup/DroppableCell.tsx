import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import { ResourceType } from "./types";

export const DroppableCell = ({
  id,
  children,
  accept,
  isOver,
}: {
  id: string;
  children: ReactNode;
  accept: ResourceType[];
  isOver?: boolean;
}) => {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id,
    data: { accept },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full w-full relative transition-colors",
        (isOver ?? dndIsOver) && "bg-primary/10 ring-2 ring-inset ring-primary/50 z-10",
      )}
    >
      {children}
    </div>
  );
};
