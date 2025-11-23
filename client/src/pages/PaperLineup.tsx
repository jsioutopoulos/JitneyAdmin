import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { trips, vehicles, crew, Trip, Crew, Vehicle } from "@/lib/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Printer, Check, Bus, User, Shield, AlertCircle, GripVertical, Plus, X, History, ChevronRight, ChevronLeft, MapPin, Navigation, Calendar, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import mapBg from "@assets/generated_images/subtle_topological_map_background.png";

// --- Types & Helpers ---

type ResourceType = 'vehicle' | 'driver' | 'attendant' | 'trip';

interface DraggableData {
  type: ResourceType;
  id: string;
  data: any;
}

// --- Components ---

const DraggableResource = ({ resource, type, compact = false, onContextMenu }: { resource: Crew | Vehicle, type: ResourceType, compact?: boolean, onContextMenu?: (e: React.MouseEvent) => void }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resource-${type}-${resource.id}`,
    data: { type, id: resource.id, data: resource } as DraggableData,
  });

  const displayName = 'name' in resource ? resource.name : resource.plate;
  const subText = 'plate' in resource ? (resource as Vehicle).plate : (resource as Crew).role;
  const status = resource.status;

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onContextMenu={onContextMenu}
      className={cn(
        "flex items-center gap-2 p-2 cursor-grab hover:border-primary/50 transition-all select-none",
        isDragging && "opacity-50",
        compact ? "p-1.5 text-xs rounded-md mb-1" : "mb-2"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{displayName}</div>
        {!compact && <div className="text-xs text-muted-foreground capitalize">{subText}</div>}
      </div>
      {status !== 'active' && status !== 'available' && (
        <div className={cn("h-2 w-2 rounded-full", status === 'assigned' ? "bg-emerald-500" : "bg-amber-500")} />
      )}
    </Card>
  );
};

const DroppableCell = ({ id, children, accept, isOver }: { id: string, children: React.ReactNode, accept: ResourceType[], isOver?: boolean }) => {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: id,
    data: { accept }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-full w-full relative transition-colors",
        dndIsOver && "bg-primary/10 ring-2 ring-inset ring-primary/50 z-10"
      )}
    >
      {children}
    </div>
  );
};

// Multi-select Component for Drivers/Attendants
const MultiResourceSelect = ({ values, options, onChange, placeholder, icon: Icon, onResourceRightClick }: { 
  values: string[], 
  options: any[], 
  onChange: (ids: string[]) => void, 
  placeholder: string,
  icon: any,
  onResourceRightClick?: (id: string, type: ResourceType) => void
}) => {
  const [open, setOpen] = useState(false);
  
  const selectedItems = options.filter(o => values.includes(o.id));

  const toggleItem = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter(v => v !== id));
    } else {
      onChange([...values, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full h-full min-h-[36px] flex items-center px-2 hover:bg-muted/50 cursor-pointer group">
          {values.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground/50 text-sm">
              <Icon className="h-3.5 w-3.5 opacity-50" />
              <span>{placeholder}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 py-1">
              {selectedItems.map(item => (
                <Badge 
                  key={item.id} 
                  variant="secondary" 
                  className="h-5 px-1 text-[10px] font-medium gap-1 hover:bg-primary/10 cursor-context-menu transition-colors group/badge" 
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onResourceRightClick?.(item.id, item.role || 'driver'); // heuristic for role
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
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
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
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
                  <Check className={cn("mr-2 h-3 w-3", values.includes(option.id) ? "opacity-100" : "opacity-0")} />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const EditableText = ({ value, onChange, className, onContextMenu }: { value: string, onChange: (val: string) => void, className?: string, onContextMenu?: (e: React.MouseEvent) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (isEditing) {
    return (
      <Input 
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => { setIsEditing(false); onChange(tempValue); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditing(false); onChange(tempValue); } }}
        className={cn("h-full w-full border-none shadow-none focus-visible:ring-0 px-1 py-0 bg-background font-bold text-primary rounded-none", className)}
        autoFocus
      />
    );
  }

  return (
    <div 
      onClick={() => { setTempValue(value); setIsEditing(true); }}
      onContextMenu={onContextMenu}
      className={cn("w-full h-full flex items-center justify-center cursor-text hover:bg-muted/20", className)}
    >
      {value}
    </div>
  );
};


export default function HybridLineup() {
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDragItem, setActiveDragItem] = useState<DraggableData | null>(null);
  
  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<{ type: ResourceType, id: string } | null>(null);

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current as DraggableData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const resourceData = active.data.current as DraggableData;
    const [tripId, targetField] = (over.id as string).split(':'); // tripId:field

    if (tripId && targetField) {
      handleDropAssign(tripId, targetField, resourceData.id, resourceData.type);
    }
  };

  const handleDropAssign = (tripId: string, field: string, resourceId: string, type: ResourceType) => {
    setLocalTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;

      // Handle array fields (drivers/attendants)
      if (field === 'driverIds' || field === 'attendantIds') {
        const currentIds = t[field as keyof Trip] as string[] || [];
        if (!currentIds.includes(resourceId)) {
          return { ...t, [field]: [...currentIds, resourceId] };
        }
      } 
      // Handle single fields (vehicle)
      else if (field === 'vehicleId') {
        return { ...t, vehicleId: resourceId };
      }

      return t;
    }));
  };

  const handleUpdateTrip = (tripId: string, field: keyof Trip, value: any) => {
    setLocalTrips(prev => prev.map(t => t.id === tripId ? { ...t, [field]: value } : t));
  };

  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent, type: ResourceType, id: string) => {
    e.preventDefault();
    setDrawerContent({ type, id });
    setDrawerOpen(true);
  };

  // Split trips logic
  const leftColTrips = localTrips.filter((_, i) => i % 2 === 0);
  const rightColTrips = localTrips.filter((_, i) => i % 2 !== 0);
  const maxRows = Math.max(leftColTrips.length, rightColTrips.length, 20);
  const emptyRows = Array.from({ length: maxRows }).map((_, i) => ({
    left: leftColTrips[i] || null,
    right: rightColTrips[i] || null
  }));

  // Drawer Content Renderer
  const renderDrawerContent = () => {
    if (!drawerContent) return null;

    if (drawerContent.type === 'vehicle') {
      const v = vehicles.find(x => x.id === drawerContent.id);
      if (!v) return null;
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Bus className="h-6 w-6 text-primary" />
              {v.name}
            </h2>
            <Badge variant={v.status === 'active' ? 'default' : 'destructive'}>{v.status.toUpperCase()}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <Card className="p-3 bg-muted/20 border-none shadow-none">
                <p className="text-xs text-muted-foreground uppercase font-bold">Capacity</p>
                <p className="text-lg font-mono">{v.capacity} PAX</p>
             </Card>
             <Card className="p-3 bg-muted/20 border-none shadow-none">
                <p className="text-xs text-muted-foreground uppercase font-bold">License Plate</p>
                <p className="text-lg font-mono">{v.plate}</p>
             </Card>
          </div>

          <Card className="h-48 overflow-hidden relative border-none shadow-sm">
             <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${mapBg})`, backgroundSize: 'cover' }} />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-primary drop-shadow-md">
                   <MapPin className="h-8 w-8 fill-primary text-white" />
                   <span className="text-xs font-bold bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm">Current Location</span>
                </div>
             </div>
          </Card>
        </div>
      );
    }

    if (drawerContent.type === 'driver' || drawerContent.type === 'attendant') {
      const c = crew.find(x => x.id === drawerContent.id);
      if (!c) return null;
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
               {c.name.charAt(0)}
             </div>
             <div>
               <h2 className="text-2xl font-bold tracking-tight">{c.name}</h2>
               <p className="text-muted-foreground capitalize flex items-center gap-2">
                 {c.role === 'driver' ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                 {c.role}
               </p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <Card className="p-3 bg-muted/20 border-none shadow-none">
                <p className="text-xs text-muted-foreground uppercase font-bold">Status</p>
                <p className="text-lg font-medium capitalize">{c.status}</p>
             </Card>
             <Card className="p-3 bg-muted/20 border-none shadow-none">
                <p className="text-xs text-muted-foreground uppercase font-bold">Phone</p>
                <p className="text-lg font-mono">{c.phone}</p>
             </Card>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">Today's Assignments</h3>
            {localTrips.filter(t => 
               (t.driverIds && t.driverIds.includes(c.id)) || 
               (t.attendantIds && t.attendantIds.includes(c.id))
            ).map(t => (
               <Card key={t.id} className="flex items-center gap-3 p-2 border bg-card shadow-sm">
                  <Badge variant="outline">{t.packId || t.id}</Badge>
                  <span className="text-sm font-medium">{t.route}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{format(t.departureTime, "HH:mm")}</span>
               </Card>
            ))}
            {localTrips.filter(t => 
               (t.driverIds && t.driverIds.includes(c.id)) || 
               (t.attendantIds && t.attendantIds.includes(c.id))
            ).length === 0 && (
              <p className="text-sm text-muted-foreground italic">No active assignments</p>
            )}
          </div>
        </div>
      );
    }

    if (drawerContent.type === 'trip') {
      const t = localTrips.find(x => x.id === drawerContent.id);
      if (!t) return null;
      return (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <Badge>{t.packId || t.id}</Badge>
               <Badge variant="outline" className="capitalize">{t.status}</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{t.route}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <Card className="p-3 bg-muted/20 border-none shadow-none">
                <p className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-2"><Navigation className="h-3 w-3" /> Departure</p>
                <p className="text-lg font-mono">{format(t.departureTime, "HH:mm")}</p>
             </Card>
             <Card className="p-3 bg-muted/20 border-none shadow-none">
                <p className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-2"><Check className="h-3 w-3" /> Arrival</p>
                <p className="text-lg font-mono">{format(t.arrivalTime, "HH:mm")}</p>
             </Card>
          </div>

          <Card className="h-48 overflow-hidden relative border-none shadow-sm">
             <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${mapBg})`, backgroundSize: 'cover' }} />
             {/* Mock Route Line */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M 40 100 Q 150 50 260 100" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeDasharray="5,5" />
                <circle cx="40" cy="100" r="4" fill="hsl(var(--primary))" />
                <circle cx="260" cy="100" r="4" fill="hsl(var(--primary))" />
             </svg>
             <div className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 rounded text-xs font-bold shadow-sm">
                Live Traffic: Clear
             </div>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="h-full flex overflow-hidden">
          
          {/* LEFT SIDEBAR - RESOURCES */}
          {sidebarOpen && (
            <div className="w-72 bg-background border-r border-border flex flex-col shadow-sm shrink-0 z-20">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Resources</h2>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(false)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-2 sticky top-0 bg-background py-1 z-10">
                      <Bus className="h-3.5 w-3.5" /> Vehicles
                    </h3>
                    <div className="space-y-1">
                      {vehicles.map(v => (
                        <DraggableResource 
                          key={v.id} 
                          resource={v} 
                          type="vehicle" 
                          compact 
                          onContextMenu={(e) => handleContextMenu(e, 'vehicle', v.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-2 sticky top-0 bg-background py-1 z-10">
                      <User className="h-3.5 w-3.5" /> Drivers
                    </h3>
                    <div className="space-y-1">
                      {crew.filter(c => c.role === 'driver').map(c => (
                        <DraggableResource 
                          key={c.id} 
                          resource={c} 
                          type="driver" 
                          compact 
                          onContextMenu={(e) => handleContextMenu(e, 'driver', c.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-2 sticky top-0 bg-background py-1 z-10">
                      <Shield className="h-3.5 w-3.5" /> Attendants
                    </h3>
                    <div className="space-y-1">
                      {crew.filter(c => c.role === 'attendant').map(c => (
                        <DraggableResource 
                          key={c.id} 
                          resource={c} 
                          type="attendant" 
                          compact 
                          onContextMenu={(e) => handleContextMenu(e, 'attendant', c.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col bg-muted/10 min-w-0">
            {/* Toolbar */}
            <div className="bg-card border-b border-border p-4 flex justify-between items-center shadow-sm z-10 print:hidden shrink-0">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="mr-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground leading-none">Digital Lineup Grid</h1>
                  <p className="text-xs text-muted-foreground mt-1">Hybrid View • Monday, Nov 24</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print Sheet
                </Button>
                <Button size="sm" className="gap-2">
                  <History className="h-4 w-4" /> History
                </Button>
              </div>
            </div>

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
              <div className="bg-card w-[1200px] min-h-[800px] shadow-xl border border-border/60 rounded-sm relative text-card-foreground font-sans text-sm print:shadow-none print:border-none print:w-full overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="border-b border-border p-6 flex justify-between items-start bg-muted/5 shrink-0">
                  <div className="flex flex-col gap-1">
                      <h1 className="text-2xl font-bold tracking-tight text-primary">HAMPTON JITNEY</h1>
                      <h2 className="text-lg font-medium text-muted-foreground tracking-wide">DAILY OPERATIONS LINEUP</h2>
                  </div>
                  <div className="flex gap-8">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Date</span>
                        <span className="text-lg font-medium tabular-nums">Nov 24, 2025</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Day</span>
                        <span className="text-lg font-medium">Monday</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Weather</span>
                        <span className="text-lg font-medium flex items-center gap-1">Sunny 65°</span>
                      </div>
                  </div>
                </div>

                {/* Grid */}
                <div className="flex border-b border-border bg-card flex-1">
                  {/* Left Column */}
                  <div className="flex-1 border-r border-border flex flex-col">
                    <div className="flex border-b border-border h-9 bg-muted/30 shrink-0">
                        <div className="w-[15%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Trip</div>
                        <div className="w-[20%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Vehicle</div>
                        <div className="w-[65%] flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Crew Assignment</div>
                    </div>
                    {emptyRows.map((row, idx) => (
                        <div key={`L-${idx}`} className="flex min-h-[48px] border-b border-border last:border-b-0 group hover:bg-muted/10 transition-colors">
                          {/* Trip ID / Time */}
                          <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex flex-col justify-center items-center relative cursor-context-menu"
                               onContextMenu={(e) => row.left && handleContextMenu(e, 'trip', row.left.id)}>
                              {row.left && (
                                <>
                                  <EditableText 
                                    value={row.left.packId || row.left.id.toUpperCase()} 
                                    onChange={(val) => handleUpdateTrip(row.left!.id, 'packId', val)}
                                    className="text-xs font-bold text-primary text-center"
                                  />
                                  <span className="text-[10px] text-muted-foreground absolute bottom-0.5">{format(row.left.departureTime, "HH:mm")}</span>
                                </>
                              )}
                          </div>
                          
                          {/* Vehicle Droppable */}
                          <div className="w-[20%] border-r border-border p-0 relative">
                              {row.left && (
                                <DroppableCell id={`${row.left.id}:vehicleId`} accept={['vehicle']}>
                                  <MultiResourceSelect 
                                    values={row.left.vehicleId ? [row.left.vehicleId] : []}
                                    options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1] }))}
                                    onChange={(ids) => handleUpdateTrip(row.left!.id, 'vehicleId', ids[0] || null)}
                                    placeholder="Bus"
                                    icon={Bus}
                                    onResourceRightClick={(id, type) => handleContextMenu({ preventDefault: () => {}, stopPropagation: () => {} } as any, 'vehicle', id)}
                                  />
                                </DroppableCell>
                              )}
                          </div>
                          
                          {/* Crew Droppable */}
                          <div className="w-[65%] flex divide-x divide-border/50">
                              <div className="flex-1 relative">
                                {row.left && (
                                  <DroppableCell id={`${row.left.id}:driverIds`} accept={['driver']}>
                                    <MultiResourceSelect 
                                      values={row.left.driverIds || []}
                                      options={crew.filter(c => c.role === 'driver')}
                                      onChange={(ids) => handleUpdateTrip(row.left!.id, 'driverIds', ids)}
                                      placeholder="Drivers"
                                      icon={User}
                                      onResourceRightClick={(id, type) => handleContextMenu({ preventDefault: () => {}, stopPropagation: () => {} } as any, 'driver', id)}
                                    />
                                  </DroppableCell>
                                )}
                              </div>
                              <div className="flex-1 relative">
                                {row.left && (
                                  <DroppableCell id={`${row.left.id}:attendantIds`} accept={['attendant']}>
                                    <MultiResourceSelect 
                                      values={row.left.attendantIds || []}
                                      options={crew.filter(c => c.role === 'attendant')}
                                      onChange={(ids) => handleUpdateTrip(row.left!.id, 'attendantIds', ids)}
                                      placeholder="Attendants"
                                      icon={Shield}
                                      onResourceRightClick={(id, type) => handleContextMenu({ preventDefault: () => {}, stopPropagation: () => {} } as any, 'attendant', id)}
                                    />
                                  </DroppableCell>
                                )}
                              </div>
                          </div>
                        </div>
                    ))}
                  </div>

                  {/* Right Column - Mirror of Left */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex border-b border-border h-9 bg-muted/30 shrink-0">
                        <div className="w-[15%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Trip</div>
                        <div className="w-[20%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Vehicle</div>
                        <div className="w-[65%] flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Crew Assignment</div>
                    </div>
                    {emptyRows.map((row, idx) => (
                        <div key={`R-${idx}`} className="flex min-h-[48px] border-b border-border last:border-b-0 group hover:bg-muted/10 transition-colors">
                          {/* Trip ID / Time */}
                          <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex flex-col justify-center items-center relative cursor-context-menu"
                               onContextMenu={(e) => row.right && handleContextMenu(e, 'trip', row.right.id)}>
                              {row.right && (
                                <>
                                  <EditableText 
                                    value={row.right.packId || row.right.id.toUpperCase()} 
                                    onChange={(val) => handleUpdateTrip(row.right!.id, 'packId', val)}
                                    className="text-xs font-bold text-primary text-center"
                                  />
                                  <span className="text-[10px] text-muted-foreground absolute bottom-0.5">{format(row.right.departureTime, "HH:mm")}</span>
                                </>
                              )}
                          </div>
                          
                          {/* Vehicle Droppable */}
                          <div className="w-[20%] border-r border-border p-0 relative">
                              {row.right && (
                                <DroppableCell id={`${row.right.id}:vehicleId`} accept={['vehicle']}>
                                  <MultiResourceSelect 
                                    values={row.right.vehicleId ? [row.right.vehicleId] : []}
                                    options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1] }))}
                                    onChange={(ids) => handleUpdateTrip(row.right!.id, 'vehicleId', ids[0] || null)}
                                    placeholder="Bus"
                                    icon={Bus}
                                    onResourceRightClick={(id, type) => handleContextMenu({ preventDefault: () => {}, stopPropagation: () => {} } as any, 'vehicle', id)}
                                  />
                                </DroppableCell>
                              )}
                          </div>
                          
                          {/* Crew Droppable */}
                          <div className="w-[65%] flex divide-x divide-border/50">
                              <div className="flex-1 relative">
                                {row.right && (
                                  <DroppableCell id={`${row.right.id}:driverIds`} accept={['driver']}>
                                    <MultiResourceSelect 
                                      values={row.right.driverIds || []}
                                      options={crew.filter(c => c.role === 'driver')}
                                      onChange={(ids) => handleUpdateTrip(row.right!.id, 'driverIds', ids)}
                                      placeholder="Drivers"
                                      icon={User}
                                      onResourceRightClick={(id, type) => handleContextMenu({ preventDefault: () => {}, stopPropagation: () => {} } as any, 'driver', id)}
                                    />
                                  </DroppableCell>
                                )}
                              </div>
                              <div className="flex-1 relative">
                                {row.right && (
                                  <DroppableCell id={`${row.right.id}:attendantIds`} accept={['attendant']}>
                                    <MultiResourceSelect 
                                      values={row.right.attendantIds || []}
                                      options={crew.filter(c => c.role === 'attendant')}
                                      onChange={(ids) => handleUpdateTrip(row.right!.id, 'attendantIds', ids)}
                                      placeholder="Attendants"
                                      icon={Shield}
                                      onResourceRightClick={(id, type) => handleContextMenu({ preventDefault: () => {}, stopPropagation: () => {} } as any, 'attendant', id)}
                                    />
                                  </DroppableCell>
                                )}
                              </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Footer (Static) */}
                <div className="flex h-32 bg-muted/5 border-t border-border shrink-0">
                   {/* Placeholder footer content */}
                   <div className="flex-1 flex items-center justify-center text-muted-foreground/50 text-sm italic">
                      Scrollable Footer Area (Charters / Feeders)
                   </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT DRAWER - DETAILS */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
              <SheetHeader className="mb-6">
                <SheetTitle>Resource Details</SheetTitle>
                <SheetDescription>View and manage specific resource information.</SheetDescription>
              </SheetHeader>
              {renderDrawerContent()}
            </SheetContent>
          </Sheet>

        </div>

        <DragOverlay>
          {activeDragItem ? (
             <div className="opacity-80 rotate-2 cursor-grabbing pointer-events-none">
                <Badge variant="default" className="h-8 px-3 text-sm shadow-xl bg-primary text-white">
                  {activeDragItem.data.name || activeDragItem.data.plate}
                </Badge>
             </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Layout>
  );
}
