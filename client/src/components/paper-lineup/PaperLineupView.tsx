import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Crew, Trip, TripLeg, Vehicle } from "@/lib/mockData";
import { DroppableCell } from "./DroppableCell";
import { MultiResourceSelect } from "./MultiResourceSelect";
import { EditableText } from "./EditableText";
import { Bus, Shield, User } from "lucide-react";
import { ResourceType } from "./types";

import mapBg from "@assets/generated_images/subtle_topological_map_background.png";

interface PaperLineupViewProps {
  emptyRows: { left: Trip | null; right: Trip | null }[];
  feederRows: { left: Trip | null; right: Trip | null }[];
  charterRows: { left: Trip | null; right: Trip | null }[];
  feederTripsList: Trip[];
  charterTripsList: Trip[];
  crew: Crew[];
  vehicles: Vehicle[];
  handleUpdateTrip: (tripId: string, field: keyof Trip, value: unknown) => void;
  handleContextMenu: (e: React.MouseEvent, type: ResourceType, id: string, legId?: string) => void;
  handleDrawerAction: (type: ResourceType | "stops" | "reservations", id: string) => void;
}

export function PaperLineupView({
  emptyRows,
  feederRows,
  charterRows,
  feederTripsList,
  charterTripsList,
  crew,
  vehicles,
  handleUpdateTrip,
  handleContextMenu,
  handleDrawerAction,
}: PaperLineupViewProps) {
  return (
    /* Scrollable Grid (Paper View) */
    <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible pb-[500px]">
      <div className="bg-card w-[1400px] min-h-[800px] shadow-xl border border-border/60 rounded-sm relative text-card-foreground font-sans text-sm print:shadow-none print:border-none print:w-full flex flex-col mb-20">
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
                      {row.left.legs.filter((l: TripLeg) => l.direction === "westbound").map((leg: TripLeg) => (
                        <Badge
                          key={leg.id}
                          variant="outline"
                          className={cn(
                            "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrawerAction("trip", row.left!.id);
                          }}
                          onContextMenu={(e) => handleContextMenu(e, "trip", row.left!.id, leg.id)}
                        >
                          {leg.id}
                        </Badge>
                      ))}

                      {/* Separator if both directions exist */}
                      {row.left.legs.some((l: TripLeg) => l.direction === "westbound") &&
                        row.left.legs.some((l: TripLeg) => l.direction === "eastbound") && <span className="text-muted-foreground font-bold mx-0.5 text-[10px]">+</span>}

                      {/* Eastbound Legs */}
                      {row.left.legs.filter((l: TripLeg) => l.direction === "eastbound").map((leg: TripLeg) => (
                        <Badge
                          key={leg.id}
                          variant="outline"
                          className={cn(
                            "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrawerAction("trip", row.left!.id);
                          }}
                          onContextMenu={(e) => handleContextMenu(e, "trip", row.left!.id, leg.id)}
                        >
                          {leg.id}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    row.left && (
                      // Fallback for single leg
                      <EditableText
                        value={row.left.packId || row.left.id.toUpperCase()}
                        onChange={(val) => handleUpdateTrip(row.left!.id, "packId", val)}
                        className="text-sm font-bold text-primary text-center font-mono"
                        onContextMenu={(e) => handleContextMenu(e, "trip", row.left!.id)}
                      />
                    )
                  )}

                  {row.left && row.left.hasAda && <div className="absolute top-1 right-1" />}
                </div>

                {/* Vehicle Droppable */}
                <div className="w-[20%] border-r border-border p-0 relative">
                  {row.left && (
                    <DroppableCell id={`${row.left.id}:vehicleId`} accept={["vehicle"]}>
                      <MultiResourceSelect
                        values={row.left.vehicleId ? [row.left.vehicleId] : []}
                        options={vehicles.map((v) => ({ id: v.id, name: v.plate.split("-")[1] }))}
                        onChange={(ids) => handleUpdateTrip(row.left!.id, "vehicleId", ids[0] || null)}
                        placeholder="Bus"
                        icon={Bus}
                        onResourceRightClick={(e, id, type) => handleContextMenu(e, "vehicle", id)}
                        onResourceClick={(id, type) => handleDrawerAction("vehicle", id)}
                      />
                    </DroppableCell>
                  )}
                </div>

                {/* Crew Droppable */}
                <div className="w-[65%] flex divide-x divide-border/50">
                  <div className="flex-1 relative">
                    {row.left && (
                      <DroppableCell id={`${row.left.id}:driverIds`} accept={["driver"]}>
                        <MultiResourceSelect
                          values={row.left.driverIds || []}
                          options={crew.filter((c) => c.role === "driver")}
                          onChange={(ids) => handleUpdateTrip(row.left!.id, "driverIds", ids)}
                          placeholder="Drivers"
                          icon={User}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "driver", id)}
                          onResourceClick={(id, type) => handleDrawerAction("driver", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    {row.left && (
                      <DroppableCell id={`${row.left.id}:attendantIds`} accept={["attendant"]}>
                        <MultiResourceSelect
                          values={row.left.attendantIds || []}
                          options={crew.filter((c) => c.role === "attendant")}
                          onChange={(ids) => handleUpdateTrip(row.left!.id, "attendantIds", ids)}
                          placeholder="Attendants"
                          icon={Shield}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "attendant", id)}
                          onResourceClick={(id, type) => handleDrawerAction("attendant", id)}
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
                      {row.right.legs.filter((l: TripLeg) => l.direction === "westbound").map((leg: TripLeg) => (
                        <Badge
                          key={leg.id}
                          variant="outline"
                          className={cn(
                            "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrawerAction("trip", row.right!.id);
                          }}
                          onContextMenu={(e) => handleContextMenu(e, "trip", row.right!.id, leg.id)}
                        >
                          {leg.id}
                        </Badge>
                      ))}

                      {/* Separator if both directions exist */}
                      {row.right.legs.some((l: TripLeg) => l.direction === "westbound") &&
                        row.right.legs.some((l: TripLeg) => l.direction === "eastbound") && <span className="text-muted-foreground font-bold mx-0.5 text-[10px]">+</span>}

                      {/* Eastbound Legs */}
                      {row.right.legs.filter((l: TripLeg) => l.direction === "eastbound").map((leg: TripLeg) => (
                        <Badge
                          key={leg.id}
                          variant="outline"
                          className={cn(
                            "cursor-pointer hover:bg-primary/10 transition-colors px-1 py-0 h-5 text-[10px] font-mono border-primary/20 shrink-0 bg-background text-primary",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrawerAction("trip", row.right!.id);
                          }}
                          onContextMenu={(e) => handleContextMenu(e, "trip", row.right!.id, leg.id)}
                        >
                          {leg.id}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    row.right && (
                      // Fallback for single leg
                      <EditableText
                        value={row.right.packId || row.right.id.toUpperCase()}
                        onChange={(val) => handleUpdateTrip(row.right!.id, "packId", val)}
                        className="text-sm font-bold text-primary text-center font-mono"
                        onContextMenu={(e) => handleContextMenu(e, "trip", row.right!.id)}
                      />
                    )
                  )}

                  {row.right && row.right.hasAda && <div className="absolute top-1 right-1" />}
                </div>

                {/* Vehicle Droppable */}
                <div className="w-[20%] border-r border-border p-0 relative">
                  {row.right && (
                    <DroppableCell id={`${row.right.id}:vehicleId`} accept={["vehicle"]}>
                      <MultiResourceSelect
                        values={row.right.vehicleId ? [row.right.vehicleId] : []}
                        options={vehicles.map((v) => ({ id: v.id, name: v.plate.split("-")[1] }))}
                        onChange={(ids) => handleUpdateTrip(row.right!.id, "vehicleId", ids[0] || null)}
                        placeholder="Bus"
                        icon={Bus}
                        onResourceRightClick={(e, id, type) => handleContextMenu(e, "vehicle", id)}
                        onResourceClick={(id, type) => handleDrawerAction("vehicle", id)}
                      />
                    </DroppableCell>
                  )}
                </div>

                {/* Crew Droppable */}
                <div className="w-[65%] flex divide-x divide-border/50">
                  <div className="flex-1 relative">
                    {row.right && (
                      <DroppableCell id={`${row.right.id}:driverIds`} accept={["driver"]}>
                        <MultiResourceSelect
                          values={row.right.driverIds || []}
                          options={crew.filter((c) => c.role === "driver")}
                          onChange={(ids) => handleUpdateTrip(row.right!.id, "driverIds", ids)}
                          placeholder="Drivers"
                          icon={User}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "driver", id)}
                          onResourceClick={(id, type) => handleDrawerAction("driver", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    {row.right && (
                      <DroppableCell id={`${row.right.id}:attendantIds`} accept={["attendant"]}>
                        <MultiResourceSelect
                          values={row.right.attendantIds || []}
                          options={crew.filter((c) => c.role === "attendant")}
                          onChange={(ids) => handleUpdateTrip(row.right!.id, "attendantIds", ids)}
                          placeholder="Attendants"
                          icon={Shield}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "attendant", id)}
                          onResourceClick={(id, type) => handleDrawerAction("attendant", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEEDERS SECTION */}
        <div className="grid grid-cols-2 border-b border-border">
          <div className="border-r border-border">
            <div className="bg-muted/20 border-b border-border px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Feeders (Inbound)
              </div>
              <span className="text-[10px] font-mono">{feederTripsList.length} Total</span>
            </div>

            {feederRows.map((row, idx) => (
              <div key={`F-in-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0">
                <div className="w-[15%] border-r border-border bg-muted/5 flex items-center justify-center px-1 relative overflow-hidden">
                  {row.left ? (
                    <EditableText
                      value={row.left.packId || row.left.id}
                      onChange={(val) => handleUpdateTrip(row.left!.id, "packId", val)}
                      className="text-xs font-bold text-primary text-center font-mono"
                      onContextMenu={(e) => handleContextMenu(e, "trip", row.left!.id)}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                </div>

                <div className="w-[20%] border-r border-border p-0 relative">
                  {row.left && (
                    <DroppableCell id={`${row.left.id}:vehicleId`} accept={["vehicle"]}>
                      <MultiResourceSelect
                        values={row.left.vehicleId ? [row.left.vehicleId] : []}
                        options={vehicles.map((v) => ({ id: v.id, name: v.plate.split("-")[1] }))}
                        onChange={(ids) => handleUpdateTrip(row.left!.id, "vehicleId", ids[0] || null)}
                        placeholder="Bus"
                        icon={Bus}
                        onResourceRightClick={(e, id, type) => handleContextMenu(e, "vehicle", id)}
                        onResourceClick={(id, type) => handleDrawerAction("vehicle", id)}
                      />
                    </DroppableCell>
                  )}
                </div>

                <div className="w-[65%] flex divide-x divide-border/50">
                  <div className="flex-1 relative">
                    {row.left && (
                      <DroppableCell id={`${row.left.id}:driverIds`} accept={["driver"]}>
                        <MultiResourceSelect
                          values={row.left.driverIds || []}
                          options={crew.filter((c) => c.role === "driver")}
                          onChange={(ids) => handleUpdateTrip(row.left!.id, "driverIds", ids)}
                          placeholder="Drivers"
                          icon={User}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "driver", id)}
                          onResourceClick={(id, type) => handleDrawerAction("driver", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    {row.left && (
                      <DroppableCell id={`${row.left.id}:attendantIds`} accept={["attendant"]}>
                        <MultiResourceSelect
                          values={row.left.attendantIds || []}
                          options={crew.filter((c) => c.role === "attendant")}
                          onChange={(ids) => handleUpdateTrip(row.left!.id, "attendantIds", ids)}
                          placeholder="Attendants"
                          icon={Shield}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "attendant", id)}
                          onResourceClick={(id, type) => handleDrawerAction("attendant", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {feederTripsList.length === 0 && <div className="p-4 text-center text-muted-foreground text-xs italic">No inbound feeders scheduled</div>}
          </div>

          <div>
            <div className="bg-muted/20 border-b border-border px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Feeders (Outbound)
              </div>
              <span className="text-[10px] font-mono">{feederTripsList.length} Total</span>
            </div>

            {feederRows.map((row, idx) => (
              <div key={`F-out-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0">
                <div className="w-[15%] border-r border-border bg-muted/5 flex items-center justify-center px-1 relative overflow-hidden">
                  {row.right ? (
                    <EditableText
                      value={row.right.packId || row.right.id}
                      onChange={(val) => handleUpdateTrip(row.right!.id, "packId", val)}
                      className="text-xs font-bold text-primary text-center font-mono"
                      onContextMenu={(e) => handleContextMenu(e, "trip", row.right!.id)}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                </div>

                <div className="w-[20%] border-r border-border p-0 relative">
                  {row.right && (
                    <DroppableCell id={`${row.right.id}:vehicleId`} accept={["vehicle"]}>
                      <MultiResourceSelect
                        values={row.right.vehicleId ? [row.right.vehicleId] : []}
                        options={vehicles.map((v) => ({ id: v.id, name: v.plate.split("-")[1] }))}
                        onChange={(ids) => handleUpdateTrip(row.right!.id, "vehicleId", ids[0] || null)}
                        placeholder="Bus"
                        icon={Bus}
                        onResourceRightClick={(e, id, type) => handleContextMenu(e, "vehicle", id)}
                        onResourceClick={(id, type) => handleDrawerAction("vehicle", id)}
                      />
                    </DroppableCell>
                  )}
                </div>

                <div className="w-[65%] flex divide-x divide-border/50">
                  <div className="flex-1 relative">
                    {row.right && (
                      <DroppableCell id={`${row.right.id}:driverIds`} accept={["driver"]}>
                        <MultiResourceSelect
                          values={row.right.driverIds || []}
                          options={crew.filter((c) => c.role === "driver")}
                          onChange={(ids) => handleUpdateTrip(row.right!.id, "driverIds", ids)}
                          placeholder="Drivers"
                          icon={User}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "driver", id)}
                          onResourceClick={(id, type) => handleDrawerAction("driver", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    {row.right && (
                      <DroppableCell id={`${row.right.id}:attendantIds`} accept={["attendant"]}>
                        <MultiResourceSelect
                          values={row.right.attendantIds || []}
                          options={crew.filter((c) => c.role === "attendant")}
                          onChange={(ids) => handleUpdateTrip(row.right!.id, "attendantIds", ids)}
                          placeholder="Attendants"
                          icon={Shield}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "attendant", id)}
                          onResourceClick={(id, type) => handleDrawerAction("attendant", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {feederTripsList.length === 0 && <div className="p-4 text-center text-muted-foreground text-xs italic">No outbound feeders scheduled</div>}
          </div>
        </div>

        {/* CHARTERS SECTION */}
        <div className="grid grid-cols-2">
          <div className="border-r border-border">
            <div className="bg-muted/20 border-b border-border px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Charters (NYC Pickups)
              </div>
              <span className="text-[10px] font-mono">{charterTripsList.length} Total</span>
            </div>

            {charterRows.map((row, idx) => (
              <div key={`C-in-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0">
                <div className="w-[15%] border-r border-border bg-muted/5 flex items-center justify-center px-1 relative overflow-hidden">
                  {row.left ? (
                    <EditableText
                      value={row.left.packId || row.left.id}
                      onChange={(val) => handleUpdateTrip(row.left!.id, "packId", val)}
                      className="text-xs font-bold text-primary text-center font-mono"
                      onContextMenu={(e) => handleContextMenu(e, "trip", row.left!.id)}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                </div>

                <div className="w-[20%] border-r border-border p-0 relative">
                  {row.left && (
                    <DroppableCell id={`${row.left.id}:vehicleId`} accept={["vehicle"]}>
                      <MultiResourceSelect
                        values={row.left.vehicleId ? [row.left.vehicleId] : []}
                        options={vehicles.map((v) => ({ id: v.id, name: v.plate.split("-")[1] }))}
                        onChange={(ids) => handleUpdateTrip(row.left!.id, "vehicleId", ids[0] || null)}
                        placeholder="Bus"
                        icon={Bus}
                        onResourceRightClick={(e, id, type) => handleContextMenu(e, "vehicle", id)}
                        onResourceClick={(id, type) => handleDrawerAction("vehicle", id)}
                      />
                    </DroppableCell>
                  )}
                </div>

                <div className="w-[65%] flex divide-x divide-border/50">
                  <div className="w-[65%] relative">
                    {row.left && (
                      <DroppableCell id={`${row.left.id}:driverIds`} accept={["driver"]}>
                        <MultiResourceSelect
                          values={row.left.driverIds || []}
                          options={crew.filter((c) => c.role === "driver")}
                          onChange={(ids) => handleUpdateTrip(row.left!.id, "driverIds", ids)}
                          placeholder="Drivers"
                          icon={User}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "driver", id)}
                          onResourceClick={(id, type) => handleDrawerAction("driver", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                  <div className="w-[35%] relative">
                    {row.left && (
                      <DroppableCell id={`${row.left.id}:attendantIds`} accept={["attendant"]}>
                        <MultiResourceSelect
                          values={row.left.attendantIds || []}
                          options={crew.filter((c) => c.role === "attendant")}
                          onChange={(ids) => handleUpdateTrip(row.left!.id, "attendantIds", ids)}
                          placeholder="Attendants"
                          icon={Shield}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "attendant", id)}
                          onResourceClick={(id, type) => handleDrawerAction("attendant", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {charterTripsList.length === 0 && <div className="p-4 text-center text-muted-foreground text-xs italic">No NYC pickups scheduled</div>}
          </div>

          <div>
            <div className="bg-muted/20 border-b border-border px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Charters (East End)
              </div>
              <span className="text-[10px] font-mono">{charterTripsList.length} Total</span>
            </div>

            {charterRows.map((row, idx) => (
              <div key={`C-out-${idx}`} className="flex min-h-[48px] h-[48px] border-b border-border last:border-b-0">
                <div className="w-[15%] border-r border-border bg-muted/5 flex items-center justify-center px-1 relative overflow-hidden">
                  {row.right ? (
                    <EditableText
                      value={row.right.packId || row.right.id}
                      onChange={(val) => handleUpdateTrip(row.right!.id, "packId", val)}
                      className="text-xs font-bold text-primary text-center font-mono"
                      onContextMenu={(e) => handleContextMenu(e, "trip", row.right!.id)}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                </div>

                <div className="w-[20%] border-r border-border p-0 relative">
                  {row.right && (
                    <DroppableCell id={`${row.right.id}:vehicleId`} accept={["vehicle"]}>
                      <MultiResourceSelect
                        values={row.right.vehicleId ? [row.right.vehicleId] : []}
                        options={vehicles.map((v) => ({ id: v.id, name: v.plate.split("-")[1] }))}
                        onChange={(ids) => handleUpdateTrip(row.right!.id, "vehicleId", ids[0] || null)}
                        placeholder="Bus"
                        icon={Bus}
                        onResourceRightClick={(e, id, type) => handleContextMenu(e, "vehicle", id)}
                        onResourceClick={(id, type) => handleDrawerAction("vehicle", id)}
                      />
                    </DroppableCell>
                  )}
                </div>

                <div className="w-[65%] flex divide-x divide-border/50">
                  <div className="w-[65%] relative">
                    {row.right && (
                      <DroppableCell id={`${row.right.id}:driverIds`} accept={["driver"]}>
                        <MultiResourceSelect
                          values={row.right.driverIds || []}
                          options={crew.filter((c) => c.role === "driver")}
                          onChange={(ids) => handleUpdateTrip(row.right!.id, "driverIds", ids)}
                          placeholder="Drivers"
                          icon={User}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "driver", id)}
                          onResourceClick={(id, type) => handleDrawerAction("driver", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                  <div className="w-[35%] relative">
                    {row.right && (
                      <DroppableCell id={`${row.right.id}:attendantIds`} accept={["attendant"]}>
                        <MultiResourceSelect
                          values={row.right.attendantIds || []}
                          options={crew.filter((c) => c.role === "attendant")}
                          onChange={(ids) => handleUpdateTrip(row.right!.id, "attendantIds", ids)}
                          placeholder="Attendants"
                          icon={Shield}
                          onResourceRightClick={(e, id, type) => handleContextMenu(e, "attendant", id)}
                          onResourceClick={(id, type) => handleDrawerAction("attendant", id)}
                        />
                      </DroppableCell>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {charterTripsList.length === 0 && <div className="p-4 text-center text-muted-foreground text-xs italic">No east end charters scheduled</div>}
          </div>
        </div>

        {/* Mini Map */}
        <div className="p-4 border-t border-border bg-muted/10">
          <Card className="h-48 overflow-hidden relative border-none shadow-sm">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${mapBg})`, backgroundSize: "cover" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-primary drop-shadow-md">
                <Bus className="h-8 w-8" />
                <span className="text-xs font-bold bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm">Live Fleet View</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
