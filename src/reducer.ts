import type {
  AppState, Action, ActionMeta, AuditEntry, AuditAction, AuditResource,
  FieldChange, Vehicle, Driver, WorkOrder,
} from "./types";

/* ============================================================================
   reducer.ts — all state mutations flow through here, and every mutation
   appends an audit entry. Because the entire app dispatches through one
   reducer, it's impossible to change data without it being recorded.
   ========================================================================== */

let dSeq = 8, mSeq = 505, aSeq = 1;
const nextD = (): string => `D-${String(dSeq++).padStart(2, "0")}`;
const nextM = (): string => `M-${mSeq++}`;
const nextA = (): string => `A-${String(aSeq++).padStart(4, "0")}`;

// Fields worth diffing on edit (skip computed/positional ones).
const TRACKED = {
  vehicle: ["make", "model", "year", "vin", "status", "driverId", "odometer", "fuelType", "monthlyCost", "lastService", "nextService"] as const,
  driver: ["name", "license", "phone", "status"] as const,
  wo: ["vehicleId", "type", "priority", "status", "cost", "opened"] as const,
};

function diff<T extends object>(prev: T, next: T, fields: readonly (keyof T)[]): FieldChange[] {
  const changes: FieldChange[] = [];
  fields.forEach((f) => {
    if (prev[f] !== next[f] && next[f] !== undefined) {
      changes.push({ field: String(f), from: prev[f], to: next[f] });
    }
  });
  return changes;
}

function entry(
  meta: ActionMeta | undefined,
  action: AuditAction,
  resource: AuditResource,
  target: string,
  label: string,
  changes: FieldChange[] = []
): AuditEntry {
  return {
    id: nextA(),
    ts: new Date().toISOString(),
    actor: meta?.actor ?? "System",
    role: meta?.role ?? "—",
    action, resource, target, label, changes,
  };
}

export const INITIAL_STATE: AppState = {
  vehicles: [],         // populated by the API on first load (SYNC_VEHICLES)
  drivers: [],          // set by App from SEED at startup
  maintenance: [],
  audit: [],
};

export function reducer(state: AppState, action: Action): AppState {
  const m = action.meta;
  switch (action.type) {
    case "SYNC_VEHICLES":
      return { ...state, vehicles: action.payload };

    case "ADD_VEHICLE": {
      const v: Vehicle = action.payload;
      return {
        ...state,
        vehicles: [v, ...state.vehicles.filter((x) => x.id !== v.id)],
        audit: [entry(m, "Created", "Vehicle", v.id, `${v.year} ${v.make} ${v.model}`), ...state.audit],
      };
    }
    case "EDIT_VEHICLE": {
      const prev = state.vehicles.find((v) => v.id === action.payload.id);
      const changes = prev ? diff(prev, action.payload, TRACKED.vehicle) : [];
      const p = action.payload;
      return {
        ...state,
        vehicles: state.vehicles.map((v) => (v.id === p.id ? { ...v, ...p } : v)),
        audit: [entry(m, "Updated", "Vehicle", p.id, `${p.year} ${p.make} ${p.model}`, changes), ...state.audit],
      };
    }
    case "DELETE_VEHICLE": {
      const prev = state.vehicles.find((v) => v.id === action.payload);
      return {
        ...state,
        vehicles: state.vehicles.filter((v) => v.id !== action.payload),
        audit: [entry(m, "Deleted", "Vehicle", action.payload, prev ? `${prev.year} ${prev.make} ${prev.model}` : action.payload), ...state.audit],
      };
    }

    case "ADD_DRIVER": {
      const d: Driver = { ...action.payload, id: nextD() };
      return {
        ...state,
        drivers: [d, ...state.drivers],
        audit: [entry(m, "Created", "Driver", d.id, d.name), ...state.audit],
      };
    }
    case "EDIT_DRIVER": {
      const prev = state.drivers.find((d) => d.id === action.payload.id);
      const changes = prev ? diff(prev, action.payload, TRACKED.driver) : [];
      const p = action.payload;
      return {
        ...state,
        drivers: state.drivers.map((d) => (d.id === p.id ? { ...d, ...p } : d)),
        audit: [entry(m, "Updated", "Driver", p.id, p.name, changes), ...state.audit],
      };
    }
    case "DELETE_DRIVER": {
      const prev = state.drivers.find((d) => d.id === action.payload);
      return {
        ...state,
        drivers: state.drivers.filter((d) => d.id !== action.payload),
        audit: [entry(m, "Deleted", "Driver", action.payload, prev ? prev.name : action.payload), ...state.audit],
      };
    }

    case "ADD_WO": {
      const w: WorkOrder = { ...action.payload, id: nextM() };
      return {
        ...state,
        maintenance: [w, ...state.maintenance],
        audit: [entry(m, "Created", "Work Order", w.id, `${w.type} · ${w.vehicleId}`), ...state.audit],
      };
    }
    case "EDIT_WO": {
      const prev = state.maintenance.find((w) => w.id === action.payload.id);
      const changes = prev ? diff(prev, action.payload, TRACKED.wo) : [];
      const p = action.payload;
      return {
        ...state,
        maintenance: state.maintenance.map((w) => (w.id === p.id ? { ...w, ...p } : w)),
        audit: [entry(m, "Updated", "Work Order", p.id, `${p.type} · ${p.vehicleId}`, changes), ...state.audit],
      };
    }
    case "DELETE_WO": {
      const prev = state.maintenance.find((w) => w.id === action.payload);
      return {
        ...state,
        maintenance: state.maintenance.filter((w) => w.id !== action.payload),
        audit: [entry(m, "Deleted", "Work Order", action.payload, prev ? `${prev.type} · ${prev.vehicleId}` : action.payload), ...state.audit],
      };
    }
  }
}
