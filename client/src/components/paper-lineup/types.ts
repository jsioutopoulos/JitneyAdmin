export type ResourceType =
  | "vehicle"
  | "driver"
  | "attendant"
  | "trip"
  | "leg"
  | "reservations"
  | "stops"
  | "seats";

export interface DraggableData {
  type: ResourceType;
  id: string;
  data: any;
}
