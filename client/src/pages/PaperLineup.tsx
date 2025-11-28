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
import { DraggableResource } from "@/components/paper-lineup/DraggableResource";
import { DraggableData, ResourceType } from "@/components/paper-lineup/types";
import { DigitalLineupView } from "@/components/paper-lineup/DigitalLineupView";
import { PaperLineupView } from "@/components/paper-lineup/PaperLineupView";
import { PaperLineupDrawer, DrawerContent } from "@/components/paper-lineup/PaperLineupDrawer";
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