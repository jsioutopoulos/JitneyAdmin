import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { trips, vehicles, crew, Trip } from "@/lib/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Printer, Check, ChevronsUpDown, Search, Bus, User, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// --- Components ---

interface PaperSelectProps {
  value: string | null;
  options: { id: string; name: string; type?: string; status?: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "center" | "right";
  icon?: any;
}

const PaperSelect = ({ value, options, onChange, placeholder, className, align = "left", icon: Icon }: PaperSelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-full flex items-center cursor-pointer hover:bg-muted/50 transition-colors px-2 min-h-[32px] rounded-sm group",
            align === "center" && "justify-center",
            align === "right" && "justify-end",
            align === "left" && "justify-start",
            !value && "opacity-60",
            className
          )}
        >
          {value ? (
             <div className="flex items-center gap-2 truncate w-full">
               {Icon && <Icon className="h-3.5 w-3.5 text-primary/70" />}
               <span className="font-medium text-sm text-foreground truncate">
                 {selected?.name || value}
               </span>
               {selected?.status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-auto" />}
               {selected?.status === 'maintenance' && <AlertCircle className="h-3.5 w-3.5 text-destructive ml-auto" />}
             </div>
          ) : (
             <span className="text-sm text-muted-foreground/70 font-medium flex items-center gap-2 truncate">
               {Icon && <Icon className="h-3.5 w-3.5 opacity-50" />}
               {placeholder || "Select..."}
             </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 font-sans shadow-lg border-border">
        <Command>
          <CommandInput placeholder={`Search ${placeholder?.toLowerCase() || "..."}`} className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.type && <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal text-muted-foreground">{item.type}</Badge>}
                      {item.status && item.status !== 'active' && item.status !== 'available' && (
                        <span className="text-[10px] text-destructive font-medium uppercase">{item.status}</span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const HybridCell = ({ children, className, noBorderRight }: any) => (
  <div className={cn(
    "border-r border-b border-border px-1 py-1 flex items-center overflow-hidden bg-card relative transition-colors hover:bg-muted/30",
    noBorderRight && "border-r-0",
    className
  )}>
    {children}
  </div>
);

const HybridHeader = ({ children, width, className }: any) => (
  <div className={cn(
    "border-r border-b border-border bg-muted/50 text-muted-foreground font-semibold text-xs uppercase text-center py-2 flex items-center justify-center tracking-wider select-none",
    className
  )} style={{ width }}>
    {children}
  </div>
);

export default function HybridLineup() {
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);

  const handleAssign = (tripId: string, field: keyof Trip, value: string) => {
    setLocalTrips(prev => prev.map(t => 
      t.id === tripId ? { ...t, [field]: value } : t
    ));
  };

  // Split trips into Left and Right columns
  const leftColTrips = localTrips.filter((_, i) => i % 2 === 0);
  const rightColTrips = localTrips.filter((_, i) => i % 2 !== 0);

  const maxRows = Math.max(leftColTrips.length, rightColTrips.length, 20);
  const emptyRows = Array.from({ length: maxRows }).map((_, i) => ({
    left: leftColTrips[i] || null,
    right: rightColTrips[i] || null
  }));

  return (
    <Layout>
      <div className="h-full flex flex-col bg-muted/10">
        {/* Toolbar */}
        <div className="bg-card border-b border-border p-4 flex justify-between items-center shadow-sm z-10 print:hidden">
           <div className="flex items-center gap-3">
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
             <Button size="sm">Save Changes</Button>
           </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
          {/* The "Paper" Sheet - Now Digitized */}
          <div className="bg-card w-[1200px] min-h-[800px] shadow-xl border border-border/60 rounded-sm relative text-card-foreground font-sans text-sm print:shadow-none print:border-none print:w-full overflow-hidden">
            
            {/* Header Section */}
            <div className="border-b border-border p-6 flex justify-between items-start bg-muted/5">
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

            {/* Main Grid Container */}
            <div className="flex border-b border-border bg-card">
               {/* Left Column Group */}
               <div className="flex-1 border-r border-border">
                  <div className="flex border-b border-border h-9 bg-muted/30">
                     <HybridHeader width="15%">Trip</HybridHeader>
                     <HybridHeader width="20%">Vehicle</HybridHeader>
                     <HybridHeader width="65%" className="border-r-0">Crew Assignment</HybridHeader>
                  </div>
                  {emptyRows.map((row, idx) => (
                     <div key={`L-${idx}`} className="flex h-12 border-b border-border last:border-b-0 group hover:bg-muted/20 transition-colors">
                        <HybridCell className="w-[15%] justify-center bg-muted/5 group-hover:bg-muted/10">
                           {row.left && (
                             <div className="flex flex-col items-center">
                               <span className="font-bold text-xs text-primary">{row.left.packId || row.left.id.toUpperCase()}</span>
                               <span className="text-[10px] text-muted-foreground">{format(row.left.departureTime, "HH:mm")}</span>
                             </div>
                           )}
                        </HybridCell>
                        
                        <HybridCell className="w-[20%] justify-center p-0">
                           {row.left && (
                             <PaperSelect 
                               value={row.left.vehicleId}
                               options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1], type: v.type, status: v.status }))}
                               onChange={(val) => handleAssign(row.left!.id, 'vehicleId', val)}
                               align="center"
                               placeholder="Select Bus"
                               icon={Bus}
                             />
                           )}
                        </HybridCell>
                        
                        <HybridCell className="w-[65%] border-r-0 p-0" noBorderRight>
                           {row.left && (
                             <div className="flex w-full h-full items-center divide-x divide-border/50">
                               <div className="flex-1 h-full p-1">
                                 <PaperSelect 
                                   value={row.left.driverId}
                                   options={crew.filter(c => c.role === 'driver')}
                                   onChange={(val) => handleAssign(row.left!.id, 'driverId', val)}
                                   placeholder="Assign Driver"
                                   icon={User}
                                 />
                               </div>
                               <div className="flex-1 h-full p-1">
                                 <PaperSelect 
                                   value={row.left.attendantId}
                                   options={crew.filter(c => c.role === 'attendant')}
                                   onChange={(val) => handleAssign(row.left!.id, 'attendantId', val)}
                                   placeholder="Assign Attendant"
                                   icon={Shield}
                                 />
                               </div>
                             </div>
                           )}
                        </HybridCell>
                     </div>
                  ))}
               </div>

               {/* Right Column Group */}
               <div className="flex-1">
                  <div className="flex border-b border-border h-9 bg-muted/30">
                     <HybridHeader width="15%">Trip</HybridHeader>
                     <HybridHeader width="20%">Vehicle</HybridHeader>
                     <HybridHeader width="65%" className="border-r-0">Crew Assignment</HybridHeader>
                  </div>
                  {emptyRows.map((row, idx) => (
                     <div key={`R-${idx}`} className="flex h-12 border-b border-border last:border-b-0 group hover:bg-muted/20 transition-colors">
                        <HybridCell className="w-[15%] justify-center bg-muted/5 group-hover:bg-muted/10">
                           {row.right && (
                             <div className="flex flex-col items-center">
                               <span className="font-bold text-xs text-primary">{row.right.packId || row.right.id.toUpperCase()}</span>
                               <span className="text-[10px] text-muted-foreground">{format(row.right.departureTime, "HH:mm")}</span>
                             </div>
                           )}
                        </HybridCell>
                        
                        <HybridCell className="w-[20%] justify-center p-0">
                           {row.right && (
                             <PaperSelect 
                               value={row.right.vehicleId}
                               options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1], type: v.type, status: v.status }))}
                               onChange={(val) => handleAssign(row.right!.id, 'vehicleId', val)}
                               align="center"
                               placeholder="Select Bus"
                               icon={Bus}
                             />
                           )}
                        </HybridCell>
                        
                        <HybridCell className="w-[65%] border-r-0 p-0" noBorderRight>
                           {row.right && (
                             <div className="flex w-full h-full items-center divide-x divide-border/50">
                               <div className="flex-1 h-full p-1">
                                 <PaperSelect 
                                   value={row.right.driverId}
                                   options={crew.filter(c => c.role === 'driver')}
                                   onChange={(val) => handleAssign(row.right!.id, 'driverId', val)}
                                   placeholder="Assign Driver"
                                   icon={User}
                                 />
                               </div>
                               <div className="flex-1 h-full p-1">
                                 <PaperSelect 
                                   value={row.right.attendantId}
                                   options={crew.filter(c => c.role === 'attendant')}
                                   onChange={(val) => handleAssign(row.right!.id, 'attendantId', val)}
                                   placeholder="Assign Attendant"
                                   icon={Shield}
                                 />
                               </div>
                             </div>
                           )}
                        </HybridCell>
                     </div>
                  ))}
               </div>
            </div>

            {/* Footer Sections */}
            <div className="flex h-64 bg-muted/5">
               {/* S.C.T Feeder Service */}
               <div className="w-1/3 border-r border-border p-0 flex flex-col">
                  <div className="bg-muted/50 border-b border-border font-bold text-center py-2 uppercase text-xs tracking-wider text-muted-foreground">
                     S.C.T Feeder Service
                  </div>
                  <div className="flex-1 bg-card">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex h-10 border-b border-border">
                        <div className="w-16 border-r border-border bg-muted/10"></div>
                        <div className="flex-1"></div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Charters & Tours */}
               <div className="w-2/3 flex flex-col">
                  <div className="bg-muted/50 border-b border-border font-bold text-center py-2 uppercase text-xs tracking-wider text-muted-foreground">
                     Charters & Tours
                  </div>
                   <div className="flex border-b border-border bg-muted/30 text-[10px] font-semibold uppercase text-muted-foreground h-8 items-center">
                     <div className="w-24 border-r border-border text-center">Trip</div>
                     <div className="w-24 border-r border-border text-center">Vehicle</div>
                     <div className="flex-1 pl-4">Details</div>
                  </div>
                  {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex h-10 border-b border-border bg-card">
                        <div className="w-24 border-r border-border bg-muted/5 flex items-center justify-center text-xs font-bold text-primary">
                           {i === 1 ? "STRATTON" : ""}
                        </div>
                        <div className="w-24 border-r border-border bg-muted/5"></div>
                        <div className="flex-1 flex items-center pl-4 text-sm font-medium">
                           {i === 1 ? "JITNEY - HOWARD" : ""}
                        </div>
                      </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
