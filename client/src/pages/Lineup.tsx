import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { trips, vehicles, crew, Trip } from "@/lib/mockData";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Bus, Check, Clock, Info, Layers, MoreHorizontal, UserPlus, Users } from "lucide-react";

export default function Lineup() {
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);

  const handleAssign = (tripId: string, field: keyof Trip, value: string) => {
    setLocalTrips(prev => prev.map(t => 
      t.id === tripId ? { ...t, [field]: value } : t
    ));
  };

  return (
    <Layout>
      <Header title="Daily Lineup" />
      <div className="flex-1 overflow-hidden flex flex-col bg-muted/5">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <Layers className="mr-2 h-3.5 w-3.5" /> Group by Pack
            </Button>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <Clock className="mr-2 h-3.5 w-3.5" /> Time Range
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-2">Legend:</span>
             <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0.5 h-5">Assigned</Badge>
             <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0.5 h-5">Unassigned</Badge>
             <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-2 py-0.5 h-5">Maintenance</Badge>
          </div>
        </div>

        {/* Main Lineup Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-[100px] font-heading font-bold text-foreground">Time</TableHead>
                  <TableHead className="min-w-[200px] font-heading font-bold text-foreground">Route & Pack</TableHead>
                  <TableHead className="w-[180px] font-heading font-bold text-foreground">Vehicle</TableHead>
                  <TableHead className="w-[180px] font-heading font-bold text-foreground">Driver</TableHead>
                  <TableHead className="w-[180px] font-heading font-bold text-foreground">Attendant</TableHead>
                  <TableHead className="w-[120px] font-heading font-bold text-foreground">Load</TableHead>
                  <TableHead className="w-[100px] font-heading font-bold text-foreground">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localTrips.map((trip) => (
                  <LineupRow 
                    key={trip.id} 
                    trip={trip} 
                    onAssign={handleAssign} 
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function LineupRow({ trip, onAssign }: { trip: Trip, onAssign: (id: string, field: any, value: string) => void }) {
  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
  const driver = crew.find(c => c.id === trip.driverId);
  const attendant = crew.find(c => c.id === trip.attendantId);
  
  const isUnassigned = !trip.vehicleId || !trip.driverId;
  
  return (
    <TableRow className={cn(
      "group transition-colors hover:bg-muted/20",
      isUnassigned ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
    )}>
      {/* Time Column */}
      <TableCell className="align-top py-4">
        <div className="flex flex-col">
          <span className="font-bold text-lg tabular-nums leading-none text-foreground">
            {format(trip.departureTime, "HH:mm")}
          </span>
          <span className="text-xs text-muted-foreground mt-1 font-medium">
            {format(trip.arrivalTime, "HH:mm")} Arr
          </span>
        </div>
      </TableCell>

      {/* Route Column */}
      <TableCell className="align-top py-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 bg-muted/50 text-muted-foreground border-border">
              {trip.id.toUpperCase()}
            </Badge>
            {trip.packId && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                {trip.packId}
              </Badge>
            )}
          </div>
          <div className="font-medium text-sm flex items-center gap-1.5">
            {trip.direction === "westbound" ? (
              <ArrowRight className="h-3.5 w-3.5 text-indigo-500 rotate-180" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {trip.route}
          </div>
          {trip.notes && (
             <div className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 w-fit px-1.5 py-0.5 rounded">
               <Info className="h-3 w-3" /> {trip.notes}
             </div>
          )}
        </div>
      </TableCell>

      {/* Vehicle Selector */}
      <TableCell className="align-top py-3">
        <ResourceSelect 
          value={trip.vehicleId} 
          options={vehicles}
          placeholder="Select Bus..."
          icon={Bus}
          onChange={(val: string) => onAssign(trip.id, 'vehicleId', val)}
          type="vehicle"
        />
      </TableCell>

      {/* Driver Selector */}
      <TableCell className="align-top py-3">
        <ResourceSelect 
          value={trip.driverId} 
          options={crew.filter(c => c.role === 'driver')}
          placeholder="Select Driver..."
          icon={UserPlus}
          onChange={(val: string) => onAssign(trip.id, 'driverId', val)}
          type="crew"
        />
      </TableCell>

      {/* Attendant Selector */}
      <TableCell className="align-top py-3">
         <ResourceSelect 
          value={trip.attendantId} 
          options={crew.filter(c => c.role === 'attendant')}
          placeholder="Select Attendant..."
          icon={Users}
          onChange={(val: string) => onAssign(trip.id, 'attendantId', val)}
          type="crew"
        />
      </TableCell>

      {/* Passenger Load */}
      <TableCell className="align-top py-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs mb-1">
             <span className="font-medium text-muted-foreground">{trip.passengerCount} Pax</span>
             {vehicle && <span className="text-muted-foreground/60">/ {vehicle.capacity}</span>}
          </div>
          <Progress 
            value={(trip.passengerCount / (vehicle?.capacity || 50)) * 100} 
            className={cn("h-2", 
              trip.passengerCount > 40 ? "[&>*]:bg-amber-500 bg-amber-100" : "[&>*]:bg-primary bg-secondary"
            )}
          />
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="align-top py-4">
        <StatusBadge status={trip.status} />
      </TableCell>
      
      <TableCell className="align-top py-4 text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Helper Components

function ResourceSelect({ value, options, placeholder, icon: Icon, onChange, type }: any) {
  const selected = options.find((o: any) => o.id === value);
  
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className={cn(
        "w-full h-9 text-xs font-medium transition-all border-input bg-background hover:border-primary/50 focus:ring-1 focus:ring-primary/20",
        !value && "text-muted-foreground border-dashed bg-muted/20 hover:bg-muted/30",
        value && "border-solid bg-card shadow-sm"
      )}>
        <div className="flex items-center gap-2 truncate">
          <Icon className={cn("h-3.5 w-3.5 shrink-0", value ? "text-primary" : "text-muted-foreground")} />
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt: any) => (
          <SelectItem key={opt.id} value={opt.id} className="text-xs">
             <div className="flex items-center justify-between w-full gap-4">
               <span>{opt.name}</span>
               {type === 'vehicle' && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">{opt.type}</Badge>
               )}
               {opt.status !== 'available' && opt.status !== 'active' && (
                  <span className="text-[10px] text-destructive font-medium uppercase">{opt.status}</span>
               )}
             </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-slate-100 text-slate-600 border-slate-200",
    boarding: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
    "en-route": "bg-green-50 text-green-700 border-green-200",
    completed: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 h-6 border", styles[status] || styles.scheduled)}>
      {status}
    </Badge>
  );
}
