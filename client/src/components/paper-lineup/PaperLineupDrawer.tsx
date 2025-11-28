import { format } from "date-fns";
import React from "react";
import {
  Accessibility,
  Bus,
  LayoutGrid,
  MapPin,
  Search,
  Shield,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Crew, Passenger, Stop, Trip, TripLeg, Vehicle } from "@/lib/mockData";

import mapBg from "@assets/generated_images/subtle_topological_map_background.png";
import { getCleanTripId } from "./utils";
import { ResourceType } from "./types";

export type DrawerContent = {
  type: ResourceType;
  id: string;
  legId?: string;
};

interface PaperLineupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: DrawerContent | null;
  trips: Trip[];
  crew: Crew[];
  vehicles: Vehicle[];
  onToggleStop: (tripId: string, stopId: string) => void;
  onAssignStopVehicle: (tripId: string, stopId: string, vehicleId: string) => void;
}

export function PaperLineupDrawer({
  open,
  onOpenChange,
  content,
  trips,
  crew,
  vehicles,
  onToggleStop,
  onAssignStopVehicle,
}: PaperLineupDrawerProps) {
  const renderDrawerContent = () => {
    if (!content) return null;

    if (content.type === "vehicle") {
      const v = vehicles.find((x: Vehicle) => x.id === content.id);
      if (!v) return null;
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Bus className="h-6 w-6 text-primary" />
              {v.name}
            </h2>
            <Badge variant={v.status === "active" ? "default" : "destructive"}>{v.status.toUpperCase()}</Badge>
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
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: `url(${mapBg})`, backgroundSize: "cover" }}
            />
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

    if (content.type === "driver" || content.type === "attendant") {
      const c = crew.find((x: Crew) => x.id === content.id);
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
                {c.role === "driver" ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
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
            <h3 className="text-sm font-bold uppercase text-muted-foreground">Today&apos;s Assignments</h3>
            {trips
              .filter(
                (t) =>
                  (t.driverIds && t.driverIds.includes(c.id)) || (t.attendantIds && t.attendantIds.includes(c.id)),
              )
              .map((t) => (
                <Card key={t.id} className="flex items-center gap-3 p-2 border bg-card shadow-sm">
                  <Badge variant="outline">{t.packId || t.id}</Badge>
                  <span className="text-sm font-medium">{t.route}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{format(t.departureTime, "HH:mm")}</span>
                </Card>
              ))}
            {trips.filter((t) => (t.driverIds && t.driverIds.includes(c.id)) || (t.attendantIds && t.attendantIds.includes(c.id))).length ===
              0 && <p className="text-sm text-muted-foreground italic">No active assignments</p>}
          </div>
        </div>
      );
    }

    if (content.type === "trip") {
      const t = trips.find((x: Trip) => x.id === content.id);
      if (!t) return null;
      const leg = t.legs?.find((l: TripLeg) => l.id === content.legId);

      return (
        <Tabs defaultValue="manifest" className="w-full h-full flex flex-col">
          <div className="mb-6 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {leg ? <Badge className="text-xl px-3 py-1 bg-primary">{leg.id}</Badge> : <Badge className="text-lg px-2 py-1">{t.packId || t.id}</Badge>}

                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      leg?.status === "en-route" && "bg-blue-100 text-blue-700 border-blue-200",
                      leg?.status === "completed" && "bg-gray-100 text-gray-500 border-gray-200",
                      leg?.status === "scheduled" && "bg-emerald-50 text-emerald-600 border-emerald-200",
                    )}
                  >
                    {leg ? leg.status : t.status}
                  </Badge>
                  {t.hasAda && <Accessibility className="h-4 w-4 text-blue-500" />}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{t.route}</h2>
                {leg && <p className="text-sm text-muted-foreground">Leg Details • {leg.direction === "westbound" ? "Westbound" : "Eastbound"}</p>}
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
          </div>

          <TabsContent value="manifest" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-1">
                {t.passengers.map((p: Passenger) => (
                  <div key={p.id} className="p-3 border rounded-lg bg-card flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={p.status === "checked-in"} />
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.confirmationCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="capitalize h-6">
                        {p.type}
                      </Badge>
                      <Badge variant="outline" className="font-mono h-6">
                        Seat {p.seat}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="passengers" className="flex-1 overflow-y-auto mt-0">
            <div className="space-y-2 h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Checked In</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Confirmation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Seat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-y-auto">
                  {t.passengers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Checkbox checked={p.status === "checked-in"} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.name}
                        {p.notes === "ADA" && <Accessibility className="h-3 w-3 inline ml-2 text-blue-500" />}
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
                      <Badge variant="outline" className="font-mono">
                        {idx + 1}
                      </Badge>
                      <span className="font-bold">{stop.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{format(stop.time, "HH:mm")}</span>
                      <Button
                        variant={stop.status === "open" ? "outline" : "destructive"}
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => onToggleStop(t.id, stop.id)}
                      >
                        {stop.status === "open" ? "Open" : "Closed"}
                      </Button>
                    </div>
                  </div>

                  {(t.vehicleId || (t.driverIds && t.driverIds.length > 0)) && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Service By:</span>
                      <div className="flex gap-1">
                        {t.vehicleId && (
                          <Badge
                            variant={stop.assignedVehicleId === t.vehicleId || !stop.assignedVehicleId ? "default" : "outline"}
                            className="cursor-pointer text-[10px] h-5"
                            onClick={() => onAssignStopVehicle(t.id, stop.id, t.vehicleId!)}
                          >
                            {vehicles.find((v) => v.id === t.vehicleId)?.plate.split("-")[1] || "Bus"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="map" className="flex-1 mt-0">
            <Card className="h-full w-full overflow-hidden relative border-none shadow-sm bg-muted/10">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${mapBg})`, backgroundSize: "cover" }} />
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M 40 100 Q 150 50 260 100" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeDasharray="5,5" />
                <circle cx="40" cy="100" r="4" fill="hsl(var(--primary))" />
                <circle cx="260" cy="100" r="4" fill="hsl(var(--primary))" />
              </svg>
              <div className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 rounded text-xs font-bold shadow-sm">Live Traffic: Clear</div>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    if (content.type === "reservations") {
      const trip = trips.find((t) => t.id === content.id);
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
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {trip.reservedCount} / {trip.capacity}
            </Badge>
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
                {trip.passengers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{p.confirmationCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.type}</TableCell>
                    <TableCell className="font-mono">{p.seat || "--"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "confirmed" ? "default" : "secondary"} className="capitalize text-[10px]">
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    if (content.type === "stops") {
      const trip = trips.find((t) => t.id === content.id);
      if (!trip) return null;

      const getTime = (d: Date | string) => new Date(d).getTime();
      const pickups = trip.stops
        .filter((s) => s.type === "pickup" || s.type === "both")
        .sort((a, b) => getTime(a.time) - getTime(b.time));
      const dropoffs = trip.stops.filter((s) => s.type === "dropoff").sort((a, b) => getTime(a.time) - getTime(b.time));

      const renderStopCard = (stop: Stop, accent: string) => (
        <Card key={stop.id} className={`p-4 border-l-4 ${accent}`}>
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
                variant={stop.status === "open" ? "default" : "outline"}
                className={cn("h-7 text-xs", stop.status === "open" ? "bg-emerald-600 hover:bg-emerald-700" : "text-muted-foreground")}
                onClick={() => onToggleStop(trip.id, stop.id)}
              >
                {stop.status === "open" ? "Open" : "Closed"}
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
                onChange={(e) => onAssignStopVehicle(trip.id, stop.id, e.target.value)}
              >
                <option value="">-- Default ({vehicles.find((v) => v.id === trip.vehicleId)?.name || "Unassigned"}) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plate})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      );

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
            {pickups.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Pickups
                </h3>
                {pickups.map((stop) => renderStopCard(stop, "border-l-emerald-500"))}
              </div>
            )}

            {dropoffs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Dropoffs
                </h3>
                {dropoffs.map((stop) => renderStopCard(stop, "border-l-amber-500"))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (content.type === "seats") {
      const trip = trips.find((t) => t.id === content.id);
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
                <div className="col-span-4 border-b pb-4 mb-4 flex justify-between">
                  <div className="h-10 w-10 border rounded bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider self-center">Front</div>
                  <div className="h-10 w-10 border rounded bg-muted/30" />
                </div>

                {Array.from({ length: 10 }).map((_, row) => (
                  <React.Fragment key={row}>
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
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] max-w-[90vw] sm:max-w-[90vw] overflow-hidden flex flex-col p-0 gap-0">
        <div className="p-6 pb-0">
          <SheetHeader className="mb-2">
            <SheetTitle>Dispatch Operations</SheetTitle>
            <SheetDescription>
              Manage details for {content?.type} {content?.legId || content?.id}
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2">{renderDrawerContent()}</div>
      </SheetContent>
    </Sheet>
  );
}
