import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { trips, vehicles, crew, Trip } from "@/lib/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Printer, Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

const PaperSelect = ({ value, options, onChange, placeholder, className, align = "left" }: PaperSelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-full flex items-center cursor-pointer hover:bg-blue-50/30 transition-colors px-1 min-h-[24px]",
            align === "center" && "justify-center",
            align === "right" && "justify-end",
            align === "left" && "justify-start",
            !value && "opacity-50",
            className
          )}
        >
          {value ? (
             <span className="font-handwriting text-blue-800 text-xl leading-none truncate">
               {selected?.name || value}
             </span>
          ) : (
             <span className="font-handwriting text-slate-300 text-lg leading-none opacity-0 hover:opacity-100">
               {placeholder || "Select..."}
             </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 font-sans">
        <Command>
          <CommandInput placeholder={`Search ${placeholder?.toLowerCase() || "..."}`} />
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
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {item.type && <span className="text-[10px] text-muted-foreground">{item.type}</span>}
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

const PaperCell = ({ children, className, noBorderRight }: any) => (
  <div className={cn(
    "border-r border-b border-black px-1 py-0.5 flex items-center overflow-hidden bg-white relative",
    noBorderRight && "border-r-0",
    className
  )}>
    {children}
  </div>
);

const PaperHeader = ({ children, width, className }: any) => (
  <div className={cn(
    "border-r border-b border-black bg-slate-200 text-black font-bold text-xs uppercase text-center py-1 flex items-center justify-center tracking-tight select-none",
    className
  )} style={{ width }}>
    {children}
  </div>
);

export default function PaperLineup() {
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
      <div className="h-full flex flex-col bg-slate-100">
        {/* Toolbar */}
        <div className="bg-white border-b border-border p-4 flex justify-between items-center shadow-sm z-10 print:hidden">
           <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <div className="bg-black text-white p-1 rounded-sm">
               <Printer className="h-5 w-5" />
             </div>
             Lineup Sheet
           </h1>
           <div className="flex gap-2">
             <div className="text-sm text-muted-foreground mr-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-800"></span>
                <span>Click handwritten areas to edit</span>
             </div>
             <Button variant="outline" size="sm" onClick={() => window.print()}>
               Print Sheet
             </Button>
           </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center print:p-0 print:overflow-visible">
          {/* The Paper Sheet */}
          <div className="bg-white w-[1100px] min-h-[800px] shadow-2xl border border-slate-300 relative text-black font-sans text-sm print:shadow-none print:border-none print:w-full">
            
            {/* Paper Header */}
            <div className="border-b-2 border-black p-2 flex justify-between items-end h-24">
               <div className="border-2 border-black p-2 w-32 text-center transform -rotate-1">
                  <div className="text-[10px] uppercase tracking-widest mb-4 border-b border-black/50">Day</div>
                  <div className="font-handwriting text-3xl text-blue-900 font-bold">Monday</div>
               </div>

               <div className="text-center flex-1">
                 <h1 className="text-3xl font-black uppercase tracking-widest scale-y-110 mb-2">Vehicle & Crew Assignments</h1>
                 <div className="flex justify-center gap-8 text-sm font-bold uppercase">
                    <div className="flex gap-2 items-end">
                       <span>Date:</span>
                       <span className="font-handwriting text-blue-900 text-xl border-b border-dotted border-black w-32 text-center">Nov 24, 2025</span>
                    </div>
                    <div className="flex gap-2 items-end">
                       <span>Weather:</span>
                       <span className="font-handwriting text-blue-900 text-xl border-b border-dotted border-black w-32 text-center">Sunny 65°</span>
                    </div>
                 </div>
               </div>

               <div className="w-32 border border-black h-full p-1 text-[10px]">
                  <div className="border-b border-black mb-1">RESERVED:</div>
                  <div className="border-b border-black mb-1">O.O.S:</div>
               </div>
            </div>

            {/* Main Grid Container */}
            <div className="flex border-b-2 border-black">
               {/* Left Column Group */}
               <div className="flex-1 border-r-2 border-black">
                  <div className="flex border-b-2 border-black h-8">
                     <PaperHeader width="15%">Trip</PaperHeader>
                     <PaperHeader width="15%">Vehicle</PaperHeader>
                     <PaperHeader width="70%" className="border-r-0">Crew</PaperHeader>
                  </div>
                  {emptyRows.map((row, idx) => (
                     <div key={`L-${idx}`} className="flex h-10 border-b border-black last:border-b-0 group">
                        <PaperCell className="w-[15%] font-bold text-center bg-slate-50 text-xs group-hover:bg-blue-50/10 transition-colors">
                           {row.left ? row.left.packId || row.left.id.toUpperCase() : ""}
                        </PaperCell>
                        
                        <PaperCell className="w-[15%] text-center font-bold bg-slate-50 group-hover:bg-blue-50/10 transition-colors">
                           {row.left && (
                             <PaperSelect 
                               value={row.left.vehicleId}
                               options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1], type: v.type }))}
                               onChange={(val) => handleAssign(row.left!.id, 'vehicleId', val)}
                               align="center"
                               placeholder="#"
                             />
                           )}
                        </PaperCell>
                        
                        <PaperCell className="w-[70%] border-r-0 relative group-hover:bg-blue-50/10 transition-colors" noBorderRight>
                           {row.left && (
                             <div className="flex w-full items-center">
                               <div className="flex-1">
                                 <PaperSelect 
                                   value={row.left.driverId}
                                   options={crew.filter(c => c.role === 'driver')}
                                   onChange={(val) => handleAssign(row.left!.id, 'driverId', val)}
                                   placeholder="Driver"
                                 />
                               </div>
                               <div className="text-black/20 mx-1 select-none">/</div>
                               <div className="flex-1">
                                 <PaperSelect 
                                   value={row.left.attendantId}
                                   options={crew.filter(c => c.role === 'attendant')}
                                   onChange={(val) => handleAssign(row.left!.id, 'attendantId', val)}
                                   placeholder="Attendant"
                                 />
                               </div>
                             </div>
                           )}
                        </PaperCell>
                     </div>
                  ))}
               </div>

               {/* Right Column Group */}
               <div className="flex-1">
                  <div className="flex border-b-2 border-black h-8">
                     <PaperHeader width="15%">Trip</PaperHeader>
                     <PaperHeader width="15%">Vehicle</PaperHeader>
                     <PaperHeader width="70%" className="border-r-0">Crew</PaperHeader>
                  </div>
                  {emptyRows.map((row, idx) => (
                     <div key={`R-${idx}`} className="flex h-10 border-b border-black last:border-b-0 group">
                        <PaperCell className="w-[15%] font-bold text-center bg-slate-50 text-xs group-hover:bg-blue-50/10 transition-colors">
                           {row.right ? row.right.packId || row.right.id.toUpperCase() : ""}
                        </PaperCell>
                        
                        <PaperCell className="w-[15%] text-center font-bold bg-slate-50 group-hover:bg-blue-50/10 transition-colors">
                           {row.right && (
                             <PaperSelect 
                               value={row.right.vehicleId}
                               options={vehicles.map(v => ({ id: v.id, name: v.plate.split('-')[1], type: v.type }))}
                               onChange={(val) => handleAssign(row.right!.id, 'vehicleId', val)}
                               align="center"
                               placeholder="#"
                             />
                           )}
                        </PaperCell>
                        
                        <PaperCell className="w-[70%] border-r-0 relative group-hover:bg-blue-50/10 transition-colors" noBorderRight>
                           {row.right && (
                             <div className="flex w-full items-center">
                               <div className="flex-1">
                                 <PaperSelect 
                                   value={row.right.driverId}
                                   options={crew.filter(c => c.role === 'driver')}
                                   onChange={(val) => handleAssign(row.right!.id, 'driverId', val)}
                                   placeholder="Driver"
                                 />
                               </div>
                               <div className="text-black/20 mx-1 select-none">/</div>
                               <div className="flex-1">
                                 <PaperSelect 
                                   value={row.right.attendantId}
                                   options={crew.filter(c => c.role === 'attendant')}
                                   onChange={(val) => handleAssign(row.right!.id, 'attendantId', val)}
                                   placeholder="Attendant"
                                 />
                               </div>
                             </div>
                           )}
                        </PaperCell>
                     </div>
                  ))}
               </div>
            </div>

            {/* Footer Sections */}
            <div className="flex h-64">
               {/* S.C.T Feeder Service */}
               <div className="w-1/3 border-r-2 border-black p-0 flex flex-col">
                  <div className="bg-slate-200 border-b border-black font-bold text-center py-1 uppercase text-xs border-r-0">
                     S.C.T Feeder Service
                  </div>
                  <div className="flex-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex h-8 border-b border-black">
                        <div className="w-16 border-r border-black bg-slate-50"></div>
                        <div className="flex-1"></div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Charters & Tours */}
               <div className="w-2/3 flex flex-col">
                  <div className="bg-slate-200 border-b border-black font-bold text-center py-1 uppercase text-xs">
                     Charters & Tours
                  </div>
                   <div className="flex border-b border-black bg-slate-100 text-[10px] font-bold h-6 items-center">
                     <div className="w-24 border-r border-black text-center">Trip</div>
                     <div className="w-24 border-r border-black text-center">Vehicle</div>
                     <div className="flex-1 text-center">Details</div>
                  </div>
                  {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex h-8 border-b border-black">
                        <div className="w-24 border-r border-black bg-slate-50 flex items-center justify-center text-xs font-bold">
                           {i === 1 ? "STRATTON" : ""}
                        </div>
                        <div className="w-24 border-r border-black bg-slate-50"></div>
                        <div className="flex-1 font-handwriting text-blue-800 text-lg pl-2 pt-1">
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
