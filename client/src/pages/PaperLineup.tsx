import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { trips, vehicles, crew, Trip, Crew, Vehicle, Stop, Passenger, TripLeg } from "@/lib/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Printer, Check, Bus, User, Shield, AlertCircle, GripVertical, Plus, X, 
  History, ChevronRight, ChevronLeft, MapPin, Navigation, Calendar, Phone, 
  Star, Users, Accessibility, Package, Search, List, UserPlus,
  MoreHorizontal, Bell, Settings, Filter, Clock, Circle, LayoutGrid, Table as TableIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import mapBg from "@assets/generated_images/subtle_topological_map_background.png";

// --- Types & Helpers ---

type ResourceType = 'vehicle' | 'driver' | 'attendant' | 'trip' | 'leg';

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

const DigitalGridView = ({ trips }: { trips: Trip[] }) => {
  return (
    <div className="p-4 overflow-auto h-full">
      <div className="border rounded-md bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Trip</TableHead>
              <TableHead>Line</TableHead>
              <TableHead className="text-right">Cap</TableHead>
              <TableHead className="text-right">Res</TableHead>
              <TableHead className="text-right">Avl</TableHead>
              <TableHead className="text-center">Stat</TableHead>
              <TableHead className="text-center">Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.flatMap(t => t.legs ? t.legs.map(l => ({ ...l, parent: t })) : [{ id: t.id, status: t.status, direction: t.direction, parent: t }]).map((item, idx) => (
               <TableRow key={`${item.parent.id}-${item.id}-${idx}`} className="hover:bg-muted/5">
                  <TableCell className="font-bold font-mono">{item.id}</TableCell>
                  <TableCell>
                     <Badge variant={item.parent.direction === 'westbound' ? "default" : "secondary"} className={cn(
                        "h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px]",
                        item.parent.direction === 'westbound' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"
                     )}>
                        {item.parent.direction === 'westbound' ? 'W' : 'E'}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.parent.capacity}</TableCell>
                  <TableCell className="text-right font-medium">{item.parent.reservedCount}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">{item.parent.capacity - item.parent.reservedCount}</TableCell>
                  <TableCell className="text-center">
                     <Badge variant="outline" className={cn(
                        "text-[10px] uppercase",
                        item.status === 'en-route' && "bg-blue-100 text-blue-700 border-blue-200",
                        item.status === 'completed' && "bg-gray-100 text-gray-500 border-gray-200",
                        item.status === 'scheduled' && "bg-emerald-50 text-emerald-600 border-emerald-200"
                     )}>
                        {item.status}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                     {item.parent.hasAda && <Accessibility className="h-4 w-4 inline text-blue-500" />}
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">List</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Stops</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Data</Button>
                     </div>
                  </TableCell>
               </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


// --- Main Component ---

export default function HybridLineup() {
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDragItem, setActiveDragItem] = useState<DraggableData | null>(null);
  const [viewMode, setViewMode] = useState<'paper' | 'digital'>('paper');
  
  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<{ type: ResourceType, id: string, legId?: string } | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");

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

  // Handle Stop Toggle
  const toggleStop = (tripId: string, stopId: string) => {
    setLocalTrips(prev => prev.map(t => {
        if (t.id !== tripId) return t;
        return {
            ...t,
            stops: t.stops.map(s => s.id === stopId ? { ...s, status: s.status === 'open' ? 'closed' : 'open' } as Stop : s)
        }
    }));
  };

    // Handle Stop Vehicle Assignment
  const assignStopVehicle = (tripId: string, stopId: string, vehicleId: string) => {
    setLocalTrips(prev => prev.map(t => {
        if (t.id !== tripId) return t;
        return {
            ...t,
            stops: t.stops.map(s => s.id === stopId ? { ...s, assignedVehicleId: vehicleId } as Stop : s)
        }
    }));
  };


  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent, type: ResourceType, id: string, legId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDrawerContent({ type, id, legId });
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
      const leg = t.legs?.find(l => l.id === drawerContent.legId);

      return (
        <Tabs defaultValue="manifest" className="w-full h-full flex flex-col">
          <div className="mb-6 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       {leg ? (
                         <Badge className="text-xl px-3 py-1 bg-primary">{leg.id}</Badge>
                       ) : (
                         <Badge className="text-lg px-2 py-1">{t.packId || t.id}</Badge>
                       )}
                       
                       <Badge variant="outline" className={cn(
                         "capitalize",
                         leg?.status === 'en-route' && "bg-blue-100 text-blue-700 border-blue-200",
                         leg?.status === 'completed' && "bg-gray-100 text-gray-500 border-gray-200",
                         leg?.status === 'scheduled' && "bg-emerald-50 text-emerald-600 border-emerald-200"
                       )}>
                          {leg ? leg.status : t.status}
                       </Badge>
                       {t.hasAda && <Accessibility className="h-4 w-4 text-blue-500" />}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{t.route}</h2>
                    {leg && <p className="text-sm text-muted-foreground">Leg Details • {leg.direction === 'westbound' ? 'Westbound' : 'Eastbound'}</p>}
                 </div>
                 <div className="text-right">
                     <div className="text-2xl font-bold font-mono">{t.reservedCount}/{t.capacity}</div>
                     <div className="text-xs text-muted-foreground uppercase">Capacity</div>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/10 p-2 rounded border border-border flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Res</span>
                      <span className="text-lg font-bold">{t.reservedCount}</span>
                  </div>
                   <div className="bg-muted/10 p-2 rounded border border-border flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Avl</span>
                      <span className="text-lg font-bold text-emerald-600">{t.capacity - t.reservedCount}</span>
                  </div>
                   <div className="bg-muted/10 p-2 rounded border border-border flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Check-In</span>
                      <span className="text-lg font-bold text-blue-600">{Math.floor(t.reservedCount * 0.8)}</span>
                  </div>
              </div>

              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="manifest">Manifest</TabsTrigger>
                <TabsTrigger value="stops">Stops</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
              </TabsList>
          </div>

          <TabsContent value="manifest" className="flex-1 overflow-hidden flex flex-col mt-0">
             <div className="flex items-center gap-2 mb-4 shrink-0">
                <Input placeholder="Search passengers..." className="h-8" />
                <Button size="sm"><UserPlus className="h-4 w-4 mr-2" /> Add</Button>
             </div>
             <div className="border rounded-md flex-1 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/20 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Res #</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Seat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="overflow-y-auto">
                        {t.passengers.map(p => (
                            <TableRow key={p.id}>
                                <TableCell><Checkbox checked={p.status === 'checked-in'} /></TableCell>
                                <TableCell className="font-medium">
                                    {p.name}
                                    {p.notes === 'ADA' && <Accessibility className="h-3 w-3 inline ml-2 text-blue-500" />}
                                </TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">{p.confirmationCode}</TableCell>
                                <TableCell>{p.type}</TableCell>
                                <TableCell className="text-right font-mono">{p.seat}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </TabsContent>

          <TabsContent value="stops" className="flex-1 overflow-y-auto mt-0">
             <div className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                     <h3 className="text-sm font-bold text-muted-foreground">Stop Management</h3>
                     <span className="text-xs text-muted-foreground">{t.stops.length} stops</span>
                 </div>
                 
                 {t.stops.map((stop, idx) => (
                     <Card key={stop.id} className="p-3">
                         <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{idx + 1}</Badge>
                                <span className="font-bold">{stop.name}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-xs font-mono text-muted-foreground">{format(stop.time, "HH:mm")}</span>
                                 <Button 
                                    variant={stop.status === 'open' ? "outline" : "destructive"} 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => toggleStop(t.id, stop.id)}
                                 >
                                     {stop.status === 'open' ? 'Open' : 'Closed'}
                                 </Button>
                             </div>
                         </div>
                         
                         {/* Vehicle Assignment for Stop (if multiple vehicles) */}
                         {(t.vehicleId || (t.driverIds && t.driverIds.length > 0)) && (
                             <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Service By:</span>
                                <div className="flex gap-1">
                                    {/* Primary Vehicle */}
                                    {t.vehicleId && (
                                        <Badge 
                                            variant={stop.assignedVehicleId === t.vehicleId || !stop.assignedVehicleId ? "default" : "outline"}
                                            className="cursor-pointer text-[10px] h-5"
                                            onClick={() => assignStopVehicle(t.id, stop.id, t.vehicleId!)}
                                        >
                                            {vehicles.find(v => v.id === t.vehicleId)?.plate.split('-')[1] || 'Bus'}
                                        </Badge>
                                    )}
                                    {/* Any other logic for extra vehicles would go here */}
                                </div>
                             </div>
                         )}
                     </Card>
                 ))}
             </div>
          </TabsContent>

          <TabsContent value="map" className="flex-1 mt-0">
              <Card className="h-full w-full overflow-hidden relative border-none shadow-sm bg-muted/10">
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
          </TabsContent>
        </Tabs>
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
            <div className="bg-card border-b border-border p-3 flex justify-between items-center shadow-sm z-10 print:hidden shrink-0 gap-4">
              <div className="flex items-center gap-3 flex-1">
                {!sidebarOpen && (
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="mr-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center border rounded-lg bg-background p-1 shadow-sm">
                   <Button 
                    variant={viewMode === 'paper' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-3 text-xs"
                    onClick={() => setViewMode('paper')}
                   >
                      <LayoutGrid className="h-3.5 w-3.5 mr-2" />
                      Lineup
                   </Button>
                   <Button 
                    variant={viewMode === 'digital' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-3 text-xs"
                    onClick={() => setViewMode('digital')}
                   >
                      <TableIcon className="h-3.5 w-3.5 mr-2" />
                      Digital
                   </Button>
                </div>
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search reservations, trips, or resources..." 
                        className="pl-8 h-9 bg-muted/20 border-none focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" className="h-9 gap-2 hidden lg:flex">
                    <Accessibility className="h-4 w-4 text-blue-500" />
                    <span className="hidden xl:inline">ADA</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1">3</Badge>
                 </Button>
                 <Button variant="outline" size="sm" className="h-9 gap-2 hidden lg:flex">
                    <Package className="h-4 w-4 text-amber-500" />
                    <span className="hidden xl:inline">Freight</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1">12</Badge>
                 </Button>
                 <Separator orientation="vertical" className="h-6 mx-2 hidden lg:block" />
                 <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print Sheet
                </Button>
              </div>
            </div>

            {/* Content Switcher */}
            {viewMode === 'digital' ? (
               <DigitalGridView trips={localTrips} />
            ) : (
              /* Scrollable Grid (Paper View) */
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
                            <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex flex-col justify-center items-center relative p-1 gap-1">
                                {row.left && row.left.legs && row.left.legs.length > 0 ? (
                                  // Render individual legs
                                  row.left.legs.map((leg, legIdx) => (
                                    <div 
                                      key={leg.id} 
                                      className={cn(
                                        "w-full text-center cursor-pointer hover:scale-105 transition-transform rounded px-1 border border-transparent hover:border-border/50",
                                        leg.status === 'en-route' && "bg-blue-100/50 text-blue-700",
                                        leg.status === 'completed' && "opacity-50 grayscale"
                                      )}
                                      onClick={(e) => handleContextMenu(e, 'trip', row.left!.id, leg.id)}
                                      onContextMenu={(e) => handleContextMenu(e, 'trip', row.left!.id, leg.id)}
                                    >
                                      <span className="text-xs font-bold text-primary">{leg.id}</span>
                                    </div>
                                  ))
                                ) : row.left && (
                                  // Fallback for single leg
                                   <>
                                    <EditableText 
                                      value={row.left.packId || row.left.id.toUpperCase()} 
                                      onChange={(val) => handleUpdateTrip(row.left!.id, 'packId', val)}
                                      className="text-xs font-bold text-primary text-center"
                                      onContextMenu={(e) => handleContextMenu(e, 'trip', row.left!.id)}
                                    />
                                   </>
                                )}
                                
                                {row.left && (
                                  <div className="flex items-center gap-1 absolute bottom-0.5 left-0 right-0 justify-center pointer-events-none">
                                    <span className="text-[10px] text-muted-foreground">{format(row.left.departureTime, "HH:mm")}</span>
                                    {row.left.hasAda && <Accessibility className="h-[8px] w-[8px] text-blue-500" />}
                                  </div>
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
                            <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex flex-col justify-center items-center relative p-1 gap-1">
                                {row.right && row.right.legs && row.right.legs.length > 0 ? (
                                  // Render individual legs
                                  row.right.legs.map((leg, legIdx) => (
                                    <div 
                                      key={leg.id} 
                                      className={cn(
                                        "w-full text-center cursor-pointer hover:scale-105 transition-transform rounded px-1 border border-transparent hover:border-border/50",
                                        leg.status === 'en-route' && "bg-blue-100/50 text-blue-700",
                                        leg.status === 'completed' && "opacity-50 grayscale"
                                      )}
                                      onClick={(e) => handleContextMenu(e, 'trip', row.right!.id, leg.id)}
                                      onContextMenu={(e) => handleContextMenu(e, 'trip', row.right!.id, leg.id)}
                                    >
                                      <span className="text-xs font-bold text-primary">{leg.id}</span>
                                    </div>
                                  ))
                                ) : row.right && (
                                  // Fallback for single leg
                                   <>
                                    <EditableText 
                                      value={row.right.packId || row.right.id.toUpperCase()} 
                                      onChange={(val) => handleUpdateTrip(row.right!.id, 'packId', val)}
                                      className="text-xs font-bold text-primary text-center"
                                      onContextMenu={(e) => handleContextMenu(e, 'trip', row.right!.id)}
                                    />
                                   </>
                                )}

                                {row.right && (
                                  <div className="flex items-center gap-1 absolute bottom-0.5 left-0 right-0 justify-center pointer-events-none">
                                    <span className="text-[10px] text-muted-foreground">{format(row.right.departureTime, "HH:mm")}</span>
                                    {row.right.hasAda && <Accessibility className="h-[8px] w-[8px] text-blue-500" />}
                                  </div>
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
            )}
          </div>

          {/* RIGHT DRAWER - DETAILS */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent className="w-[800px] max-w-[90vw] sm:max-w-[90vw] overflow-hidden flex flex-col p-0 gap-0">
                {/* Custom Sheet Header to fit Tabs nicely */}
                <div className="p-6 pb-0">
                    <SheetHeader className="mb-2">
                        <SheetTitle>Dispatch Operations</SheetTitle>
                        <SheetDescription>Manage details for {drawerContent?.type} {drawerContent?.legId || drawerContent?.id}</SheetDescription>
                    </SheetHeader>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2">
                   {renderDrawerContent()}
                </div>
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
