/* ============================================================================
   types.ts — single source of truth for the app's domain model.

   Centralizing types here means every component, the reducer, and the API
   layer all agree on the same shapes. Change a field once and the compiler
   flags every place that needs updating.
   ========================================================================== */

/* ----------------------------- Domain enums ---------------------------- */

export type VehicleStatus = "Active" | "Maintenance" | "Retired";
export type FuelType = "Gasoline" | "Diesel" | "Hybrid" | "Electric";
export type DriverStatus = "Active" | "On Leave" | "Inactive";
export type WorkOrderPriority = "Low" | "Medium" | "High";
export type WorkOrderStatus = "Scheduled" | "In Progress" | "Completed";

/* ---------------------------- Domain records --------------------------- */

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: VehicleStatus;
  driverId: string | null;
  odometer: number;
  fuelType: FuelType;
  monthlyCost: number;
  lat: number;
  lng: number;
  lastService: string;
  nextService: string;
}

export interface Driver {
  id: string;
  name: string;
  license: string;
  phone: string;
  status: DriverStatus;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  type: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  opened: string;
  cost: number;
}

/* A new vehicle before the API assigns it an id. */
export type VehicleDraft = Omit<Vehicle, "id">;
export type DriverDraft = Omit<Driver, "id">;
export type WorkOrderDraft = Omit<WorkOrder, "id">;

/* ------------------------------- Roles --------------------------------- */

export type RoleKey = "Admin" | "Fleet Manager" | "Maintenance Tech" | "Driver";
export type TabId = "dashboard" | "vehicles" | "drivers" | "maintenance" | "telematics" | "audit";
export type Resource = "vehicles" | "drivers" | "maintenance";
export type CrudAction = "create" | "edit" | "delete";

export type ResourcePerms = Record<Resource, Record<CrudAction, boolean>>;

export interface RoleDef {
  label: string;
  blurb: string;
  color: string;
  sample: string;
  tabs: TabId[];
  perms: ResourcePerms;
}

/* ----------------------------- Audit log ------------------------------- */

export type AuditAction = "Created" | "Updated" | "Deleted";
export type AuditResource = "Vehicle" | "Driver" | "Work Order";

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditEntry {
  id: string;
  ts: string;
  actor: string;
  role: string;
  action: AuditAction;
  resource: AuditResource;
  target: string;
  label: string;
  changes: FieldChange[];
}

export interface ActionMeta {
  actor: string;
  role: string;
}

/* -------------------------- Application state -------------------------- */

export interface AppState {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenance: WorkOrder[];
  audit: AuditEntry[];
}

/* ----------------------- Reducer action union -------------------------- */
/*
  A discriminated union: each action's `type` literal narrows the shape of
  `payload`, so inside the reducer's switch the compiler knows exactly what
  payload is for each case. Dispatching a malformed action won't compile.
*/

export type Action =
  | { type: "SYNC_VEHICLES"; payload: Vehicle[]; meta?: ActionMeta }
  | { type: "ADD_VEHICLE"; payload: Vehicle; meta?: ActionMeta }
  | { type: "EDIT_VEHICLE"; payload: Vehicle; meta?: ActionMeta }
  | { type: "DELETE_VEHICLE"; payload: string; meta?: ActionMeta }
  | { type: "ADD_DRIVER"; payload: DriverDraft; meta?: ActionMeta }
  | { type: "EDIT_DRIVER"; payload: Driver; meta?: ActionMeta }
  | { type: "DELETE_DRIVER"; payload: string; meta?: ActionMeta }
  | { type: "ADD_WO"; payload: WorkOrderDraft; meta?: ActionMeta }
  | { type: "EDIT_WO"; payload: WorkOrder; meta?: ActionMeta }
  | { type: "DELETE_WO"; payload: string; meta?: ActionMeta };

export type AppDispatch = (action: Action) => void;
