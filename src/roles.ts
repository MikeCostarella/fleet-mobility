import type { RoleKey, RoleDef, Resource, CrudAction, TabId } from "./types";

/*
  Typing ROLES as Record<RoleKey, RoleDef> guarantees every role defines a
  complete permission matrix — omit a resource and it won't compile.
*/

export const ROLES: Record<RoleKey, RoleDef> = {
  Admin: {
    label: "Admin", blurb: "Full access to every module",
    color: "#ff6a3d", sample: "Alex Morgan",
    tabs: ["dashboard", "vehicles", "drivers", "maintenance", "telematics", "audit"],
    perms: {
      vehicles: { create: true, edit: true, delete: true },
      drivers: { create: true, edit: true, delete: true },
      maintenance: { create: true, edit: true, delete: true },
    },
  },
  "Fleet Manager": {
    label: "Fleet Manager", blurb: "Manage vehicles, drivers & assignments",
    color: "#3d9bff", sample: "Priya Nadar",
    tabs: ["dashboard", "vehicles", "drivers", "maintenance", "telematics", "audit"],
    perms: {
      vehicles: { create: true, edit: true, delete: false },
      drivers: { create: true, edit: true, delete: false },
      maintenance: { create: true, edit: true, delete: false },
    },
  },
  "Maintenance Tech": {
    label: "Maintenance Tech", blurb: "Work orders & vehicle status only",
    color: "#d29922", sample: "Hannah Liu",
    tabs: ["dashboard", "vehicles", "maintenance"],
    perms: {
      vehicles: { create: false, edit: true, delete: false },
      drivers: { create: false, edit: false, delete: false },
      maintenance: { create: true, edit: true, delete: true },
    },
  },
  Driver: {
    label: "Driver", blurb: "Read-only view of fleet & assignments",
    color: "#3fb950", sample: "Marcus Allen",
    tabs: ["dashboard", "vehicles", "telematics"],
    perms: {
      vehicles: { create: false, edit: false, delete: false },
      drivers: { create: false, edit: false, delete: false },
      maintenance: { create: false, edit: false, delete: false },
    },
  },
};

export const can = (role: RoleKey, resource: Resource, action: CrudAction): boolean =>
  ROLES[role].perms[resource][action];

export const canSeeTab = (role: RoleKey, tab: TabId): boolean =>
  ROLES[role].tabs.includes(tab);
