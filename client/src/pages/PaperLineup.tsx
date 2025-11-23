import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { trips, vehicles, crew, Trip } from "@/lib/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom "Paper" components to match the aesthetic
const PaperInput = ({ value, onChange, className }: any) => (
  <input 
    type="text" 
    value={value || ""} 
    onChange={e => onChange?.(e.target.value)}
    className={cn(
      "w-full bg-transparent border-none p-1 h-full text-blue-800 font-handwriting text-lg focus:ring-0 focus:bg-blue-50/50 placeholder:text-slate-300",
      className
    )}
    placeholder=""
  />
);

const PaperCell = ({ children, className, noBorderRight }: any) => (
  <div className={cn(
    "border-r border-b border-black px-1 py-0.5 flex items-center overflow-hidden bg-white",
    noBorderRight && "border-r-0",
    className
  )}>
    {children}
  </div>
);

const PaperHeader = ({ children, width, className }: any) => (
  <div className={cn(
    "border-r border-b border-black bg-slate-200 text-black font-bold text-xs uppercase text-center py-1 flex items-center justify-center tracking-tight",
    className
  )} style={{ width }}>
    {children}
  </div>
);

export default function PaperLineup() {
  const [localTrips, setLocalTrips] = useState<Trip[]>(trips);

  // Split trips into Left and Right columns (e.g., Westbound vs Eastbound for demo)
  const leftColTrips = localTrips.filter((_, i) => i % 2 === 0); // Simulating the split
  const rightColTrips = localTrips.filter((_, i) => i % 2 !== 0);

  // Fill empty rows to make it look like a full sheet
  const maxRows = Math.max(leftColTrips.length, rightColTrips.length, 20);
  const emptyRows = Array.from({ length: maxRows }).map((_, i) => ({
    left: leftColTrips[i] || null,
    right: rightColTrips[i] || null
  }));

  return (
    <Layout>
      <div className="h-full flex flex-col bg-slate-100">
        <div className="bg-white border-b border-border p-4 flex justify-between items-center shadow-sm z-10">
           <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Printer className="h-5 w-5" /> Digital Paper View
           </h1>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => window.print()}>Print Sheet</Button>
           </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center">
          {/* The Paper Sheet */}
          <div className="bg-white w-[1100px] min-h-[800px] shadow-2xl border border-slate-300 relative text-black font-sans text-sm">
            
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
                     <div key={`L-${idx}`} className="flex h-10 border-b border-black last:border-b-0 hover:bg-blue-50/20">
                        <PaperCell className="w-[15%] font-bold text-center bg-slate-50">
                           {row.left ? row.left.packId || row.left.id.toUpperCase() : ""}
                        </PaperCell>
                        <PaperCell className="w-[15%] text-center font-bold bg-slate-50">
                           {row.left?.vehicleId ? vehicles.find(v => v.id === row.left?.vehicleId)?.plate.split('-')[1] : ""}
                        </PaperCell>
                        <PaperCell className="w-[70%] border-r-0 relative" noBorderRight>
                           {/* Handwritten Crew Names */}
                           {row.left && (
                             <div className="font-handwriting text-blue-800 text-xl leading-none pl-2">
                                {row.left.driverId ? crew.find(c => c.id === row.left?.driverId)?.name.toUpperCase() : ""}
                                {row.left.attendantId && (
                                  <span className="mx-2 text-black/30">/</span>
                                )}
                                {row.left.attendantId ? crew.find(c => c.id === row.left?.attendantId)?.name.toUpperCase() : ""}
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
                     <div key={`R-${idx}`} className="flex h-10 border-b border-black last:border-b-0 hover:bg-blue-50/20">
                        <PaperCell className="w-[15%] font-bold text-center bg-slate-50">
                           {row.right ? row.right.packId || row.right.id.toUpperCase() : ""}
                        </PaperCell>
                        <PaperCell className="w-[15%] text-center font-bold bg-slate-50">
                           {row.right?.vehicleId ? vehicles.find(v => v.id === row.right?.vehicleId)?.plate.split('-')[1] : ""}
                        </PaperCell>
                        <PaperCell className="w-[70%] border-r-0 relative" noBorderRight>
                           {row.right && (
                             <div className="font-handwriting text-blue-800 text-xl leading-none pl-2">
                                {row.right.driverId ? crew.find(c => c.id === row.right?.driverId)?.name.toUpperCase() : ""}
                                {row.right.attendantId && (
                                  <span className="mx-2 text-black/30">/</span>
                                )}
                                {row.right.attendantId ? crew.find(c => c.id === row.right?.attendantId)?.name.toUpperCase() : ""}
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
