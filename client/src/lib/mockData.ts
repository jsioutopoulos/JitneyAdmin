import { addHours, addMinutes, format, startOfToday, subDays } from "date-fns";

export type TripStatus = "scheduled" | "boarding" | "en-route" | "completed" | "cancelled";
export type VehicleType = "Ambassador" | "Jitney" | "Charter";
export type CrewRole = "driver" | "attendant";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  status: "active" | "maintenance" | "cleaning";
  capacity: number;
  plate: string;
}

export interface Crew {
  id: string;
  name: string;
  role: CrewRole;
  status: "available" | "assigned" | "off-duty";
  phone: string;
}

export interface Trip {
  id: string;
  route: string;
  direction: "westbound" | "eastbound";
  departureTime: Date;
  arrivalTime: Date;
  vehicleId: string | null;
  driverId: string | null;
  attendantId: string | null;
  passengerCount: number;
  status: TripStatus;
  packId?: string; // Trip chain ID - Used for the "Trip" column display
  notes?: string;
}

const today = startOfToday();

export const vehicles: Vehicle[] = [
  { id: "v1", name: "Ambassador 304", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-152" },
  { id: "v2", name: "Ambassador 305", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-127" },
  { id: "v3", name: "Jitney 102", type: "Jitney", status: "active", capacity: 52, plate: "HAMP-149" },
  { id: "v4", name: "Jitney 105", type: "Jitney", status: "maintenance", capacity: 52, plate: "HAMP-173" },
  { id: "v5", name: "Ambassador 308", type: "Ambassador", status: "cleaning", capacity: 30, plate: "HAMP-129" },
  { id: "v6", name: "Jitney 108", type: "Jitney", status: "active", capacity: 52, plate: "HAMP-167" },
  { id: "v7", name: "Ambassador 310", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-133" },
  { id: "v8", name: "Jitney 111", type: "Jitney", status: "active", capacity: 52, plate: "HAMP-111" },
  { id: "v9", name: "Jitney 147", type: "Jitney", status: "active", capacity: 52, plate: "HAMP-147" },
  { id: "v10", name: "Jitney 118", type: "Jitney", status: "active", capacity: 52, plate: "HAMP-118" },
  { id: "v11", name: "Ambassador 312", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-160" },
  { id: "v12", name: "Ambassador 315", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-154" },
];

export const crew: Crew[] = [
  { id: "c1", name: "Patricia T.", role: "driver", status: "available", phone: "555-0101" },
  { id: "c2", name: "Brent", role: "driver", status: "assigned", phone: "555-0102" },
  { id: "c3", name: "Patricia 2", role: "driver", status: "assigned", phone: "555-0103" },
  { id: "c4", name: "Vance", role: "driver", status: "available", phone: "555-0104" },
  { id: "c5", name: "K Singh", role: "driver", status: "assigned", phone: "555-0105" },
  { id: "c6", name: "Alex M", role: "driver", status: "assigned", phone: "555-0106" },
  { id: "c7", name: "Brent I.", role: "driver", status: "off-duty", phone: "555-0107" },
  { id: "c8", name: "Johnny", role: "driver", status: "available", phone: "555-0108" },
  { id: "c9", name: "Susan", role: "attendant", status: "assigned", phone: "555-0109" },
  { id: "c10", name: "Rich H", role: "driver", status: "assigned", phone: "555-0110" },
  { id: "c11", name: "Francis", role: "driver", status: "available", phone: "555-0111" },
  { id: "c12", name: "Olga", role: "attendant", status: "assigned", phone: "555-0112" },
  { id: "c13", name: "Robert", role: "driver", status: "available", phone: "555-0113" },
  { id: "c14", name: "Luis", role: "driver", status: "assigned", phone: "555-0114" },
  { id: "c15", name: "Justine", role: "attendant", status: "assigned", phone: "555-0115" },
];

// Helper to create trips easily
const createTrip = (id: string, packId: string, route: string, vehicleId: string | null, driverId: string | null, attendantId: string | null): Trip => ({
  id,
  packId,
  route,
  direction: "westbound", // Default
  departureTime: addHours(today, 6 + Math.random() * 12),
  arrivalTime: addHours(today, 8 + Math.random() * 12),
  vehicleId,
  driverId,
  attendantId,
  passengerCount: Math.floor(Math.random() * 40),
  status: "scheduled"
});

// Interleaved trips to match the Left/Right column logic in PaperLineup
// Left 1, Right 1, Left 2, Right 2, etc.
export const trips: Trip[] = [
  // Row 1
  createTrip("t1", "1 + 32", "Montauk -> NYC", "v1", "c1", "c9"),
  createTrip("t2", "57 + 16", "NYC -> Montauk", "v8", "c14", "c15"),
  
  // Row 2
  createTrip("t3", "1sg trans", "Shuttle", "v2", "c2", null),
  createTrip("t4", "57/77", "NYC -> Hamptons", "v9", null, null),

  // Row 3
  createTrip("t5", "32sg trans", "Shuttle", "v3", "c3", null),
  createTrip("t6", "77 trans", "Transfer", "v10", null, null),

  // Row 4
  createTrip("t7", "691/91 + 692", "Multi-leg", "v4", "c4", "c9"),
  createTrip("t8", "263 + 236", "Express", "v11", "c5", null),

  // Row 5
  createTrip("t9", "91 trans", "Transfer", "v5", "c5", null),
  createTrip("t10", "273", "Local", "v12", null, null),

  // Row 6
  createTrip("t11", "233 + 234", "Loop", "v6", "c6", null),
  createTrip("t12", "9 + 12", "Chain", "v3", "c8", null),

  // Row 7
  createTrip("t13", "3 + 4", "Westbound", "v2", "c7", "c12"),
  createTrip("t14", "9sg + 10", "Special", null, null, null),

  // Row 8
  createTrip("t15", "3sg trans", "Shuttle", "v7", "c8", null),
  createTrip("t16", "11 +", "Partial", "v6", "c10", null),

  // Row 9
  createTrip("t17", "4sg trans", "Shuttle", null, "c9", null),
  createTrip("t18", "611 + 612", "Long Haul", "v4", null, null),

  // Row 10
  createTrip("t19", "5 + 6", "Standard", "v6", "c10", null),
  createTrip("t20", "239", "Direct", "v6", "c1", null),

  // Row 11
  createTrip("t21", "605 + 606", "Connector", "v1", "c11", "c12"),
  createTrip("t22", "229", "Direct", "v2", "c2", null),

  // Row 12
  createTrip("t23", "37 + 48", "Split", "v5", "c13", null),
  createTrip("t24", "49 + 68", "Merge", "v2", "c3", null),

  // Row 13
  createTrip("t25", "255 + 216", "Chain", "v6", "c4", "c15"),
  createTrip("t26", "49/61", "Combo", null, null, null),

  // Row 14
  createTrip("t27", "285", "Single", "v7", null, null),
  createTrip("t28", "61 trans", "Transfer", "v6", null, null),

  // Row 15
  createTrip("t29", "7 + 8", "Pair", "v2", "c5", null),
  createTrip("t30", "661 + 668", "Heavy", "v1", "c1", null),

  // Row 16
  createTrip("t31", "7/45 + 28", "Complex", "v5", "c6", null),
  createTrip("t32", "295", "Standard", "v6", "c7", null),

  // Row 17
  createTrip("t33", "45 trans", "Transfer", "v10", "c8", null),
  createTrip("t34", "293", "Standard", "v12", "c9", null),

  // Row 18
  createTrip("t35", "8sg trans", "Shuttle", "v3", null, null),
  createTrip("t36", "13 + 18", "Pair", "v5", "c10", null),

  // Row 19
  createTrip("t37", "645 + 628", "Chain", "v4", "c11", null),
  createTrip("t38", "18sg trans", "Shuttle", null, null, null),

  // Row 20
  createTrip("t39", "209 + 210", "Roundtrip", "v3", "c12", "c15"),
  createTrip("t40", "13/693 + 46", "Complex", "v4", "c13", null),

  // Row 21
  createTrip("t41", "31 + 40", "Pair", "v6", "c14", null),
  createTrip("t42", "693 trans", "Transfer", "v3", "c1", null),

  // Row 22
  createTrip("t43", "31 + 70", "Split", "v2", "c2", null),
  createTrip("t44", "223", "Direct", "v8", "c3", null),

  // Row 23
  createTrip("t45", "40sg trans", "Shuttle", null, null, null),
  createTrip("t46", "15/17 + 62", "Complex", "v5", "c4", null),

  // Row 24
  createTrip("t47", "635/35 + 670", "Chain", "v4", "c5", null),
  createTrip("t48", "17 trans", "Transfer", "v6", "c6", null),

  // Row 25
  createTrip("t49", "35 trans", "Transfer", "v10", null, null),
  createTrip("t50", "219", "Standard", "v3", "c7", null),

  // Row 26
  createTrip("t51", "237 + 250", "Chain", "v6", "c8", null),
  createTrip("t52", "19 + 20", "Pair", "v6", "c9", null),

  // Row 27
  createTrip("t53", "247", "Single", "v6", null, null),
  createTrip("t54", "19sg trans", "Shuttle", null, null, null),

  // Row 28
  createTrip("t55", "21 + 90", "Pair", "v1", "c10", null),
  createTrip("t56", "639/39", "Combo", "v4", "c11", null),

  // Row 29
  createTrip("t57", "21sg", "Shuttle", "v5", "c12", null),
  createTrip("t58", "39 trans", "Transfer", "v1", "c13", null),

  // Row 30
  createTrip("t59", "677 + 690", "Chain", "v12", "c14", null),
  createTrip("t60", "999", "Extra", null, null, null),
];
