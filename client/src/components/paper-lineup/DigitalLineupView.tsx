import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  BadgeCheck,
  LayoutGrid,
  List,
  Search,
  Shield,
  Table as TableIcon,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Trip, Vehicle } from "@/lib/mockData";
import { getCleanTripId } from "./utils";
import { ResourceType } from "./types";

interface DigitalLineupViewProps {
  trips: Trip[];
  vehicles: Vehicle[];
  onAction: (type: ResourceType, id: string) => void;
}

const getDisplayStatus = (status: string) => {
  if (status === "cancelled") return "Cancelled";
  if (status === "completed") return "Closed";
  return "Open";
};

export function DigitalLineupView({ trips, vehicles, onAction }: DigitalLineupViewProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const flattenedTrips = useMemo(() => {
    return trips.flatMap((t) => {
      if (t.legs && t.legs.length > 0) {
        return t.legs.map((l) => ({
          id: getCleanTripId(l.id) || l.id,
          rawId: l.id,
          status: l.status,
          direction: l.direction,
          parent: t,
        }));
      }
      return [
        {
          id: getCleanTripId(t.packId || t.id) || t.id,
          rawId: t.packId || t.id,
          status: t.status,
          direction: t.direction,
          parent: t,
        },
      ];
    });
  }, [trips]);

  const filteredItems = flattenedTrips.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(filter.toLowerCase()) ||
      item.parent.route.toLowerCase().includes(filter.toLowerCase()) ||
      item.rawId.toLowerCase().includes(filter.toLowerCase());

    const matchesStatus = statusFilter === "all" || getDisplayStatus(item.status).toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getLineBrand = (trip: Trip, vehicleId: string | null) => {
    let brand = "Jitney";
    let brandColor = "bg-emerald-100 text-emerald-800 border-emerald-200";

    let line = "Montauk";
    let lineColor = "bg-emerald-100 text-emerald-800 border-emerald-200";

    const r = trip.route.toLowerCase();

    if (vehicleId) {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (vehicle && vehicle.type === "Ambassador") {
        brand = "Ambassador";
        brandColor = "bg-blue-100 text-blue-800 border-blue-200";
        line = "Ambassador";
        lineColor = "bg-blue-100 text-blue-800 border-blue-200";
      }
    } else if (r.includes("ambassador")) {
      brand = "Ambassador";
      brandColor = "bg-blue-100 text-blue-800 border-blue-200";
      line = "Ambassador";
      lineColor = "bg-blue-100 text-blue-800 border-blue-200";
    }

    if (brand !== "Ambassador") {
      if (r.includes("westhampton")) {
        line = "Westhampton";
        lineColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
      } else if (r.includes("north fork") || r.includes("greenport")) {
        line = "North Fork";
        lineColor = "bg-purple-100 text-purple-800 border-purple-200";
      }
    }

    return { brand, brandColor, line, lineColor };
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-muted/10">
      <div className="bg-background border-b p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search trips..." className="pl-8 h-9" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            {["all", "open", "closed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all",
                  statusFilter === status ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            {["grid", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as "grid" | "list")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all flex items-center gap-2",
                  view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <TableIcon className="h-3.5 w-3.5" />}
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            Compliance
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            Safety
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {view === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => {
              const { brand, brandColor, line, lineColor } = getLineBrand(item.parent, item.parent.vehicleId || null);
              return (
                <div key={`${item.parent.id}-${item.id}`} className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-3 flex items-center justify-between gap-2 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs font-mono px-2 py-0.5 border-primary/30", brandColor)}>
                        {brand}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 border-primary/20", lineColor)}>
                        {line}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-2 py-1 capitalize">
                        {getDisplayStatus(item.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.parent.departureTime ? format(item.parent.departureTime, "HH:mm") : "--"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-mono">
                          {item.id}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {item.direction || "--"}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.parent.packId || item.parent.id}
                      </Badge>
                    </div>

                    <div>
                      <p className="font-semibold leading-tight">{item.parent.route}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.parent.direction || "scheduled"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-semibold text-foreground">{item.parent.reservedCount}</span>
                        <span>/ {item.parent.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="capitalize">{item.parent.status || "on time"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between border-t bg-muted/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {item.parent.vehicleId ? vehicles.find((v) => v.id === item.parent.vehicleId)?.plate.split("-")[1] : "Unassigned"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {item.parent.driverIds?.length ? `${item.parent.driverIds.length} Drivers` : "No Driver"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {item.parent.attendantIds?.length ? `${item.parent.attendantIds.length} Attendants` : "No Attendant"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onAction("trip", item.parent.id)}>
                        Manifest
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onAction("stops", item.parent.id)}>
                        Stops
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Trip</TableHead>
                  <TableHead className="font-semibold">Route</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold">Capacity</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={`${item.parent.id}-${item.id}`} className="group">
                    <TableCell className="font-mono font-semibold">{item.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[240px]">{item.parent.route}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase">{item.direction}</span>
                          {item.parent.hasAda && <Shield className="h-3 w-3 text-blue-500" />}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.parent.departureTime ? format(item.parent.departureTime, "HH:mm") : "--"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {item.parent.reservedCount}/{item.parent.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onAction("trip", item.parent.id)}>
                          Manifest
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onAction("stops", item.parent.id)}>
                          Stops
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
