import type {
  Vehicle, Driver, WorkOrder, VehicleStatus, WorkOrderPriority,
} from "./types";

/* ------------------------------ Seed data ----------------------------- */

export const SEED_VEHICLES: Vehicle[] = [
  { id: "V-1001", make: "Ford", model: "Transit 250", year: 2023, vin: "1FTBR1C8XPKA12345", status: "Active", driverId: "D-01", odometer: 41280, fuelType: "Gasoline", monthlyCost: 612, lat: 41.0998, lng: -80.6495, lastService: "2025-02-12", nextService: "2025-08-12" },
  { id: "V-1002", make: "Chevrolet", model: "Silverado 1500", year: 2022, vin: "3GCUDDED7NG145521", status: "Maintenance", driverId: "D-02", odometer: 78950, fuelType: "Gasoline", monthlyCost: 845, lat: 41.2300, lng: -80.4970, lastService: "2025-05-01", nextService: "2025-06-05" },
  { id: "V-1003", make: "Tesla", model: "Model Y", year: 2024, vin: "7SAYGDEE1RF223410", status: "Active", driverId: "D-03", odometer: 18420, fuelType: "Electric", monthlyCost: 410, lat: 40.7989, lng: -81.3784, lastService: "2025-04-20", nextService: "2025-10-20" },
  { id: "V-1004", make: "RAM", model: "ProMaster 1500", year: 2021, vin: "3C6TRVAG2ME512233", status: "Active", driverId: "D-04", odometer: 102340, fuelType: "Diesel", monthlyCost: 920, lat: 41.4993, lng: -81.6944, lastService: "2025-03-15", nextService: "2025-06-02" },
  { id: "V-1005", make: "Ford", model: "F-150 Lightning", year: 2024, vin: "1FT6W1EV6PWG33102", status: "Active", driverId: "D-05", odometer: 9870, fuelType: "Electric", monthlyCost: 380, lat: 39.9612, lng: -82.9988, lastService: "2025-04-30", nextService: "2025-10-30" },
  { id: "V-1006", make: "Toyota", model: "RAV4 Hybrid", year: 2023, vin: "2T3RWRFV9PW145998", status: "Retired", driverId: null, odometer: 134500, fuelType: "Hybrid", monthlyCost: 0, lat: 41.0814, lng: -81.5190, lastService: "2024-12-01", nextService: "—" },
  { id: "V-1007", make: "Chevrolet", model: "Express 2500", year: 2020, vin: "1GCWGAFP4L1234876", status: "Maintenance", driverId: "D-06", odometer: 156200, fuelType: "Gasoline", monthlyCost: 1010, lat: 41.6639, lng: -83.5552, lastService: "2025-05-18", nextService: "2025-06-08" },
  { id: "V-1008", make: "Nissan", model: "Leaf", year: 2022, vin: "1N4AZ1CP7NC556210", status: "Active", driverId: "D-07", odometer: 33110, fuelType: "Electric", monthlyCost: 295, lat: 40.4173, lng: -82.9071, lastService: "2025-01-22", nextService: "2025-07-22" },
];

export const SEED_DRIVERS: Driver[] = [
  { id: "D-01", name: "Marcus Allen", license: "OH-DL-882114", phone: "330-555-0142", status: "Active" },
  { id: "D-02", name: "Priya Nadar", license: "OH-DL-771209", phone: "330-555-0188", status: "Active" },
  { id: "D-03", name: "Devon Carter", license: "OH-DL-664320", phone: "614-555-0119", status: "Active" },
  { id: "D-04", name: "Sofia Reyes", license: "OH-DL-559088", phone: "216-555-0173", status: "Active" },
  { id: "D-05", name: "James Okafor", license: "OH-DL-440217", phone: "614-555-0150", status: "Active" },
  { id: "D-06", name: "Hannah Liu", license: "OH-DL-330156", phone: "419-555-0134", status: "On Leave" },
  { id: "D-07", name: "Tyler Brooks", license: "OH-DL-220945", phone: "440-555-0167", status: "Active" },
];

export const SEED_MAINTENANCE: WorkOrder[] = [
  { id: "M-501", vehicleId: "V-1002", type: "Brake Replacement", priority: "High", status: "In Progress", opened: "2025-05-28", cost: 740 },
  { id: "M-502", vehicleId: "V-1007", type: "Transmission Service", priority: "High", status: "In Progress", opened: "2025-05-25", cost: 1850 },
  { id: "M-503", vehicleId: "V-1004", type: "Oil Change", priority: "Low", status: "Scheduled", opened: "2025-05-30", cost: 95 },
  { id: "M-504", vehicleId: "V-1001", type: "Tire Rotation", priority: "Medium", status: "Completed", opened: "2025-05-10", cost: 60 },
];

export const COST_TREND: { month: string; cost: number }[] = [
  { month: "Dec", cost: 4120 }, { month: "Jan", cost: 4380 },
  { month: "Feb", cost: 4210 }, { month: "Mar", cost: 4690 },
  { month: "Apr", cost: 4520 }, { month: "May", cost: 4472 },
];

/* ----------------------------- Theme ---------------------------------- */

export const C = {
  bg: "#0d1117", panel: "#161b22", panel2: "#1c2330", border: "#2a3340",
  text: "#e6edf3", dim: "#8b98a9", accent: "#ff6a3d", accent2: "#3d9bff",
  green: "#3fb950", amber: "#d29922", red: "#f85149",
} as const;

export const STATUS_COLOR: Record<VehicleStatus, string> = {
  Active: C.green, Maintenance: C.amber, Retired: C.dim,
};
export const PRIORITY_COLOR: Record<WorkOrderPriority, string> = {
  High: C.red, Medium: C.amber, Low: C.green,
};
export const PIE_COLORS = [C.green, C.amber, C.dim];
