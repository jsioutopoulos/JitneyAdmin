import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { trips, vehicles, crew } from "@/lib/mockData";
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

// --- Components ---

const DraggableResource = ({ resource, type, compact = false, onContextMenu }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resource-${type}-${resource.id}`,
    data: { type, id: resource.id, data: resource },
  });

  const displayName = 'name' in resource ? resource.name : resource.plate;
  // For vehicles, use 'capacity' as subtext; for crew, use 'role'
  // Add report time for crew
  let subText = '';
  if ('plate' in resource) {
    subText = `Cap: ${resource.capacity}`;
  } else {
    const crew = resource;
    // Format: Role • Time [Badge]
    subText = `${crew.role}`;
  }
  
  const status = resource.status;

  // Status/Type Colors
  const getResourceColor = (r) => {
    if ('plate' in r) {
        // Vehicle Coloring by Type
        const v = r;
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
            
            {!("plate" in resource) && resource.reportTime && (
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-medium opacity-80">
                        {format(resource.reportTime, 'HH:mm')}
                    </span>
                    
                    {resource.reportDepot && (
                         <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold tracking-wider opacity-90 bg-background/50 border-current">
                            {resource.reportDepot.substring(0, 3).toUpperCase()}
                        </Badge>
                    )}
                </div>
            )}

            {'plate' in resource && (
                 <div className="text-xs opacity-80 font-medium">
                    {resource.capacity} PAX
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

const DroppableCell = ({ id, children, accept, isOver }) => {
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
const MultiResourceSelect = ({ values, options, onChange, placeholder, icon: Icon, onResourceRightClick, onResourceClick, onEmptyContextMenu }) => {
  const [open, setOpen] = useState(false);
  
  const selectedItems = options.filter(o => values.includes(o.id));

  const toggleItem = (id) => {
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

const EditableText = ({ value, onChange, className, onContextMenu }) => {
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
const getCleanTripId = (id) => {
  // Remove common suffixes and clean up
  return id.replace(/sg|trans|\/|\+|\s+/gi, '').replace(/[^0-9]/g, '');
};

const DigitalGridView = ({ trips, onAction }) => {
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
  const getDisplayStatus = (status) => {
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
  const getLineBrand = (trip, vehicleId) => {
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
                            <TableRow key={`${item.parent.id}-${item.id}-${idx}`}>
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
                                        "w-fit text-[9px] font-bold uppercase h-4 px-1 border",
                                        getDisplayStatus(item.status) === 'Open' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                        getDisplayStatus(item.status) === 'Closed' && "bg-gray-100 text-gray-600 border-gray-200",
                                        getDisplayStatus(item.status) === 'Cancelled' && "bg-red-50 text-red-700 border-red-200"
                                    )}>
                                        {getDisplayStatus(item.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {format(item.parent.departureTime, "HH:mm")}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.parent.route}</span>
                                        <span className="text-xs text-muted-foreground">{item.direction}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm font-mono text-muted-foreground">
                                    {item.parent.reservedCount}/{item.parent.capacity}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => onAction('trip', item.parent.id)}>
                                            View Trip
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </div>
        )}
      </div>
    </div>
  );
};

export default function PaperLineup() {
  const [tripData, setTripData] = useState(trips);
  const [vehicleData, setVehicleData] = useState(vehicles);
  const [crewData, setCrewData] = useState(crew);
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  
  const [activeView, setActiveView] = useState("lineup"); // 'lineup' | 'digital'
  const [showSidebar, setShowSidebar] = useState(true);

  const handleDragStart = (event) => {
    const { active } = event;
    const { type, id } = active.data.current;
    setActiveId(id);
    setActiveType(type);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle drop logic
      console.log(`Dropped ${active.data.current.type} ${active.id} over ${over.id}`);
      
      // Parse drop target
      // resource-slot-{tripId}-{role/type}
      const overId = over.id;
      
      // Extract trip ID and target type from overId
      // Format: resource-slot-t1-driver
      if (typeof overId === 'string' && overId.startsWith('resource-slot-')) {
        const parts = overId.replace('resource-slot-', '').split('-');
        // This simple split might fail if trip ID has dashes. 
        // Better: resource-slot-{tripId}-{slotType} where slotType is last part
        
        let tripId = '';
        let slotType = '';
        
        if (parts.length >= 2) {
            slotType = parts[parts.length - 1];
            tripId = parts.slice(0, parts.length - 1).join('-');
        }
        
        const sourceType = active.data.current.type;
        const sourceId = active.data.current.id;
        
        console.log(`Assignment: Trip=${tripId}, Slot=${slotType}, Resource=${sourceType}, ID=${sourceId}`);

        // Update State
        const newTripData = [...tripData];
        const tripIndex = newTripData.findIndex(t => t.id === tripId);
        
        if (tripIndex >= 0) {
            const trip = newTripData[tripIndex];
            
            if (sourceType === 'vehicle' && slotType === 'vehicle') {
                trip.vehicleId = sourceId;
            } else if (sourceType === 'driver' && slotType === 'driver') {
                if (!trip.driverIds.includes(sourceId)) {
                    trip.driverIds = [...trip.driverIds, sourceId];
                }
            } else if (sourceType === 'attendant' && slotType === 'attendant') {
                if (!trip.attendantIds.includes(sourceId)) {
                    trip.attendantIds = [...trip.attendantIds, sourceId];
                }
            }
            
            setTripData(newTripData);
        }
      }
    }

    setActiveId(null);
    setActiveType(null);
  };

  // Split trips into columns for the "Paper" view
  const leftColumnTrips = tripData.filter((_, i) => i % 2 === 0);
  const rightColumnTrips = tripData.filter((_, i) => i % 2 !== 0);

  // Organized Resources for Sidebar
  const vehiclesByType = {
    'Ambassador': vehicleData.filter(v => v.type === 'Ambassador'),
    'Coach': vehicleData.filter(v => v.type === 'Coach'),
    'Trolley': vehicleData.filter(v => v.type === 'Trolley'),
    'SCT': vehicleData.filter(v => v.type === 'SCT'),
  };

  // Split Crew by Reporting Status (Reporting Today vs Available Pool)
  const driversReporting = crewData.filter(c => c.role === 'driver' && c.reportTime);
  const driversPool = crewData.filter(c => c.role === 'driver' && !c.reportTime);
  
  const attendantsReporting = crewData.filter(c => c.role === 'attendant' && c.reportTime);
  const attendantsPool = crewData.filter(c => c.role === 'attendant' && !c.reportTime);

  // Sort reporting crew by time
  driversReporting.sort((a, b) => (a.reportTime && b.reportTime) ? a.reportTime.getTime() - b.reportTime.getTime() : 0);
  attendantsReporting.sort((a, b) => (a.reportTime && b.reportTime) ? a.reportTime.getTime() - b.reportTime.getTime() : 0);

  const handleUnassign = (e, tripId, resourceId, type) => {
      e.stopPropagation();
      e.preventDefault();
      
      const newTripData = [...tripData];
      const tripIndex = newTripData.findIndex(t => t.id === tripId);
      
      if (tripIndex >= 0) {
        const trip = newTripData[tripIndex];
        if (type === 'vehicle') {
            trip.vehicleId = null;
        } else if (type === 'driver') {
            trip.driverIds = trip.driverIds.filter(id => id !== resourceId);
        } else if (type === 'attendant') {
            trip.attendantIds = trip.attendantIds.filter(id => id !== resourceId);
        }
        setTripData(newTripData);
      }
  };

  const handleDigitalAction = (type, id) => {
      console.log("Digital Action:", type, id);
      // Switch to paper view and scroll to trip?
      setActiveView('lineup');
      // Logic to highlight/scroll would go here
  };

  return (
    <Layout className="bg-background h-screen flex flex-col overflow-hidden">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        {/* Header / Toolbar */}
        <header className="bg-background border-b px-4 py-2 flex items-center justify-between shrink-0 h-14 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Bus className="h-6 w-6 text-primary" />
                Jitney Lineup
            </h1>
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center bg-muted rounded-lg p-1">
                <button 
                    onClick={() => setActiveView('lineup')}
                    className={cn(
                        "px-3 py-1 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                        activeView === 'lineup' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <LayoutGrid className="h-4 w-4" />
                    Paper Lineup
                </button>
                <button 
                    onClick={() => setActiveView('digital')}
                    className={cn(
                        "px-3 py-1 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                        activeView === 'digital' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Digital Screen
                </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(), "EEEE, MMMM do, yyyy")}</span>
            </div>

            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="default" size="sm" className="gap-2 shadow-sm">
              <Check className="h-4 w-4" />
              Publish Lineup
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSidebar(!showSidebar)}
                className={cn("ml-2 transition-transform", !showSidebar && "rotate-180")}
            >
                {showSidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
            {/* Central Workspace */}
            <main className="flex-1 overflow-hidden flex flex-col relative bg-muted/20">
                {/* Map Background Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
                    style={{ 
                        backgroundImage: `url(${mapBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'grayscale(100%) contrast(120%)'
                    }}
                />

                {activeView === 'lineup' ? (
                    <div className="flex-1 overflow-y-auto p-6 z-10">
                        <div className="max-w-[1600px] mx-auto bg-card rounded-xl shadow-sm border min-h-[800px] flex">
                            {/* Left Column */}
                            <div className="flex-1 border-r p-4 flex flex-col gap-0">
                                <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] gap-2 mb-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                                    <div>Pack</div>
                                    <div>Trip</div>
                                    <div>Route</div>
                                    <div className="text-left pl-4">Time</div>
                                    <div>Vehicle</div>
                                    <div>Crew</div>
                                </div>
                                {leftColumnTrips.map((trip) => (
                                    <TripRow 
                                        key={trip.id} 
                                        trip={trip} 
                                        vehicles={vehicleData}
                                        crew={crewData}
                                        onUnassign={handleUnassign}
                                    />
                                ))}
                            </div>

                            {/* Right Column */}
                            <div className="flex-1 p-4 flex flex-col gap-0">
                                <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] gap-2 mb-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                                    <div>Pack</div>
                                    <div>Trip</div>
                                    <div>Route</div>
                                    <div className="text-left pl-4">Time</div>
                                    <div>Vehicle</div>
                                    <div>Crew</div>
                                </div>
                                {rightColumnTrips.map((trip) => (
                                    <TripRow 
                                        key={trip.id} 
                                        trip={trip} 
                                        vehicles={vehicleData}
                                        crew={crewData}
                                        onUnassign={handleUnassign}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden z-10">
                        <DigitalGridView trips={tripData} onAction={handleDigitalAction} />
                    </div>
                )}
            </main>

            {/* Resource Sidebar */}
            <aside 
                className={cn(
                    "w-80 bg-background border-l flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out transform",
                    !showSidebar && "translate-x-full w-0 opacity-0 overflow-hidden border-none"
                )}
            >
                <div className="p-3 border-b bg-muted/10">
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Resources
                    </h2>
                </div>

                <Tabs defaultValue="vehicles" className="flex-1 flex flex-col min-h-0">
                    <div className="px-3 pt-3">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="vehicles" className="text-xs">Vehicles</TabsTrigger>
                            <TabsTrigger value="crew" className="text-xs">Crew</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="vehicles" className="flex-1 overflow-hidden flex flex-col mt-2 min-h-0">
                        <ScrollArea className="flex-1">
                            <div className="p-3 space-y-6">
                                {/* Loop through vehicle types */}
                                {Object.entries(vehiclesByType).map(([type, vehiclesList]) => (
                                    <div key={type} className="space-y-2">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                            {type}
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">{vehiclesList.length}</Badge>
                                        </h3>
                                        <div className="space-y-1">
                                            {vehiclesList.map(v => (
                                                <DraggableResource key={v.id} resource={v} type="vehicle" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="crew" className="flex-1 overflow-hidden flex flex-col mt-2 min-h-0">
                         <ScrollArea className="flex-1">
                            <div className="p-3 space-y-6">
                                {/* Reporting Today Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <h3 className="font-bold text-sm">Reporting Today</h3>
                                    </div>

                                    {/* Drivers Reporting */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between pl-2 border-l-2 border-primary/20">
                                            Drivers
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">{driversReporting.length}</Badge>
                                        </h4>
                                        <div className="space-y-1">
                                            {driversReporting.map(c => (
                                                <DraggableResource key={c.id} resource={c} type="driver" compact />
                                            ))}
                                            {driversReporting.length === 0 && (
                                                <div className="text-xs text-muted-foreground italic px-2 py-1">No drivers reporting</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Attendants Reporting */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between pl-2 border-l-2 border-primary/20">
                                            Attendants
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">{attendantsReporting.length}</Badge>
                                        </h4>
                                        <div className="space-y-1">
                                            {attendantsReporting.map(c => (
                                                <DraggableResource key={c.id} resource={c} type="attendant" compact />
                                            ))}
                                            {attendantsReporting.length === 0 && (
                                                <div className="text-xs text-muted-foreground italic px-2 py-1">No attendants reporting</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Available Pool Section */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="font-bold text-sm text-muted-foreground">Available Pool</h3>
                                    </div>

                                    {/* Drivers Pool */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between pl-2 border-l-2 border-muted">
                                            Drivers
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">{driversPool.length}</Badge>
                                        </h4>
                                        <div className="space-y-1">
                                            {driversPool.map(c => (
                                                <DraggableResource key={c.id} resource={c} type="driver" compact />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Attendants Pool */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between pl-2 border-l-2 border-muted">
                                            Attendants
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">{attendantsPool.length}</Badge>
                                        </h4>
                                        <div className="space-y-1">
                                            {attendantsPool.map(c => (
                                                <DraggableResource key={c.id} resource={c} type="attendant" compact />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </aside>
        </div>
        
        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeType === 'vehicle' ? (
             <div className="opacity-90 rotate-3 scale-105 cursor-grabbing">
                <DraggableResource 
                    resource={vehicles.find(v => v.id === activeId) || vehicles[0]} 
                    type="vehicle" 
                />
             </div>
          ) : activeId ? (
            <div className="opacity-90 rotate-3 scale-105 cursor-grabbing">
                <DraggableResource 
                    resource={crew.find(c => c.id === activeId) || crew[0]} 
                    type={activeType || 'driver'} 
                />
             </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Layout>
  );
}

// Helper Components for the Grid Row
const TripRow = ({ trip, vehicles, crew, onUnassign }) => {
    const assignedVehicle = trip.vehicleId ? vehicles.find(v => v.id === trip.vehicleId) : null;
    
    // Calculate pack display
    // e.g. "1 + 32"
    const pack = trip.packId || trip.id.replace('t', '');

    return (
        <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] gap-2 items-stretch border-b border-border/40 min-h-[52px] py-1 group hover:bg-muted/30 transition-colors text-sm relative">
             {/* Pack ID */}
            <div className="flex items-center justify-center font-mono font-bold text-muted-foreground/70 text-lg bg-muted/20 rounded mx-1">
                {pack.split('+')[0].trim().substring(0, 3)}
            </div>

            {/* Trip ID (Input-like) */}
            <div className="flex items-center justify-center">
                <EditableText 
                    value={trip.id.toUpperCase()} 
                    onChange={(val) => console.log('Update trip ID', val)}
                    className="text-center font-mono font-bold text-primary tracking-tight"
                />
            </div>

            {/* Route (Input-like) */}
            <div className="flex items-center justify-center">
                 <EditableText 
                    value={trip.route} 
                    onChange={(val) => console.log('Update trip route', val)}
                    className="text-center text-xs font-medium leading-tight px-1 line-clamp-2"
                />
            </div>

            {/* Time & Dep/Arr */}
            <div className="flex flex-col justify-center pl-4 border-l border-dashed border-border/50">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase w-6">Dep</span>
                    <span className="font-mono font-medium">{format(trip.departureTime, "HH:mm")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase w-6">Arr</span>
                    <span className="font-mono font-medium text-muted-foreground">{format(trip.arrivalTime, "HH:mm")}</span>
                </div>
            </div>

            {/* Vehicle Drop Zone */}
            <div className="relative px-1">
                <DroppableCell id={`resource-slot-${trip.id}-vehicle`} accept={['vehicle']}>
                    {assignedVehicle ? (
                        <div 
                            className="h-full w-full flex items-center justify-center bg-emerald-50/50 border border-emerald-200 rounded hover:bg-red-50/20 hover:border-red-200 cursor-pointer transition-all group/vehicle relative"
                            onContextMenu={(e) => onUnassign(e, trip.id, assignedVehicle.id, 'vehicle')}
                        >
                             <div className="text-center">
                                <div className="font-bold text-emerald-900 text-sm">{assignedVehicle.name}</div>
                                <div className="text-[10px] text-emerald-700/70 font-mono">{assignedVehicle.plate}</div>
                             </div>
                             
                             {/* Remove Overlay */}
                             <div className="absolute inset-0 flex items-center justify-center bg-red-100/80 opacity-0 group-hover/vehicle:opacity-100 transition-opacity rounded backdrop-blur-[1px]">
                                <X className="h-5 w-5 text-red-600" />
                             </div>
                        </div>
                    ) : (
                        <div className="h-full w-full border-2 border-dashed border-border/50 rounded flex items-center justify-center">
                             <Bus className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                    )}
                </DroppableCell>
            </div>

            {/* Crew Drop Zone (Combined Driver/Attendant) */}
            <div className="relative px-1">
                <DroppableCell id={`resource-slot-${trip.id}-driver`} accept={['driver', 'attendant']}>
                     <div className="h-full flex flex-col gap-1 justify-center">
                        {/* Driver Select */}
                        <div className="h-1/2 min-h-[20px]">
                            <MultiResourceSelect 
                                values={trip.driverIds} 
                                options={crew.filter(c => c.role === 'driver')} 
                                onChange={(ids) => console.log('Update drivers', ids)}
                                placeholder="Driver"
                                icon={User}
                                onResourceRightClick={(e, id) => onUnassign(e, trip.id, id, 'driver')}
                            />
                        </div>
                        
                        {/* Separator if needed, or just spacing */}
                        
                        {/* Attendant Select */}
                        <div className="h-1/2 min-h-[20px]">
                             <MultiResourceSelect 
                                values={trip.attendantIds} 
                                options={crew.filter(c => c.role === 'attendant')} 
                                onChange={(ids) => console.log('Update attendants', ids)}
                                placeholder="Attendant"
                                icon={UserPlus}
                                onResourceRightClick={(e, id) => onUnassign(e, trip.id, id, 'attendant')}
                            />
                        </div>
                     </div>
                </DroppableCell>
            </div>
        </div>
    );
};
