import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { trips, vehicles, crew, Trip, Crew, Vehicle, Stop, feederTrips, charterTrips } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import {
  Printer, Bus, User, Shield, AlertCircle, X,
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
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
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
import { DraggableResource } from "@/components/paper-lineup/DraggableResource";
import { DroppableCell } from "@/components/paper-lineup/DroppableCell";
import { MultiResourceSelect } from "@/components/paper-lineup/MultiResourceSelect";
import { DraggableData, ResourceType } from "@/components/paper-lineup/types";

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

      <div className="flex-1 overflow-auto p-4 pb-32">
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
  const [drawerContent, setDrawerContent] = useState<DrawerContent | null>(null);

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
               <DigitalLineupView trips={localTrips} vehicles={vehicles} onAction={handleDrawerAction} />
            ) : (
               <PaperLineupView
                 emptyRows={emptyRows}
                 feederRows={feederRows}
                 charterRows={charterRows}
                 feederTripsList={feederTripsList}
                 charterTripsList={charterTripsList}
                 crew={crew}
                 vehicles={vehicles}
                 handleUpdateTrip={handleUpdateTrip}
                 handleContextMenu={handleContextMenu}
                 handleDrawerAction={handleDrawerAction}
               />
            )}

          <PaperLineupDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            content={drawerContent}
            trips={localTrips}
            crew={crew}
            vehicles={vehicles}
            onToggleStop={toggleStop}
            onAssignStopVehicle={assignStopVehicle}
          />

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
        </div>
      </DndContext>
      </div>
    </Layout>
  );
}