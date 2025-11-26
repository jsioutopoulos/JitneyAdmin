import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { trips, vehicles, crew, Trip, Crew, Vehicle, Stop, Passenger, TripLeg, feederTrips, charterTrips } from "@/lib/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Printer, Check, Bus, User, Shield, AlertCircle, GripVertical, Plus, X, 
  History, ChevronRight, ChevronLeft, MapPin, Navigation, Calendar, Phone, 
  Star, Users, Accessibility, Package, Search, List, UserPlus,
  MoreHorizontal, Bell, Settings, Filter, Clock, Circle, LayoutGrid, Table as TableIcon,
  PanelLeftClose, PanelLeftOpen, Edit, ChevronDown
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

type ResourceType = 'vehicle' | 'driver' | 'attendant' | 'trip' | 'leg' | 'reservations' | 'stops' | 'seats';

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

  const displayName = 'name' in resource ? resource.name : (resource as Vehicle).plate;
  // For vehicles, use 'capacity' as subtext; for crew, use 'role'
  // Add report time for crew
  let subText = '';
  if ('plate' in resource) {
    subText = `Cap: ${(resource as Vehicle).capacity}`;
  } else {
    const crew = resource as Crew;
    // Format: Role • Time [Badge]
    subText = `${crew.role}`;
  }
  
  const status = resource.status;

  // Status/Type Colors
  const getResourceColor = (r: Crew | Vehicle) => {
    if ('plate' in r) {
        // Vehicle Coloring by Type
        const v = r as Vehicle;
        switch(v.type) {
            case 'Coach': return 'border-emerald-500 bg-emerald-50/50 text-emerald-900'; // Green (Jitneys & Coaches)
            case 'Ambassador': return 'border-blue-500 bg-blue-50/50 text-blue-900'; // Blue (30 pax)
            case 'Trolley': return 'border-red-500 bg-red-50/50 text-red-900'; // Trolley (~35 pax)
            case 'SCT': return 'border-purple-500 bg-purple-50/50 text-purple-900'; // Suffolk County Transit
            default: return 'border-muted bg-muted/20';
        }
    } else {
        // Crew - No Status Colors (Neutral)
        return 'border-border bg-card hover:bg-accent/5 text-foreground';
    }
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
      <div className={cn(
        "flex items-center border-l-[3px] rounded-r-md border-y border-r pl-2 pr-2 py-2 shadow-sm hover:shadow-md transition-all",
        getResourceColor(resource),
        compact ? "py-1 text-xs" : ""
      )}>
        <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 mr-2" />
        
        <div className="flex-1 grid grid-cols-[1fr_auto_auto] gap-3 items-center">
            <div className="font-bold truncate text-sm leading-tight">
                {displayName}
            </div>
            
            {!("plate" in resource) && (resource as Crew).reportTime && (
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-medium opacity-80">
                        {format((resource as Crew).reportTime!, 'HH:mm')}
                    </span>
                    
                    {(resource as Crew).reportDepot && (
                         <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold tracking-wider opacity-90 bg-background/50 border-current">
                            {(resource as Crew).reportDepot.substring(0, 3).toUpperCase()}
                        </Badge>
                    )}
                </div>
            )}

            {'plate' in resource && (
                 <div className="text-xs opacity-80 font-medium">
                    {(resource as Vehicle).capacity} PAX
                 </div>
            )}
        </div>
      </div>
    </div>
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
const MultiResourceSelect = ({ values, options, onChange, placeholder, icon: Icon, onResourceRightClick, onResourceClick, onEmptyContextMenu }: { 
  values: string[], 
  options: any[], 
  onChange: (ids: string[]) => void, 
  placeholder: string,
  icon: any,
  onResourceRightClick?: (e: React.MouseEvent, id: string, type: ResourceType) => void,
  onResourceClick?: (id: string, type: ResourceType) => void,
  onEmptyContextMenu?: (e: React.MouseEvent) => void
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
    <div className="w-full h-full relative group">
        {/* 1. Render Badges Layer (Z-Index High) */}
        {values.length > 0 && (
            <div className="absolute inset-0 flex flex-wrap gap-1 items-center px-2 py-1 z-20 pointer-events-none">
              {selectedItems.map(item => (
                <Badge 
                  key={item.id} 
                  variant="secondary" 
                  className="h-5 px-1 text-[10px] font-medium gap-1 hover:bg-primary/10 cursor-pointer transition-colors group/badge select-none pointer-events-auto shadow-sm border border-transparent hover:border-primary/20" 
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onResourceRightClick?.(e, item.id, item.role || 'driver');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onResourceClick) {
                        onResourceClick(item.id, item.role || 'driver');
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

        {/* 2. Popover Trigger Layer (Fill Space) */}
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div 
                    className="w-full h-full flex items-center px-2 hover:bg-muted/50 cursor-pointer"
                    onContextMenu={(e) => {
                        if (onEmptyContextMenu) {
                             // Only trigger if we are NOT clicking on a badge (badges stop propagation, but just in case)
                             onEmptyContextMenu(e);
                        }
                    }}
                >
                    {/* Placeholder if empty */}
                    {values.length === 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground/50 text-sm pointer-events-none">
                            <Icon className="h-3.5 w-3.5 opacity-50" />
                            <span>{placeholder}</span>
                        </div>
                    )}
                    
                    {/* Plus Icon on Hover (if not empty) */}
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
                        <Check className={cn("mr-2 h-3 w-3", values.includes(option.id) ? "opacity-100" : "opacity-0")} />
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

// Clean trip ID helper
const getCleanTripId = (id: string): string => {
  // Remove common suffixes and clean up
  return id.replace(/sg|trans|\/|\+|\s+/gi, '').replace(/[^0-9]/g, '');
};

const DigitalGridView = ({ trips, onAction }: { trips: Trip[], onAction: (type: ResourceType, id: string) => void }) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Flatten trips into individual card items
  const cardItems = trips.flatMap(t => {
    if (t.legs && t.legs.length > 0) {
      return t.legs.map(l => ({
        id: getCleanTripId(l.id) || l.id, // Use clean ID or fallback
        rawId: l.id,
        status: l.status,
        direction: l.direction,
        parent: t
      }));
    }
    return [{
      id: getCleanTripId(t.packId || t.id) || t.id,
      rawId: t.packId || t.id,
      status: t.status,
      direction: t.direction,
      parent: t
    }];
  });

  // Helper to get display status (Open/Closed/Cancelled)
  const getDisplayStatus = (status: string) => {
      if (status === 'cancelled') return 'Cancelled';
      if (status === 'completed') return 'Closed';
      return 'Open';
  };

  // Filter items
  const filteredItems = cardItems.filter(item => {
    const matchesSearch = 
        item.id.toLowerCase().includes(filter.toLowerCase()) ||
        item.parent.route.toLowerCase().includes(filter.toLowerCase()) ||
        item.rawId.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || getDisplayStatus(item.status).toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Helper to determine line brand
  const getLineBrand = (trip: Trip, vehicleId: string | null) => {
    // Determine Brand
    let brand = 'Jitney';
    let brandColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Default Jitney Green
    
    // Determine Line
    let line = 'Montauk'; // Default
    let lineColor = 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Default Green

    const r = trip.route.toLowerCase();

    // Check vehicle type first if assigned
    if (vehicleId) {
        const v = vehicles.find(v => v.id === vehicleId);
        if (v && v.type === 'Ambassador') {
            brand = 'Ambassador';
            brandColor = 'bg-blue-100 text-blue-800 border-blue-200';
            line = 'Ambassador';
            lineColor = 'bg-blue-100 text-blue-800 border-blue-200';
        }
    } 
    // Fallback to route heuristics
    else if (r.includes('ambassador')) {
        brand = 'Ambassador';
        brandColor = 'bg-blue-100 text-blue-800 border-blue-200';
        line = 'Ambassador';
        lineColor = 'bg-blue-100 text-blue-800 border-blue-200';
    }

    // If not Ambassador, determine line by route
    if (brand !== 'Ambassador') {
        if (r.includes('westhampton')) {
            line = 'Westhampton';
            lineColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        } else if (r.includes('north fork') || r.includes('greenport')) {
            line = 'North Fork';
            lineColor = 'bg-purple-100 text-purple-800 border-purple-200';
        }
    }
    
    return { brand, brandColor, line, lineColor };
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-muted/10">
      {/* Toolbar */}
      <div className="bg-background border-b p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search trips..." 
                    className="pl-8 h-9" 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
                {['all', 'open', 'closed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all",
                            statusFilter === status ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex items-center bg-muted/50 rounded-lg p-1">
            <button
                onClick={() => setView('grid')}
                className={cn(
                    "p-1.5 rounded-md transition-all",
                    view === 'grid' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <LayoutGrid className="h-4 w-4" />
            </button>
            <button
                onClick={() => setView('list')}
                className={cn(
                    "p-1.5 rounded-md transition-all",
                    view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <List className="h-4 w-4" />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item, idx) => {
                    const { brand, brandColor, line, lineColor } = getLineBrand(item.parent, item.parent.vehicleId);
                    return (
                    <Card key={`${item.parent.id}-${item.id}-${idx}`} className="group flex flex-col p-3 gap-3 hover:shadow-md transition-all border-border/60 hover:border-primary/20">
                        {/* Brand & Line Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-border/50 border-dashed">
                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 font-bold uppercase tracking-wider border", brandColor)}>
                                {brand}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 font-medium uppercase tracking-wide border", lineColor)}>
                                {line}
                            </Badge>
                        </div>

                        <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold font-mono tracking-tighter text-primary leading-none">
                                    {item.id}
                                </span>
                                <Badge variant="outline" className={cn(
                                    "w-fit mt-1 text-[9px] font-bold uppercase h-4 px-1 border",
                                    getDisplayStatus(item.status) === 'Open' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                    getDisplayStatus(item.status) === 'Closed' && "bg-gray-100 text-gray-600 border-gray-200",
                                    getDisplayStatus(item.status) === 'Cancelled' && "bg-red-50 text-red-700 border-red-200"
                                )}>
                                    {getDisplayStatus(item.status)}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-medium text-sm block">
                                    {format(item.parent.departureTime, "HH:mm")}
                                </span>
                                <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Dep</span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[40px]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 px-1.5 py-0.5 rounded">
                                    {item.direction}
                                </span>
                                {item.parent.hasAda && <Accessibility className="h-3 w-3 text-blue-500" />}
                            </div>
                            <div className="text-xs font-semibold line-clamp-2 text-foreground/90" title={item.parent.route}>
                                {item.parent.route}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                             <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-mono text-muted-foreground">
                                    {item.parent.reservedCount}/{item.parent.capacity}
                                </span>
                             </div>
                             
                             <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAction('trip', item.parent.id)}>
                                    <List className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAction('seats', item.parent.id)}>
                                    <LayoutGrid className="h-3 w-3" />
                                </Button>
                             </div>
                        </div>
                    </Card>
                    );
                })}
            </div>
        ) : (
            <div className="bg-card rounded-md border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Brand</TableHead>
                            <TableHead className="w-[100px]">Trip ID</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[100px]">Time</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead className="w-[100px]">Capacity</TableHead>
                            <TableHead className="w-[150px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.map((item, idx) => {
                            const { brand, brandColor, line, lineColor } = getLineBrand(item.parent, item.parent.vehicleId);
                            return (
                            <TableRow key={`${item.parent.id}-${item.id}-${idx}`} className="group hover:bg-muted/5">
                                <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                        <Badge variant="outline" className={cn("w-fit text-[9px] h-4 px-1 font-bold uppercase tracking-wider border", brandColor)}>
                                            {brand}
                                        </Badge>
                                        <Badge variant="outline" className={cn("w-fit text-[9px] h-4 px-1 font-medium uppercase tracking-wide border", lineColor)}>
                                            {line}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <span className="font-mono text-base font-bold text-primary">{item.id}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(
                                        "w-fit text-[10px] font-bold uppercase h-5 px-1.5 border",
                                        getDisplayStatus(item.status) === 'Open' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                        getDisplayStatus(item.status) === 'Closed' && "bg-gray-100 text-gray-600 border-gray-200",
                                        getDisplayStatus(item.status) === 'Cancelled' && "bg-red-50 text-red-700 border-red-200"
                                    )}>
                                        {getDisplayStatus(item.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {format(item.parent.departureTime, "HH:mm")}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium truncate max-w-[200px]">{item.parent.route}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] text-muted-foreground uppercase">{item.direction}</span>
                                            {item.parent.hasAda && <Accessibility className="h-3 w-3 text-blue-500" />}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        {item.parent.reservedCount}/{item.parent.capacity}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onAction('trip', item.parent.id)}>Manifest</Button>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onAction('stops', item.parent.id)}>Stops</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        )}
      </div>
    </div>
  )
}


// --- Main Component ---

export default function HybridLineup() {
  const [localTrips, setLocalTrips] = useState<Trip[]>([...trips, ...feederTrips, ...charterTrips]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDragItem, setActiveDragItem] = useState<DraggableData | null>(null);
  const [viewMode, setViewMode] = useState<'paper' | 'digital'>('paper');
  
  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<{ type: ResourceType, id: string, legId?: string } | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  
  // Resources Filter State
  const [resourceSearchQuery, setResourceSearchQuery] = useState("");
  const [collapsedResources, setCollapsedResources] = useState<{ [key: string]: boolean }>({
    vehicle: false,
    driver: false,
    attendant: false
  });

  const toggleResourceCollapse = (type: string) => {
    setCollapsedResources(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Filtered Resources
  const filteredVehicles = vehicles.filter(v => 
    v.name.toLowerCase().includes(resourceSearchQuery.toLowerCase()) || 
    v.plate.toLowerCase().includes(resourceSearchQuery.toLowerCase())
  );

  // Group Vehicles by Type
  const groupedVehicles = filteredVehicles.reduce((acc, vehicle) => {
      if (!acc[vehicle.type]) acc[vehicle.type] = [];
      acc[vehicle.type].push(vehicle);
      return acc;
  }, {} as Record<string, Vehicle[]>);

  const filteredCrew = crew.filter(c => 
    c.name.toLowerCase().includes(resourceSearchQuery.toLowerCase())
  );

  // Split Crew by Reporting vs Not Reporting
  const reportingCrew = filteredCrew.filter(c => c.reportTime);
  const notReportingCrew = filteredCrew.filter(c => !c.reportTime);

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


  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    type: ResourceType;
    id: string;
    legId?: string;
  } | null>(null);

  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent, type: ResourceType, id: string, legId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
        open: true,
        x: e.clientX,
        y: e.clientY,
        type,
        id,
        legId
    });
  };

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Filter trips by category
  const lineupTrips = localTrips.filter(t => !t.category || t.category === 'lineup');
  const feederTripsList = localTrips.filter(t => t.category === 'feeder');
  const charterTripsList = localTrips.filter(t => t.category === 'charter');

  // Split trips logic - Snake Column (First half left, Second half right)
  const splitIndex = Math.ceil(lineupTrips.length / 2);
  const leftColTrips = lineupTrips.slice(0, splitIndex);
  const rightColTrips = lineupTrips.slice(splitIndex);
  
  const maxRows = Math.max(leftColTrips.length, rightColTrips.length, 20);
  const emptyRows = Array.from({ length: maxRows }).map((_, i) => ({
    left: leftColTrips[i] || null,
    right: rightColTrips[i] || null
  }));

  // Split logic for Feeders
  const splitFeederIndex = Math.ceil(feederTripsList.length / 2);
  const leftFeederTrips = feederTripsList.slice(0, splitFeederIndex);
  const rightFeederTrips = feederTripsList.slice(splitFeederIndex);
  const maxFeederRows = Math.max(leftFeederTrips.length, rightFeederTrips.length);
  const feederRows = Array.from({ length: maxFeederRows }).map((_, i) => ({
    left: leftFeederTrips[i] || null,
    right: rightFeederTrips[i] || null
  }));

  // Split logic for Charters
  const splitCharterIndex = Math.ceil(charterTripsList.length / 2);
  const leftCharterTrips = charterTripsList.slice(0, splitCharterIndex);
  const rightCharterTrips = charterTripsList.slice(splitCharterIndex);
  const maxCharterRows = Math.max(leftCharterTrips.length, rightCharterTrips.length);
  const charterRows = Array.from({ length: maxCharterRows }).map((_, i) => ({
    left: leftCharterTrips[i] || null,
    right: rightCharterTrips[i] || null
  }));

  // Drawer Content Renderer
  const renderDrawerContent = () => {
    if (!drawerContent) return null;

    if (drawerContent.type === 'vehicle') {
      const v = vehicles.find((x: Vehicle) => x.id === drawerContent.id);
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
      const c = crew.find((x: Crew) => x.id === drawerContent.id);
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
      const t = localTrips.find((x: Trip) => x.id === drawerContent.id);
      if (!t) return null;
      const leg = t.legs?.find((l: TripLeg) => l.id === drawerContent.legId);

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

    if (drawerContent.type === 'reservations') {
        const trip = localTrips.find(t => t.id === drawerContent.id);
        if (!trip) return null;
        return (
            <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Reservations
                        </h2>
                        <p className="text-sm text-muted-foreground">Trip {getCleanTripId(trip.packId || trip.id) || trip.id} • {trip.route}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">{trip.reservedCount} / {trip.capacity}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search passengers..." className="h-8" />
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Seat</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trip.passengers.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{p.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{p.confirmationCode}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{p.type}</TableCell>
                                    <TableCell className="font-mono">{p.seat || '--'}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                                            {p.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    if (drawerContent.type === 'stops') {
        const trip = localTrips.find(t => t.id === drawerContent.id);
        if (!trip) return null;
        
        // Sort stops: Pickups first, then Dropoffs. Within each, sorted by time.
        // "both" types can be considered pickups for this logic or separate. Let's put them with pickups.
        const getTime = (d: Date | string) => new Date(d).getTime();
        const pickups = trip.stops.filter(s => s.type === 'pickup' || s.type === 'both').sort((a, b) => getTime(a.time) - getTime(b.time));
        const dropoffs = trip.stops.filter(s => s.type === 'dropoff').sort((a, b) => getTime(a.time) - getTime(b.time));

        return (
            <div className="space-y-4 h-full flex flex-col">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Stops
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage stop status and vehicle assignments</p>
                </div>

                <div className="space-y-6 flex-1 overflow-auto">
                    {/* Pickups Section */}
                    {pickups.length > 0 && (
                        <div className="space-y-3">
                             <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Pickups
                             </h3>
                             {pickups.map((stop) => (
                                <Card key={stop.id} className="p-4 border-l-4 border-l-emerald-500">
                                    {/* Stop content same as before */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-mono h-5 px-1">
                                                    {format(stop.time, "HH:mm")}
                                                </Badge>
                                                <h3 className="font-bold">{stop.name}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground capitalize mt-1">{stop.type}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="sm" 
                                                variant={stop.status === 'open' ? 'default' : 'outline'}
                                                className={cn("h-7 text-xs", stop.status === 'open' ? "bg-emerald-600 hover:bg-emerald-700" : "text-muted-foreground")}
                                                onClick={() => toggleStop(trip.id, stop.id)}
                                            >
                                                {stop.status === 'open' ? 'Open' : 'Closed'}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-muted/20 p-3 rounded-md">
                                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Assigned Vehicle</label>
                                        <div className="flex items-center gap-2">
                                            <Bus className="h-4 w-4 text-muted-foreground" />
                                            <select 
                                                className="flex-1 h-8 text-sm bg-background border border-input rounded px-2"
                                                value={stop.assignedVehicleId || ""}
                                                onChange={(e) => assignStopVehicle(trip.id, stop.id, e.target.value)}
                                            >
                                                <option value="">-- Default ({vehicles.find(v => v.id === trip.vehicleId)?.name || 'Unassigned'}) --</option>
                                                {vehicles.map(v => (
                                                    <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </Card>
                             ))}
                        </div>
                    )}

                    {/* Dropoffs Section */}
                    {dropoffs.length > 0 && (
                        <div className="space-y-3">
                             <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                Dropoffs
                             </h3>
                             {dropoffs.map((stop) => (
                                <Card key={stop.id} className="p-4 border-l-4 border-l-amber-500">
                                    {/* Stop content same as before */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-mono h-5 px-1">
                                                    {format(stop.time, "HH:mm")}
                                                </Badge>
                                                <h3 className="font-bold">{stop.name}</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground capitalize mt-1">{stop.type}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                size="sm" 
                                                variant={stop.status === 'open' ? 'default' : 'outline'}
                                                className={cn("h-7 text-xs", stop.status === 'open' ? "bg-emerald-600 hover:bg-emerald-700" : "text-muted-foreground")}
                                                onClick={() => toggleStop(trip.id, stop.id)}
                                            >
                                                {stop.status === 'open' ? 'Open' : 'Closed'}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-muted/20 p-3 rounded-md">
                                        <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Assigned Vehicle</label>
                                        <div className="flex items-center gap-2">
                                            <Bus className="h-4 w-4 text-muted-foreground" />
                                            <select 
                                                className="flex-1 h-8 text-sm bg-background border border-input rounded px-2"
                                                value={stop.assignedVehicleId || ""}
                                                onChange={(e) => assignStopVehicle(trip.id, stop.id, e.target.value)}
                                            >
                                                <option value="">-- Default ({vehicles.find(v => v.id === trip.vehicleId)?.name || 'Unassigned'}) --</option>
                                                {vehicles.map(v => (
                                                    <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </Card>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (drawerContent.type === 'seats') {
        const trip = localTrips.find(t => t.id === drawerContent.id);
        if (!trip) return null;
        return (
            <div className="space-y-4 h-full flex flex-col">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5 text-primary" />
                        Seat Map
                    </h2>
                    <p className="text-sm text-muted-foreground">Visual seat layout</p>
                </div>
                
                <div className="flex-1 bg-muted/10 rounded-lg border border-dashed flex items-center justify-center">
                    <div className="text-center space-y-2">
                        <div className="grid grid-cols-4 gap-4 p-8 max-w-md mx-auto bg-white rounded-xl shadow-sm border">
                            {/* Driver Area */}
                            <div className="col-span-4 border-b pb-4 mb-4 flex justify-between">
                                <div className="h-10 w-10 border rounded bg-muted flex items-center justify-center">
                                    <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider self-center">Front</div>
                                <div className="h-10 w-10 border rounded bg-muted/30" />
                            </div>

                            {/* Seats */}
                            {Array.from({ length: 10 }).map((_, row) => (
                                <>
                                    <div className="h-10 w-10 border rounded bg-emerald-100 border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700 cursor-pointer hover:bg-emerald-200 transition-colors">
                                        {row + 1}A
                                    </div>
                                    <div className="h-10 w-10 border rounded bg-emerald-100 border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700 cursor-pointer hover:bg-emerald-200 transition-colors mr-4">
                                        {row + 1}B
                                    </div>
                                    <div className="h-10 w-10 border rounded bg-white border-border flex items-center justify-center text-xs font-bold text-muted-foreground cursor-pointer hover:bg-gray-50 transition-colors">
                                        {row + 1}C
                                    </div>
                                    <div className="h-10 w-10 border rounded bg-white border-border flex items-center justify-center text-xs font-bold text-muted-foreground cursor-pointer hover:bg-gray-50 transition-colors">
                                        {row + 1}D
                                    </div>
                                </>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null;
  };

  // Handle drawer action
  const handleDrawerAction = (type: ResourceType, id: string) => {
      setDrawerContent({ type, id });
      setDrawerOpen(true);
  };

  return (
    <Layout>
      <div className="h-full w-full" onContextMenu={(e) => e.preventDefault()}>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="h-full flex overflow-hidden">
          
          {/* LEFT SIDEBAR - RESOURCES */}
          {sidebarOpen ? (
            <div className="w-72 bg-background border-r border-border flex flex-col shadow-sm shrink-0 z-20">
              <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Resources</h2>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSidebarOpen(false)}>
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search resources..." 
                    className="h-8 pl-8 text-xs" 
                    value={resourceSearchQuery}
                    onChange={(e) => setResourceSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer mb-3 sticky top-0 bg-background py-1 z-10 group"
                      onClick={() => toggleResourceCollapse('vehicle')}
                    >
                        <h3 className="text-xs font-bold text-primary flex items-center gap-2">
                          <Bus className="h-3.5 w-3.5" /> Vehicles ({filteredVehicles.length})
                        </h3>
                        <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", !collapsedResources.vehicle && "rotate-90")} />
                    </div>
                    
                    {!collapsedResources.vehicle && (
                      <div className="space-y-4 pl-1">
                        {Object.keys(groupedVehicles).length > 0 ? (
                            Object.entries(groupedVehicles).map(([type, vehicles]) => (
                                <div key={type} className="space-y-1">
                                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider pl-1 mb-1">{type}s</h4>
                                    {vehicles.map((v: Vehicle) => (
                                        <DraggableResource 
                                            key={v.id} 
                                            resource={v} 
                                            type="vehicle" 
                                            compact 
                                            onContextMenu={(e) => handleContextMenu(e, 'vehicle', v.id)}
                                        />
                                    ))}
                                </div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic px-2">No vehicles found</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer mb-3 sticky top-0 bg-background py-1 z-10 group"
                      onClick={() => toggleResourceCollapse('driver')}
                    >
                        <h3 className="text-xs font-bold text-primary flex items-center gap-2">
                          <User className="h-3.5 w-3.5" /> Drivers ({filteredCrew.filter((c: Crew) => c.role === 'driver').length})
                        </h3>
                        <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", !collapsedResources.driver && "rotate-90")} />
                    </div>

                    {!collapsedResources.driver && (
                      <div className="space-y-4 pl-1">
                        {/* Reporting Today */}
                        <div className="space-y-1">
                             <h4 className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider pl-1 mb-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Reporting Today
                             </h4>
                            {reportingCrew.filter((c: Crew) => c.role === 'driver').map((c: Crew) => (
                            <DraggableResource 
                                key={c.id} 
                                resource={c} 
                                type="driver" 
                                compact 
                                onContextMenu={(e) => handleContextMenu(e, 'driver', c.id)}
                            />
                            ))}
                            {reportingCrew.filter((c: Crew) => c.role === 'driver').length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic px-2">No drivers reporting</p>
                            )}
                        </div>

                        {/* Not Reporting / Available Pool */}
                        <div className="space-y-1">
                             <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider pl-1 mb-1 flex items-center gap-1">
                                <Users className="h-3 w-3" /> Available Pool
                             </h4>
                            {notReportingCrew.filter((c: Crew) => c.role === 'driver').map((c: Crew) => (
                            <DraggableResource 
                                key={c.id} 
                                resource={c} 
                                type="driver" 
                                compact 
                                onContextMenu={(e) => handleContextMenu(e, 'driver', c.id)}
                            />
                            ))}
                             {notReportingCrew.filter((c: Crew) => c.role === 'driver').length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic px-2">No other drivers</p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer mb-3 sticky top-0 bg-background py-1 z-10 group"
                      onClick={() => toggleResourceCollapse('attendant')}
                    >
                        <h3 className="text-xs font-bold text-primary flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5" /> Attendants ({filteredCrew.filter((c: Crew) => c.role === 'attendant').length})
                        </h3>
                         <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", !collapsedResources.attendant && "rotate-90")} />
                    </div>
                    
                    {!collapsedResources.attendant && (
                      <div className="space-y-4 pl-1">
                         {/* Reporting Today */}
                         <div className="space-y-1">
                             <h4 className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider pl-1 mb-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Reporting Today
                             </h4>
                            {reportingCrew.filter((c: Crew) => c.role === 'attendant').map((c: Crew) => (
                            <DraggableResource 
                                key={c.id} 
                                resource={c} 
                                type="attendant" 
                                compact 
                                onContextMenu={(e) => handleContextMenu(e, 'attendant', c.id)}
                            />
                            ))}
                             {reportingCrew.filter((c: Crew) => c.role === 'attendant').length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic px-2">No attendants reporting</p>
                            )}
                        </div>

                        {/* Not Reporting / Available Pool */}
                        <div className="space-y-1">
                             <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider pl-1 mb-1 flex items-center gap-1">
                                <Users className="h-3 w-3" /> Available Pool
                             </h4>
                            {notReportingCrew.filter((c: Crew) => c.role === 'attendant').map((c: Crew) => (
                            <DraggableResource 
                                key={c.id} 
                                resource={c} 
                                type="attendant" 
                                compact 
                                onContextMenu={(e) => handleContextMenu(e, 'attendant', c.id)}
                            />
                            ))}
                            {notReportingCrew.filter((c: Crew) => c.role === 'attendant').length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic px-2">No other attendants</p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            // Collapsed Sidebar Rail
            <div className="w-12 bg-background border-r border-border flex flex-col shadow-sm shrink-0 z-20 items-center py-4 gap-8">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
                    <PanelLeftOpen className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Separator />
                <div className="flex flex-col gap-6">
                    <div className="group relative flex justify-center" title="Vehicles">
                        <Bus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[9px]">{vehicles.length}</Badge>
                    </div>
                    <div className="group relative flex justify-center" title="Drivers">
                        <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[9px]">{crew.filter(c => c.role === 'driver').length}</Badge>
                    </div>
                    <div className="group relative flex justify-center" title="Attendants">
                        <Shield className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[9px]">{crew.filter(c => c.role === 'attendant').length}</Badge>
                    </div>
                </div>
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
                 <Button variant="outline" size="sm" className="h-9 gap-2 hidden lg:flex">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="hidden xl:inline">Islip</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1">5</Badge>
                 </Button>
                 <Button variant="outline" size="sm" className="h-9 gap-2 hidden lg:flex">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="hidden xl:inline">Farmingville</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1">8</Badge>
                 </Button>
                 <Separator orientation="vertical" className="h-6 mx-2 hidden lg:block" />
                 <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print Sheet
                </Button>
              </div>
            </div>

            {/* Content Switcher */}
            {viewMode === 'digital' ? (
               <DigitalGridView trips={localTrips} onAction={handleDrawerAction} />
            ) : (
              /* Scrollable Grid (Paper View) */
              <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible pb-48">
                <div className="bg-card w-[1400px] min-h-[800px] shadow-xl border border-border/60 rounded-sm relative text-card-foreground font-sans text-sm print:shadow-none print:border-none print:w-full flex flex-col mb-10">
                  
                  {/* Header */}
                  <div className="border-b border-border p-6 flex justify-between items-start bg-muted/5 shrink-0">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-primary">HAMPTON JITNEY</h1>
                        <h2 className="text-lg font-medium text-muted-foreground tracking-wide">DAILY OPERATIONS LINEUP (v2)</h2>
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
                          <div key={`L-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0 group hover:bg-muted/10 transition-colors">
                            {/* Trip ID */}
                            <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex items-center justify-center px-1 relative overflow-hidden">
                                {row.left && row.left.legs && row.left.legs.length > 0 ? (
                                  <div className="flex items-center gap-1 overflow-hidden w-full justify-center">
                                    {/* Westbound Legs */}
                                    {row.left.legs.filter((l: TripLeg) => l.direction === 'westbound').map((leg: TripLeg) => (
                                      <Badge
                                        key={leg.id} 
                                        variant="outline"
                                        className={cn(
                                          "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                                          // leg.status === 'en-route' && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                                          // leg.status === 'completed' && "bg-muted text-muted-foreground border-transparent opacity-70",
                                          // leg.status === 'scheduled' && "bg-background text-primary"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDrawerAction('trip', row.left!.id);
                                        }}
                                        onContextMenu={(e) => handleContextMenu(e, 'trip', row.left!.id, leg.id)}
                                      >
                                        {leg.id}
                                      </Badge>
                                    ))}

                                    {/* Separator if both directions exist */}
                                    {row.left.legs.some((l: TripLeg) => l.direction === 'westbound') && 
                                     row.left.legs.some((l: TripLeg) => l.direction === 'eastbound') && (
                                      <span className="text-muted-foreground font-bold mx-0.5 text-[10px]">+</span>
                                    )}

                                    {/* Eastbound Legs */}
                                    {row.left.legs.filter((l: TripLeg) => l.direction === 'eastbound').map((leg: TripLeg) => (
                                      <Badge
                                        key={leg.id} 
                                        variant="outline"
                                        className={cn(
                                          "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                                          // leg.status === 'en-route' && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                                          // leg.status === 'completed' && "bg-muted text-muted-foreground border-transparent opacity-70",
                                          // leg.status === 'scheduled' && "bg-background text-primary"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDrawerAction('trip', row.left!.id);
                                        }}
                                        onContextMenu={(e) => handleContextMenu(e, 'trip', row.left!.id, leg.id)}
                                      >
                                        {leg.id}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : row.left && (
                                  // Fallback for single leg
                                   <EditableText 
                                      value={row.left.packId || row.left.id.toUpperCase()} 
                                      onChange={(val) => handleUpdateTrip(row.left!.id, 'packId', val)}
                                      className="text-sm font-bold text-primary text-center font-mono"
                                      onContextMenu={(e) => handleContextMenu(e, 'trip', row.left!.id)}
                                    />
                                )}
                                
                                {row.left && row.left.hasAda && (
                                  <div className="absolute top-1 right-1" />
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
                                      onResourceRightClick={(e, id, type) => handleContextMenu(e, 'vehicle', id)}
                                      onResourceClick={(id, type) => handleDrawerAction('vehicle', id)}
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
                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'driver', id)}
                                        onResourceClick={(id, type) => handleDrawerAction('driver', id)}
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
                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'attendant', id)}
                                        onResourceClick={(id, type) => handleDrawerAction('attendant', id)}
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
                          <div key={`R-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0 group hover:bg-muted/10 transition-colors">
                            {/* Trip ID */}
                            <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex items-center justify-center px-1 relative overflow-hidden">
                                {row.right && row.right.legs && row.right.legs.length > 0 ? (
                                  <div className="flex items-center gap-1 overflow-hidden w-full justify-center">
                                    {/* Westbound Legs */}
                                    {row.right.legs.filter((l: TripLeg) => l.direction === 'westbound').map((leg: TripLeg) => (
                                      <Badge
                                        key={leg.id} 
                                        variant="outline"
                                        className={cn(
                                          "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                                          // leg.status === 'en-route' && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                                          // leg.status === 'completed' && "bg-muted text-muted-foreground border-transparent opacity-70",
                                          // leg.status === 'scheduled' && "bg-background text-primary"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDrawerAction('trip', row.right!.id);
                                        }}
                                        onContextMenu={(e) => handleContextMenu(e, 'trip', row.right!.id, leg.id)}
                                      >
                                        {leg.id}
                                      </Badge>
                                    ))}

                                    {/* Separator if both directions exist */}
                                    {row.right.legs.some((l: TripLeg) => l.direction === 'westbound') && 
                                     row.right.legs.some((l: TripLeg) => l.direction === 'eastbound') && (
                                      <span className="text-muted-foreground font-bold mx-0.5 text-[10px]">+</span>
                                    )}

                                    {/* Eastbound Legs */}
                                    {row.right.legs.filter((l: TripLeg) => l.direction === 'eastbound').map((leg: TripLeg) => (
                                      <Badge
                                        key={leg.id} 
                                        variant="outline"
                                        className={cn(
                                          "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                                          // leg.status === 'en-route' && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                                          // leg.status === 'completed' && "bg-muted text-muted-foreground border-transparent opacity-70",
                                          // leg.status === 'scheduled' && "bg-background text-primary"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDrawerAction('trip', row.right!.id);
                                        }}
                                        onContextMenu={(e) => handleContextMenu(e, 'trip', row.right!.id, leg.id)}
                                      >
                                        {leg.id}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : row.right && (
                                  // Fallback for single leg
                                   <EditableText 
                                      value={row.right.packId || row.right.id.toUpperCase()} 
                                      onChange={(val) => handleUpdateTrip(row.right!.id, 'packId', val)}
                                      className="text-sm font-bold text-primary text-center font-mono"
                                      onContextMenu={(e) => handleContextMenu(e, 'trip', row.right!.id)}
                                    />
                                )}

                                {row.right && row.right.hasAda && (
                                  <div className="absolute top-1 right-1" />
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
                                      onResourceRightClick={(e, id, type) => handleContextMenu(e, 'vehicle', id)}
                                      onResourceClick={(id, type) => handleDrawerAction('vehicle', id)}
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
                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'driver', id)}
                                        onResourceClick={(id, type) => handleDrawerAction('driver', id)}
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
                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'attendant', id)}
                                        onResourceClick={(id, type) => handleDrawerAction('attendant', id)}
                                      />
                                    </DroppableCell>
                                  )}
                                </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer (Feeders & Charters) */}
                  <div className="flex flex-col border-t border-border shrink-0 bg-card">
                     
                     {/* Suffolk County Feeder Section */}
                     <div className="flex flex-col border-b border-border">
                        <div className="bg-purple-50/50 border-b border-border p-2 px-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-900">Suffolk County Feeder</h3>
                        </div>
                        
                        {/* Header Row */}
                        <div className="flex border-b border-border h-9 bg-muted/30 shrink-0">
                            {/* Left Column Header */}
                            <div className="flex-1 flex border-r border-border">
                                <div className="w-[15%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Trip</div>
                                <div className="w-[20%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Vehicle</div>
                                <div className="w-[65%] flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Driver</div>
                            </div>
                            {/* Right Column Header */}
                            <div className="flex-1 flex">
                                <div className="w-[15%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Trip</div>
                                <div className="w-[20%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Vehicle</div>
                                <div className="w-[65%] flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Driver</div>
                            </div>
                        </div>

                        <div className="flex flex-col bg-card">
                            {feederRows.map((row, idx) => (
                                <div key={`F-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0 group hover:bg-muted/10 transition-colors">
                                    {/* LEFT COLUMN */}
                                    <div className="flex-1 flex border-r border-border">
                                        {/* Trip ID */}
                                        <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex items-center justify-center px-1">
                                            {row.left && (
                                                <EditableText 
                                                    value={row.left.packId || row.left.id.toUpperCase()} 
                                                    onChange={(val) => handleUpdateTrip(row.left!.id, 'packId', val)}
                                                    className="text-sm font-bold text-primary text-center font-mono"
                                                    onContextMenu={(e) => handleContextMenu(e, 'trip', row.left!.id)}
                                                />
                                            )}
                                        </div>
                                        
                                        {/* Vehicle */}
                                        <div className="w-[20%] border-r border-border p-0 relative">
                                            {row.left && (
                                                <DroppableCell id={`${row.left.id}:vehicleId`} accept={['vehicle']}>
                                                    <MultiResourceSelect 
                                                        values={row.left.vehicleId ? [row.left.vehicleId] : []}
                                                        options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1] }))}
                                                        onChange={(ids) => handleUpdateTrip(row.left!.id, 'vehicleId', ids[0] || null)}
                                                        placeholder="Bus"
                                                        icon={Bus}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'vehicle', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('vehicle', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>

                                        {/* Driver (Expanded to 65%) */}
                                        <div className="w-[65%] relative">
                                            {row.left && (
                                                <DroppableCell id={`${row.left.id}:driverIds`} accept={['driver']}>
                                                    <MultiResourceSelect 
                                                        values={row.left.driverIds || []}
                                                        options={crew.filter(c => c.role === 'driver')}
                                                        onChange={(ids) => handleUpdateTrip(row.left!.id, 'driverIds', ids)}
                                                        placeholder="Drivers"
                                                        icon={User}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'driver', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('driver', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="flex-1 flex">
                                        {/* Trip ID */}
                                        <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex items-center justify-center px-1">
                                            {row.right && (
                                                <EditableText 
                                                    value={row.right.packId || row.right.id.toUpperCase()} 
                                                    onChange={(val) => handleUpdateTrip(row.right!.id, 'packId', val)}
                                                    className="text-sm font-bold text-primary text-center font-mono"
                                                    onContextMenu={(e) => handleContextMenu(e, 'trip', row.right!.id)}
                                                />
                                            )}
                                        </div>
                                        
                                        {/* Vehicle */}
                                        <div className="w-[20%] border-r border-border p-0 relative">
                                            {row.right && (
                                                <DroppableCell id={`${row.right.id}:vehicleId`} accept={['vehicle']}>
                                                    <MultiResourceSelect 
                                                        values={row.right.vehicleId ? [row.right.vehicleId] : []}
                                                        options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1] }))}
                                                        onChange={(ids) => handleUpdateTrip(row.right!.id, 'vehicleId', ids[0] || null)}
                                                        placeholder="Bus"
                                                        icon={Bus}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'vehicle', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('vehicle', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>

                                        {/* Driver (Expanded to 65%) */}
                                        <div className="w-[65%] relative">
                                            {row.right && (
                                                <DroppableCell id={`${row.right.id}:driverIds`} accept={['driver']}>
                                                    <MultiResourceSelect 
                                                        values={row.right.driverIds || []}
                                                        options={crew.filter(c => c.role === 'driver')}
                                                        onChange={(ids) => handleUpdateTrip(row.right!.id, 'driverIds', ids)}
                                                        placeholder="Drivers"
                                                        icon={User}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'driver', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('driver', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {feederTripsList.length === 0 && (
                                <div className="p-4 text-center text-muted-foreground text-xs italic">No feeder trips scheduled</div>
                            )}
                        </div>
                     </div>

                     {/* Charters Section */}
                     <div className="flex flex-col">
                        <div className="bg-amber-50/50 border-b border-border p-2 px-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">Charters</h3>
                        </div>
                        
                        {/* Header Row */}
                        <div className="flex border-b border-border h-9 bg-muted/30 shrink-0">
                            {/* Left Column Header */}
                            <div className="flex-1 flex border-r border-border">
                                <div className="w-[15%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Trip</div>
                                <div className="w-[20%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Vehicle</div>
                                <div className="w-[65%] flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Driver</div>
                            </div>
                            {/* Right Column Header */}
                            <div className="flex-1 flex">
                                <div className="w-[15%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Trip</div>
                                <div className="w-[20%] border-r border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Vehicle</div>
                                <div className="w-[65%] flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">Driver</div>
                            </div>
                        </div>

                        <div className="flex flex-col bg-card">
                            {charterRows.map((row, idx) => (
                                <div key={`C-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0 group hover:bg-muted/10 transition-colors">
                                    {/* LEFT COLUMN */}
                                    <div className="flex-1 flex border-r border-border">
                                        {/* Trip ID */}
                                        <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex items-center justify-center px-1">
                                            {row.left && (
                                                <EditableText 
                                                    value={row.left.packId || row.left.id.toUpperCase()} 
                                                    onChange={(val) => handleUpdateTrip(row.left!.id, 'packId', val)}
                                                    className="text-sm font-bold text-primary text-center font-mono"
                                                    onContextMenu={(e) => handleContextMenu(e, 'trip', row.left!.id)}
                                                />
                                            )}
                                        </div>
                                        
                                        {/* Vehicle */}
                                        <div className="w-[20%] border-r border-border p-0 relative">
                                            {row.left && (
                                                <DroppableCell id={`${row.left.id}:vehicleId`} accept={['vehicle']}>
                                                    <MultiResourceSelect 
                                                        values={row.left.vehicleId ? [row.left.vehicleId] : []}
                                                        options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1] }))}
                                                        onChange={(ids) => handleUpdateTrip(row.left!.id, 'vehicleId', ids[0] || null)}
                                                        placeholder="Bus"
                                                        icon={Bus}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'vehicle', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('vehicle', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>

                                        {/* Driver (Expanded to 65%) */}
                                        <div className="w-[65%] relative">
                                            {row.left && (
                                                <DroppableCell id={`${row.left.id}:driverIds`} accept={['driver']}>
                                                    <MultiResourceSelect 
                                                        values={row.left.driverIds || []}
                                                        options={crew.filter(c => c.role === 'driver')}
                                                        onChange={(ids) => handleUpdateTrip(row.left!.id, 'driverIds', ids)}
                                                        placeholder="Drivers"
                                                        icon={User}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'driver', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('driver', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="flex-1 flex">
                                        {/* Trip ID */}
                                        <div className="w-[15%] border-r border-border bg-muted/5 group-hover:bg-muted/10 flex items-center justify-center px-1">
                                            {row.right && (
                                                <EditableText 
                                                    value={row.right.packId || row.right.id.toUpperCase()} 
                                                    onChange={(val) => handleUpdateTrip(row.right!.id, 'packId', val)}
                                                    className="text-sm font-bold text-primary text-center font-mono"
                                                    onContextMenu={(e) => handleContextMenu(e, 'trip', row.right!.id)}
                                                />
                                            )}
                                        </div>
                                        
                                        {/* Vehicle */}
                                        <div className="w-[20%] border-r border-border p-0 relative">
                                            {row.right && (
                                                <DroppableCell id={`${row.right.id}:vehicleId`} accept={['vehicle']}>
                                                    <MultiResourceSelect 
                                                        values={row.right.vehicleId ? [row.right.vehicleId] : []}
                                                        options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1] }))}
                                                        onChange={(ids) => handleUpdateTrip(row.right!.id, 'vehicleId', ids[0] || null)}
                                                        placeholder="Bus"
                                                        icon={Bus}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'vehicle', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('vehicle', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>

                                        {/* Driver (Expanded to 65%) */}
                                        <div className="w-[65%] relative">
                                            {row.right && (
                                                <DroppableCell id={`${row.right.id}:driverIds`} accept={['driver']}>
                                                    <MultiResourceSelect 
                                                        values={row.right.driverIds || []}
                                                        options={crew.filter(c => c.role === 'driver')}
                                                        onChange={(ids) => handleUpdateTrip(row.right!.id, 'driverIds', ids)}
                                                        placeholder="Drivers"
                                                        icon={User}
                                                        onResourceRightClick={(e, id, type) => handleContextMenu(e, 'driver', id)}
                                                        onResourceClick={(id, type) => handleDrawerAction('driver', id)}
                                                    />
                                                </DroppableCell>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {charterTripsList.length === 0 && (
                                <div className="p-4 text-center text-muted-foreground text-xs italic">No charter trips scheduled</div>
                            )}
                        </div>
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

        {/* Custom Context Menu */}
        {contextMenu && (
            <div 
                className="fixed z-50 w-56 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 zoom-in-95"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                {contextMenu.type === 'trip' ? (
                    <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b mb-1">
                            Trip Options
                        </div>
                        <Button variant="ghost" className="w-full justify-start h-8 text-xs px-2" onClick={() => {
                            setDrawerContent({ type: 'trip', id: contextMenu.id, legId: contextMenu.legId });
                            setDrawerOpen(true);
                            setContextMenu(null);
                        }}>
                            <List className="mr-2 h-3.5 w-3.5" />
                            View Manifest
                        </Button>
                         <Button variant="ghost" className="w-full justify-start h-8 text-xs px-2" onClick={() => {
                            setDrawerContent({ type: 'stops', id: contextMenu.id });
                            setDrawerOpen(true);
                            setContextMenu(null);
                        }}>
                            <MapPin className="mr-2 h-3.5 w-3.5" />
                            Manage Stops
                        </Button>
                        <Button variant="ghost" className="w-full justify-start h-8 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <X className="mr-2 h-3.5 w-3.5" />
                            Cancel Trip
                        </Button>
                        <Separator className="my-1" />
                        <Button variant="ghost" className="w-full justify-start h-8 text-xs px-2 text-muted-foreground" onClick={() => setContextMenu(null)}>
                            <PanelLeftClose className="mr-2 h-3.5 w-3.5" />
                            Dismiss
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b mb-1">
                            {contextMenu.type === 'vehicle' ? 'Vehicle' : 'Crew'} Options
                        </div>
                        <Button variant="ghost" className="w-full justify-start h-8 text-xs px-2" onClick={() => {
                            setDrawerContent({ type: contextMenu.type, id: contextMenu.id });
                            setDrawerOpen(true);
                            setContextMenu(null);
                        }}>
                            <List className="mr-2 h-3.5 w-3.5" />
                            View Details
                        </Button>
                        <Button variant="ghost" className="w-full justify-start h-8 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                             // Logic to unassign would go here
                             setContextMenu(null);
                        }}>
                            <X className="mr-2 h-3.5 w-3.5" />
                            Unassign
                        </Button>
                        <Separator className="my-1" />
                        <Button variant="ghost" className="w-full justify-start h-8 text-xs px-2 text-muted-foreground" onClick={() => setContextMenu(null)}>
                            <PanelLeftClose className="mr-2 h-3.5 w-3.5" />
                            Dismiss
                        </Button>
                    </>
                )}
            </div>
        )}
      </DndContext>
      </div>
    </Layout>
  );
}
