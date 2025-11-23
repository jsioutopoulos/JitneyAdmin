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
  packId?: string; // Trip chain ID
  notes?: string;
}

const today = startOfToday();

export const vehicles: Vehicle[] = [
  { id: "v1", name: "Ambassador 304", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-01" },
  { id: "v2", name: "Ambassador 305", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-02" },
  { id: "v3", name: "Jitney 102", type: "Jitney", status: "active", capacity: 52, plate: "HAMP-03" },
  { id: "v4", name: "Jitney 105", type: "Jitney", status: "maintenance", capacity: 52, plate: "HAMP-04" },
  { id: "v5", name: "Ambassador 308", type: "Ambassador", status: "cleaning", capacity: 30, plate: "HAMP-05" },
  { id: "v6", name: "Jitney 108", type: "Jitney", status: "active", capacity: 52, plate: "HAMP-06" },
  { id: "v7", name: "Ambassador 310", type: "Ambassador", status: "active", capacity: 30, plate: "HAMP-07" },
];

export const crew: Crew[] = [
  { id: "c1", name: "James Wilson", role: "driver", status: "available", phone: "555-0101" },
  { id: "c2", name: "Maria Garcia", role: "driver", status: "assigned", phone: "555-0102" },
  { id: "c3", name: "Robert Chen", role: "driver", status: "assigned", phone: "555-0103" },
  { id: "c4", name: "Sarah Miller", role: "attendant", status: "available", phone: "555-0104" },
  { id: "c5", name: "David Kim", role: "attendant", status: "assigned", phone: "555-0105" },
  { id: "c6", name: "Lisa Wang", role: "attendant", status: "assigned", phone: "555-0106" },
  { id: "c7", name: "Tom Baker", role: "driver", status: "off-duty", phone: "555-0107" },
];

export const trips: Trip[] = [
  // Morning Westbound
  {
    id: "t1",
    route: "Montauk -> NYC (Manhattan)",
    direction: "westbound",
    departureTime: addHours(today, 6),
    arrivalTime: addHours(today, 9),
    vehicleId: "v1",
    driverId: "c2",
    attendantId: "c5",
    passengerCount: 28,
    status: "en-route",
    packId: "pack-1",
    notes: "VIP group on board"
  },
  {
    id: "t2",
    route: "Southampton -> NYC",
    direction: "westbound",
    departureTime: addHours(today, 6.5),
    arrivalTime: addHours(today, 8.5),
    vehicleId: "v3",
    driverId: "c3",
    attendantId: "c6",
    passengerCount: 45,
    status: "en-route",
    packId: "pack-2"
  },
  {
    id: "t3",
    route: "East Hampton -> NYC",
    direction: "westbound",
    departureTime: addHours(today, 7),
    arrivalTime: addHours(today, 9.5),
    vehicleId: "v6",
    driverId: null,
    attendantId: null,
    passengerCount: 12,
    status: "scheduled",
    packId: "pack-3"
  },
  // Afternoon Eastbound
  {
    id: "t4",
    route: "NYC -> Montauk",
    direction: "eastbound",
    departureTime: addHours(today, 13),
    arrivalTime: addHours(today, 16),
    vehicleId: "v1", // Same vehicle as t1 (Trip Chaining)
    driverId: "c2",
    attendantId: "c5",
    passengerCount: 20,
    status: "scheduled",
    packId: "pack-1"
  },
  {
    id: "t5",
    route: "NYC -> Southampton",
    direction: "eastbound",
    departureTime: addHours(today, 14),
    arrivalTime: addHours(today, 16),
    vehicleId: "v3",
    driverId: "c3",
    attendantId: "c6",
    passengerCount: 30,
    status: "scheduled",
    packId: "pack-2"
  },
  {
    id: "t6",
    route: "NYC -> East Hampton",
    direction: "eastbound",
    departureTime: addHours(today, 15),
    arrivalTime: addHours(today, 17.5),
    vehicleId: null,
    driverId: null,
    attendantId: null,
    passengerCount: 5,
    status: "scheduled",
    packId: "pack-3"
  },
  {
    id: "t7",
    route: "Airport Connection -> JFK",
    direction: "westbound",
    departureTime: addHours(today, 10),
    arrivalTime: addHours(today, 12),
    vehicleId: "v7",
    driverId: "c1",
    attendantId: "c4",
    passengerCount: 8,
    status: "scheduled"
  }
];
