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

export interface Passenger {
  id: string;
  name: string;
  confirmationCode: string;
  type: "Adult" | "Child" | "Senior";
  status: "confirmed" | "checked-in" | "no-show" | "cancelled";
  notes?: string; // e.g., ADA, Luggage
  pickupStopId: string;
  dropoffStopId: string;
  seat?: string;
}

export interface Stop {
  id: string;
  name: string;
  time: Date;
  type: "pickup" | "dropoff" | "both";
  status: "open" | "closed";
  assignedVehicleId?: string; // If trip has multiple vehicles
}

export interface TripLeg {
  id: string;
  status: TripStatus;
  direction: "westbound" | "eastbound";
}

export interface Trip {
  id: string;
  route: string;
  direction: "westbound" | "eastbound";
  departureTime: Date;
  arrivalTime: Date;
  vehicleId: string | null;
  driverIds: string[];
  attendantIds: string[];
  passengerCount: number;
  capacity: number; // Editable capacity
  reservedCount: number;
  status: TripStatus;
  packId?: string; // Trip chain ID - Used for the "Trip" column display
  legs?: TripLeg[];
  notes?: string;
  hasAda?: boolean;
  passengers: Passenger[];
  stops: Stop[];
}

const today = startOfToday();

export const vehicles: Vehicle[] = [
  { id: "v1", name: "Jitney 101", type: "Jitney", status: "active", capacity: 54, plate: "NY-J101" },
  { id: "v2", name: "Jitney 102", type: "Jitney", status: "active", capacity: 54, plate: "NY-J102" },
  { id: "v3", name: "Ambassador 201", type: "Ambassador", status: "active", capacity: 40, plate: "NY-A201" },
  { id: "v4", name: "Ambassador 202", type: "Ambassador", status: "maintenance", capacity: 40, plate: "NY-A202" },
  { id: "v5", name: "Charter 301", type: "Charter", status: "active", capacity: 60, plate: "NY-C301" },
  { id: "v6", name: "Jitney 103", type: "Jitney", status: "active", capacity: 54, plate: "NY-J103" },
  { id: "v7", name: "Jitney 104", type: "Jitney", status: "cleaning", capacity: 54, plate: "NY-J104" },
  { id: "v8", name: "Ambassador 203", type: "Ambassador", status: "active", capacity: 40, plate: "NY-A203" },
  { id: "v9", name: "Charter 302", type: "Charter", status: "active", capacity: 60, plate: "NY-C302" },
  { id: "v10", name: "Jitney 105", type: "Jitney", status: "active", capacity: 54, plate: "NY-J105" },
  { id: "v11", name: "Jitney 106", type: "Jitney", status: "active", capacity: 54, plate: "NY-J106" },
  { id: "v12", name: "Ambassador 204", type: "Ambassador", status: "active", capacity: 40, plate: "NY-A204" },
];

export const crew: Crew[] = [
  { id: "c1", name: "John Smith", role: "driver", status: "assigned", phone: "555-0101" },
  { id: "c2", name: "Jane Doe", role: "driver", status: "available", phone: "555-0102" },
  { id: "c3", name: "Mike Johnson", role: "driver", status: "off-duty", phone: "555-0103" },
  { id: "c4", name: "Sarah Wilson", role: "attendant", status: "assigned", phone: "555-0104" },
  { id: "c5", name: "Tom Brown", role: "driver", status: "available", phone: "555-0105" },
  { id: "c6", name: "Emily Davis", role: "attendant", status: "available", phone: "555-0106" },
  { id: "c7", name: "David Miller", role: "driver", status: "assigned", phone: "555-0107" },
  { id: "c8", name: "Lisa Taylor", role: "attendant", status: "off-duty", phone: "555-0108" },
  { id: "c9", name: "James Anderson", role: "attendant", status: "assigned", phone: "555-0109" },
  { id: "c10", name: "Robert Thomas", role: "driver", status: "available", phone: "555-0110" },
  { id: "c11", name: "Jennifer Jackson", role: "attendant", status: "available", phone: "555-0111" },
  { id: "c12", name: "William White", role: "attendant", status: "assigned", phone: "555-0112" },
  { id: "c13", name: "Charles Harris", role: "driver", status: "available", phone: "555-0113" },
  { id: "c14", name: "Patricia Martin", role: "driver", status: "assigned", phone: "555-0114" },
  { id: "c15", name: "Linda Thompson", role: "attendant", status: "assigned", phone: "555-0115" },
];

// Helper to generate passengers
// ... existing generatePassengers ...
const generatePassengers = (count: number): Passenger[] => {
  const names = ["Chodor, Benjamin", "Stewart, Katrina", "Brumlik, John", "Cordova, Paola", "Boyce, Brent", "Mancini, Jeff", "Penuel, Brad", "Montague, Mark", "Arnao, Byron", "Gonzalez, Angel", "Gomberg, Maxwell", "Kernan, Jim", "Giamatteo, John", "McGuckin, Joseph"];
  return Array.from({ length: count }).map((_, i) => ({
    id: `p-${Math.random().toString(36).substr(2, 9)}`,
    name: names[Math.floor(Math.random() * names.length)],
    confirmationCode: Math.floor(100000 + Math.random() * 900000).toString(),
    type: "Adult",
    status: "confirmed",
    pickupStopId: "s1",
    dropoffStopId: "s3",
    seat: `1${String.fromCharCode(65 + i)}`,
    notes: Math.random() > 0.9 ? "ADA" : undefined
  }));
};

// Helper to generate stops
// ... existing generateStops ...
const generateStops = (startTime: Date): Stop[] => [
  { id: "s1", name: "East Hampton", time: startTime, type: "pickup", status: "open" },
  { id: "s2", name: "Southampton", time: addMinutes(startTime, 30), type: "pickup", status: "open" },
  { id: "s3", name: "Manorville", time: addMinutes(startTime, 60), type: "both", status: "open" },
  { id: "s4", name: "NYC - 40th & 3rd", time: addMinutes(startTime, 150), type: "dropoff", status: "open" },
];

// Helper to create trips easily
const createTrip = (id: string, packId: string, route: string, vehicleId: string | null, driverId: string | null, attendantId: string | null): Trip => {
  const departureTime = addHours(today, 6 + Math.random() * 12);
  const capacity = 54;
  const passengerCount = Math.floor(Math.random() * 40);
  
  // Parse packId to generate legs
  // e.g. "1 + 32" -> ["1", "32"]
  const legIds = packId.split(/\s+\+\s+/);
  const legs: TripLeg[] = legIds.map((lid, idx) => ({
    id: lid,
    status: Math.random() > 0.7 ? "completed" : Math.random() > 0.5 ? "en-route" : "scheduled",
    direction: idx % 2 === 0 ? "westbound" : "eastbound"
  }));

  return {
    id,
    packId,
    route,
    direction: "westbound", // Default
    departureTime,
    arrivalTime: addHours(today, 8 + Math.random() * 12),
    vehicleId,
    driverIds: driverId ? [driverId] : [],
    attendantIds: attendantId ? [attendantId] : [],
    passengerCount,
    capacity,
    reservedCount: passengerCount,
    status: "scheduled",
    hasAda: Math.random() > 0.8,
    legs,
    passengers: generatePassengers(passengerCount),
    stops: generateStops(departureTime)
  };
};

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