import {
  useState, useMemo, useReducer, useEffect, useCallback, useRef,
  type ReactNode, type CSSProperties,
} from "react";
import {
  Truck, Users, Wrench, MapPin, LayoutDashboard, Plus, Search,
  Pencil, Trash2, X, Fuel, Gauge, CheckCircle2,
  Clock, DollarSign, TrendingUp, Eye, ArrowLeft, Calendar, Hash, Phone,
  Shield, LogOut, Lock, ChevronDown, ScrollText, Filter, ArrowRight,
  RefreshCw, AlertCircle, Loader, Wifi, Menu,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import type {
  AppState, AppDispatch, Vehicle, Driver, WorkOrder, VehicleDraft,
  DriverDraft, WorkOrderDraft, RoleKey, TabId, AuditAction, FieldChange,
} from "./types";
import {
  SEED_DRIVERS, SEED_MAINTENANCE, COST_TREND,
  C, STATUS_COLOR, PRIORITY_COLOR, PIE_COLORS,
} from "./data";
import { ROLES, can, canSeeTab } from "./roles";
import { fleetApi, setForceFail, getForceFail } from "./api";
import { reducer, INITIAL_STATE } from "./reducer";

/* ------------------------------ Hooks --------------------------------- */

// Tracks whether the viewport is phone-sized, so layout can switch between
// the desktop sidebar and a slide-in mobile drawer.
function useIsMobile(breakpoint = 760): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ------------------------------ UI atoms ------------------------------ */

function Badge({ color, children }: { color: string; children: ReactNode }) {
  return <span style={{ color, background: `${color}22`, border: `1px solid ${color}55`, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
}

type BtnVariant = "primary" | "ghost" | "icon";
function Btn({ children, onClick, variant = "primary", small, disabled, title }: {
  children: ReactNode; onClick?: () => void; variant?: BtnVariant;
  small?: boolean; disabled?: boolean; title?: string;
}) {
  const styles: Record<BtnVariant, CSSProperties> = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.dim, border: `1px solid ${C.border}` },
    icon: { background: "transparent", color: C.dim, border: "none", padding: 6 },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} title={disabled && title ? title : undefined}
      style={{ ...styles[variant], cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .38 : 1, borderRadius: 8, padding: small ? "6px 12px" : "9px 16px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity .15s" }}
      onMouseOver={(e) => { if (!disabled) e.currentTarget.style.opacity = ".85"; }}
      onMouseOut={(e) => { if (!disabled) e.currentTarget.style.opacity = "1"; }}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label style={{ display: "block", marginBottom: 14 }}><span style={{ display: "block", fontSize: 12, color: C.dim, marginBottom: 5, fontWeight: 600, letterSpacing: .3 }}>{label}</span>{children}</label>;
}
const inputStyle: CSSProperties = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 14, boxSizing: "border-box" };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <Btn variant="icon" onClick={onClose}><X size={18} /></Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: ReactNode; label: string; value: ReactNode; sub?: string; color: string;
}) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, flex: 1, minWidth: 170 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.dim, fontSize: 13, fontWeight: 600 }}>
        <span style={{ color }}>{icon}</span>{label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 60, background: C.panel, border: `1px solid ${C.red}66`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, maxWidth: 360, boxShadow: "0 10px 30px #0008" }}>
      <AlertCircle size={18} color={C.red} />
      <span style={{ fontSize: 13, flex: 1 }}>{message}</span>
      <Btn variant="icon" onClick={onClose}><X size={16} /></Btn>
    </div>
  );
}

/* ------------------------------ Sidebar ------------------------------- */

interface NavItem { id: TabId; label: string; icon: ReactNode; }
const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "vehicles", label: "Vehicles", icon: <Truck size={18} /> },
  { id: "drivers", label: "Drivers", icon: <Users size={18} /> },
  { id: "maintenance", label: "Maintenance", icon: <Wrench size={18} /> },
  { id: "telematics", label: "Telematics", icon: <MapPin size={18} /> },
  { id: "audit", label: "Audit Log", icon: <ScrollText size={18} /> },
];

function Sidebar({ tab, setTab, role, isMobile, open, onClose }: {
  tab: TabId; setTab: (t: TabId) => void; role: RoleKey;
  isMobile: boolean; open: boolean; onClose: () => void;
}) {
  const handlePick = (id: TabId, allowed: boolean) => {
    if (!allowed) return;
    setTab(id);
    if (isMobile) onClose();
  };

  const panel = (
    <div style={{
      width: 220, background: C.panel, borderRight: `1px solid ${C.border}`, padding: 18,
      flexShrink: 0, boxSizing: "border-box",
      ...(isMobile
        ? { position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 70, overflowY: "auto",
            paddingTop: "calc(18px + env(safe-area-inset-top))",
            transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform .25s ease",
            boxShadow: open ? "0 0 40px #000a" : "none" }
        : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, padding: "4px 6px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: C.accent, display: "grid", placeItems: "center", fontWeight: 900, color: "#fff" }}>C</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1 }}>Costarella</div>
          <div style={{ fontSize: 11, color: C.dim }}>Transportation</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", background: `${ROLES[role].color}1a`, border: `1px solid ${ROLES[role].color}44`, borderRadius: 9, marginBottom: 18 }}>
        <Shield size={14} color={ROLES[role].color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: ROLES[role].color }}>{ROLES[role].label}</span>
      </div>
      {NAV.map((n) => {
        const allowed = canSeeTab(role, n.id);
        return (
          <div key={n.id} onClick={() => handlePick(n.id, allowed)} title={allowed ? "" : "Not available for your role"}
            style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 9, cursor: allowed ? "pointer" : "not-allowed", marginBottom: 4, fontSize: 14, fontWeight: 600, opacity: allowed ? 1 : .35, color: tab === n.id ? "#fff" : C.dim, background: tab === n.id ? C.accent : "transparent", transition: "background .15s" }}>
            {n.icon}{n.label}
            {!allowed && <Lock size={12} style={{ marginLeft: "auto" }} />}
          </div>
        );
      })}
    </div>
  );

  if (!isMobile) return panel;

  // Mobile: drawer + tap-to-close backdrop.
  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 65 }} />
      )}
      {panel}
    </>
  );
}

/* ----------------------------- Dashboard ------------------------------ */

function Dashboard({ state }: { state: AppState }) {
  const { vehicles, drivers, maintenance } = state;
  const active = vehicles.filter((v) => v.status === "Active").length;
  const inMaint = vehicles.filter((v) => v.status === "Maintenance").length;
  const monthlyCost = vehicles.reduce((s, v) => s + v.monthlyCost, 0);
  const openWO = maintenance.filter((m) => m.status !== "Completed").length;
  const statusData = (["Active", "Maintenance", "Retired"] as const).map((s) => ({ name: s, value: vehicles.filter((v) => v.status === s).length }));
  const fuelData = useMemo(() => {
    const map: Record<string, number> = {};
    vehicles.forEach((v) => { map[v.fuelType] = (map[v.fuelType] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [vehicles]);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={<Truck size={16} />} label="Total Fleet" value={vehicles.length} sub={`${active} active`} color={C.accent2} />
        <StatCard icon={<Wrench size={16} />} label="In Maintenance" value={inMaint} sub={`${openWO} open work orders`} color={C.amber} />
        <StatCard icon={<DollarSign size={16} />} label="Monthly Cost" value={`$${monthlyCost.toLocaleString()}`} sub="across active fleet" color={C.green} />
        <StatCard icon={<Users size={16} />} label="Drivers" value={drivers.length} sub={`${drivers.filter((d) => d.status === "Active").length} active`} color={C.accent} />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={16} color={C.accent} /> Fleet Cost Trend</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={COST_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" stroke={C.dim} fontSize={12} />
              <YAxis stroke={C.dim} fontSize={12} />
              <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Line type="monotone" dataKey="cost" stroke={C.accent} strokeWidth={3} dot={{ fill: C.accent }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: 240, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 14 }}>Fleet by Status</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Legend wrapperStyle={{ fontSize: 12, color: C.dim }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 14, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Fuel size={16} color={C.accent2} /> Fleet by Powertrain</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={fuelData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" stroke={C.dim} fontSize={12} />
            <YAxis stroke={C.dim} fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="count" fill={C.accent2} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ------------------------------ Vehicles ------------------------------ */

const EMPTY_VEHICLE: VehicleDraft = { make: "", model: "", year: 2024, vin: "", status: "Active", driverId: null, odometer: 0, fuelType: "Gasoline", monthlyCost: 0, lat: 41.0998, lng: -80.6495, lastService: "", nextService: "" };

function VehicleForm({ initial, drivers, onSave, onClose, saving }: {
  initial: Vehicle | VehicleDraft;
  drivers: Driver[];
  onSave: (form: Vehicle | VehicleDraft) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState(initial);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  return (
    <>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="MAKE"><input style={inputStyle} value={f.make} onChange={(e) => set("make", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="MODEL"><input style={inputStyle} value={f.model} onChange={(e) => set("model", e.target.value)} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="YEAR"><input type="number" style={inputStyle} value={f.year} onChange={(e) => set("year", +e.target.value)} /></Field></div>
        <div style={{ flex: 2 }}><Field label="VIN"><input style={inputStyle} value={f.vin} onChange={(e) => set("vin", e.target.value)} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="STATUS"><select style={inputStyle} value={f.status} onChange={(e) => set("status", e.target.value as Vehicle["status"])}><option>Active</option><option>Maintenance</option><option>Retired</option></select></Field></div>
        <div style={{ flex: 1 }}><Field label="POWERTRAIN"><select style={inputStyle} value={f.fuelType} onChange={(e) => set("fuelType", e.target.value as Vehicle["fuelType"])}><option>Gasoline</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="ODOMETER"><input type="number" style={inputStyle} value={f.odometer} onChange={(e) => set("odometer", +e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="MONTHLY COST ($)"><input type="number" style={inputStyle} value={f.monthlyCost} onChange={(e) => set("monthlyCost", +e.target.value)} /></Field></div>
      </div>
      <Field label="ASSIGNED DRIVER">
        <select style={inputStyle} value={f.driverId || ""} onChange={(e) => set("driverId", e.target.value || null)}>
          <option value="">Unassigned</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn onClick={() => onSave(f)} disabled={saving}>
          {saving ? <><Loader size={15} style={{ animation: "fleetSpin 1s linear infinite" }} /> Saving…</> : "Save Vehicle"}
        </Btn>
      </div>
    </>
  );
}

function SkeletonRow() {
  return (
    <tr style={{ borderTop: `1px solid ${C.border}` }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 14px" }}>
          <div style={{ height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${C.panel2} 25%, ${C.border} 50%, ${C.panel2} 75%)`, backgroundSize: "200% 100%", animation: "fleetShimmer 1.2s infinite" }} />
        </td>
      ))}
    </tr>
  );
}

type VehicleModal = { mode: "add"; vehicle: VehicleDraft } | { mode: "edit"; vehicle: Vehicle };

function Vehicles({ state, dispatch, onOpen, role }: {
  state: AppState; dispatch: AppDispatch; onOpen: (id: string) => void; role: RoleKey;
}) {
  const { drivers } = state;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | Vehicle["status"]>("All");
  const [modal, setModal] = useState<VehicleModal | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [simOutage, setSimOutage] = useState(getForceFail());
  const driverName = (id: string | null) => drivers.find((d) => d.id === id)?.name || "—";

  // GET /api/vehicles — runs on mount and on manual refresh.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fleetApi.list();
      setVehicles(data);
      dispatch({ type: "SYNC_VEHICLES", payload: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const toggleOutage = () => {
    const next = !simOutage;
    setSimOutage(next);
    setForceFail(next);
    load();
  };

  const saveVehicle = async (form: Vehicle | VehicleDraft, mode: "add" | "edit") => {
    setSaving(true);
    try {
      if (mode === "add") {
        const created = await fleetApi.create(form as VehicleDraft);
        setVehicles((vs) => [created, ...vs]);
        dispatch({ type: "ADD_VEHICLE", payload: created });
      } else {
        const v = form as Vehicle;
        const updated = await fleetApi.update(v.id, v);
        setVehicles((vs) => vs.map((x) => (x.id === updated.id ? updated : x)));
        dispatch({ type: "EDIT_VEHICLE", payload: updated });
      }
      setModal(null);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    setBusyId(id);
    try {
      await fleetApi.remove(id);
      setVehicles((vs) => vs.filter((v) => v.id !== id));
      dispatch({ type: "DELETE_VEHICLE", payload: id });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const rows = vehicles.filter((v) =>
    (filter === "All" || v.status === filter) &&
    `${v.id} ${v.make} ${v.model} ${v.vin}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <style>{`@keyframes fleetShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes fleetSpin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: 11, color: C.dim }} />
          <input placeholder="Search vehicles…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select style={{ ...inputStyle, width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option>All</option><option>Active</option><option>Maintenance</option><option>Retired</option>
        </select>
        <Btn variant="ghost" onClick={load} disabled={loading} title="Refetch from API">
          <RefreshCw size={15} style={loading ? { animation: "fleetSpin 1s linear infinite" } : undefined} /> Refresh
        </Btn>
        <button onClick={toggleOutage} title="Toggle a simulated backend outage (for demoing the error state)"
          style={{ cursor: "pointer", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, transition: "all .15s", background: simOutage ? `${C.red}22` : "transparent", color: simOutage ? C.red : C.dim, border: `1px solid ${simOutage ? C.red + "66" : C.border}` }}>
          <Wifi size={15} /> {simOutage ? "Outage: ON" : "Simulate outage"}
        </button>
        <Btn onClick={() => setModal({ mode: "add", vehicle: EMPTY_VEHICLE })} disabled={!can(role, "vehicles", "create")} title="Your role can't add vehicles"><Plus size={15} /> Add Vehicle</Btn>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14, fontSize: 12, color: C.dim }}>
        <Wifi size={13} color={error ? C.red : loading ? C.amber : C.green} />
        {error ? "Disconnected from fleet service" : loading ? "Fetching from fleet service…" : `Live · ${vehicles.length} vehicles loaded from API`}
      </div>

      {error ? (
        <div style={{ background: C.panel, border: `1px solid ${C.red}55`, borderRadius: 14, padding: 32, textAlign: "center" }}>
          <AlertCircle size={32} color={C.red} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Couldn’t load vehicles</div>
          <div style={{ color: C.dim, fontSize: 13, marginBottom: 16 }}>{error}</div>
          <Btn onClick={load}><RefreshCw size={15} /> Retry</Btn>
        </div>
      ) : (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ color: C.dim, textAlign: "left", background: C.panel2 }}>
                {["ID", "Vehicle", "Status", "Driver", "Odometer", "Power", "Cost/mo", ""].map((h) => <th key={h} style={{ padding: "12px 14px", fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : rows.map((v) => (
                  <tr key={v.id} style={{ borderTop: `1px solid ${C.border}`, cursor: "pointer", opacity: busyId === v.id ? .5 : 1 }}
                    onClick={() => onOpen(v.id)}
                    onMouseOver={(e) => e.currentTarget.style.background = C.panel2}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: C.accent2 }}>{v.id}</td>
                    <td style={{ padding: "12px 14px" }}>{v.year} {v.make} {v.model}<div style={{ color: C.dim, fontSize: 11 }}>{v.vin}</div></td>
                    <td style={{ padding: "12px 14px" }}><Badge color={STATUS_COLOR[v.status]}>{v.status}</Badge></td>
                    <td style={{ padding: "12px 14px" }}>{driverName(v.driverId)}</td>
                    <td style={{ padding: "12px 14px" }}>{v.odometer.toLocaleString()} mi</td>
                    <td style={{ padding: "12px 14px" }}>{v.fuelType}</td>
                    <td style={{ padding: "12px 14px" }}>${v.monthlyCost}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                      {busyId === v.id
                        ? <Loader size={15} color={C.dim} style={{ animation: "fleetSpin 1s linear infinite" }} />
                        : <>
                            <Btn variant="icon" onClick={() => onOpen(v.id)}><Eye size={15} color={C.accent2} /></Btn>
                            <Btn variant="icon" onClick={() => setModal({ mode: "edit", vehicle: v })} disabled={!can(role, "vehicles", "edit")} title="Your role can't edit vehicles"><Pencil size={15} /></Btn>
                            <Btn variant="icon" onClick={() => deleteVehicle(v.id)} disabled={!can(role, "vehicles", "delete")} title="Your role can't delete vehicles"><Trash2 size={15} color={C.red} /></Btn>
                          </>}
                    </td>
                  </tr>
                ))}
              {!loading && rows.length === 0 && <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", color: C.dim }}>No vehicles match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Vehicle" : `Edit ${modal.vehicle.id}`} onClose={() => !saving && setModal(null)}>
          <VehicleForm initial={modal.vehicle} drivers={drivers} saving={saving}
            onSave={(f) => saveVehicle(f, modal.mode)}
            onClose={() => setModal(null)} />
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* --------------------------- Vehicle detail --------------------------- */

function DetailStat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: .3 }}>{icon}{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 5 }}>{value}</div>
    </div>
  );
}

function VehicleDetail({ vehicleId, state, dispatch, onBack, role }: {
  vehicleId: string; state: AppState; dispatch: AppDispatch; onBack: () => void; role: RoleKey;
}) {
  const v = state.vehicles.find((x) => x.id === vehicleId);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const saveEdit = async (f: Vehicle | VehicleDraft) => {
    const vv = f as Vehicle;
    setSaving(true); setErr(null);
    try {
      const updated = await fleetApi.update(vv.id, vv);
      dispatch({ type: "EDIT_VEHICLE", payload: updated });
      setEditing(false);
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };
  const doDelete = async () => {
    if (!v) return;
    setDeleting(true); setErr(null);
    try {
      await fleetApi.remove(v.id);
      dispatch({ type: "DELETE_VEHICLE", payload: v.id });
      onBack();
    } catch (e) { setErr(e instanceof Error ? e.message : "Delete failed"); setDeleting(false); }
  };

  if (!v) {
    return (
      <div>
        <Btn variant="ghost" onClick={onBack}><ArrowLeft size={15} /> Back to vehicles</Btn>
        <div style={{ marginTop: 20, color: C.dim }}>This vehicle no longer exists.</div>
      </div>
    );
  }

  const driver = state.drivers.find((d) => d.id === v.driverId);
  const workOrders = state.maintenance.filter((m) => m.vehicleId === v.id);
  const totalMaint = workOrders.reduce((s, m) => s + m.cost, 0);
  const W = 360, H = 200;
  const minLng = -84.9, maxLng = -80.4, minLat = 38.3, maxLat = 42.0;
  const px = ((v.lng - minLng) / (maxLng - minLng)) * W;
  const py = H - ((v.lat - minLat) / (maxLat - minLat)) * H;

  return (
    <div>
      <style>{`@keyframes fleetSpin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <Btn variant="ghost" onClick={onBack}><ArrowLeft size={15} /> Back to vehicles</Btn>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setEditing(true)} disabled={!can(role, "vehicles", "edit") || deleting} title="Your role can't edit vehicles"><Pencil size={14} /> Edit</Btn>
          <Btn variant="ghost" onClick={doDelete} disabled={!can(role, "vehicles", "delete") || deleting} title="Your role can't delete vehicles">
            {deleting ? <><Loader size={14} style={{ animation: "fleetSpin 1s linear infinite" }} /> Deleting…</> : <><Trash2 size={14} color={C.red} /> Delete</>}
          </Btn>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${C.panel2}, ${C.panel})`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 14, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: C.accent, display: "grid", placeItems: "center" }}><Truck size={30} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{v.year} {v.make} {v.model}</div>
          <div style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>{v.id} · VIN {v.vin}</div>
        </div>
        <Badge color={STATUS_COLOR[v.status]}>{v.status}</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 14 }}>
        <DetailStat icon={<Gauge size={13} />} label="ODOMETER" value={`${v.odometer.toLocaleString()} mi`} />
        <DetailStat icon={<Fuel size={13} />} label="POWERTRAIN" value={v.fuelType} />
        <DetailStat icon={<DollarSign size={13} />} label="MONTHLY COST" value={`$${v.monthlyCost}`} />
        <DetailStat icon={<Wrench size={13} />} label="MAINT. SPEND" value={`$${totalMaint.toLocaleString()}`} />
        <DetailStat icon={<Calendar size={13} />} label="LAST SERVICE" value={v.lastService || "—"} />
        <DetailStat icon={<Calendar size={13} />} label="NEXT SERVICE" value={v.nextService || "—"} />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Users size={16} color={C.accent2} /> Assigned Driver</h4>
            {driver ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: C.accent2, display: "grid", placeItems: "center", fontWeight: 800, color: "#fff" }}>{driver.name.split(" ").map((n) => n[0]).join("")}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{driver.name}</div>
                  <div style={{ color: C.dim, display: "flex", alignItems: "center", gap: 5 }}><Hash size={12} /> {driver.license}</div>
                  <div style={{ color: C.dim, display: "flex", alignItems: "center", gap: 5 }}><Phone size={12} /> {driver.phone}</div>
                </div>
              </div>
            ) : <div style={{ color: C.dim, fontSize: 13 }}>Unassigned</div>}
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={16} color={C.accent} /> Last Known Position</h4>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
              {Array.from({ length: 7 }).map((_, i) => <line key={`v${i}`} x1={i * W / 6} y1={0} x2={i * W / 6} y2={H} stroke={C.border} strokeWidth={.5} />)}
              {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * H / 4} x2={W} y2={i * H / 4} stroke={C.border} strokeWidth={.5} />)}
              <circle cx={px} cy={py} r={18} fill={`${STATUS_COLOR[v.status]}33`} />
              <circle cx={px} cy={py} r={8} fill={STATUS_COLOR[v.status]} stroke="#fff" strokeWidth={2} />
            </svg>
            <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>{v.lat.toFixed(4)}, {v.lng.toFixed(4)}</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Wrench size={16} color={C.amber} /> Service History</h4>
          {workOrders.length ? workOrders.map((m) => (
            <div key={m.id} style={{ borderLeft: `3px solid ${PRIORITY_COLOR[m.priority]}`, background: C.panel2, borderRadius: "0 8px 8px 0", padding: "10px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{m.type}</span>
                <Badge color={m.status === "Completed" ? C.green : m.status === "In Progress" ? C.amber : C.accent2}>{m.status}</Badge>
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>{m.id} · opened {m.opened} · ${m.cost}</div>
            </div>
          )) : <div style={{ color: C.dim, fontSize: 13 }}>No work orders on record.</div>}
        </div>
      </div>

      {editing && (
        <Modal title={`Edit ${v.id}`} onClose={() => !saving && setEditing(false)}>
          <VehicleForm initial={v} drivers={state.drivers} saving={saving}
            onSave={saveEdit}
            onClose={() => setEditing(false)} />
        </Modal>
      )}

      {err && <Toast message={err} onClose={() => setErr(null)} />}
    </div>
  );
}

/* ------------------------------- Drivers ------------------------------ */

const EMPTY_DRIVER: DriverDraft = { name: "", license: "", phone: "", status: "Active" };

type DriverModal = { mode: "add"; driver: DriverDraft } | { mode: "edit"; driver: Driver };

function DriverForm({ initial, onSave, onClose }: {
  initial: Driver | DriverDraft; onSave: (f: Driver | DriverDraft) => void; onClose: () => void;
}) {
  const [f, setF] = useState(initial);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  return (
    <>
      <Field label="NAME"><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="LICENSE #"><input style={inputStyle} value={f.license} onChange={(e) => set("license", e.target.value)} /></Field>
      <Field label="PHONE"><input style={inputStyle} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      <Field label="STATUS"><select style={inputStyle} value={f.status} onChange={(e) => set("status", e.target.value as Driver["status"])}><option>Active</option><option>On Leave</option><option>Inactive</option></select></Field>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => { onSave(f); onClose(); }}>Save Driver</Btn>
      </div>
    </>
  );
}

function Drivers({ state, dispatch, role }: { state: AppState; dispatch: AppDispatch; role: RoleKey }) {
  const { drivers, vehicles } = state;
  const [modal, setModal] = useState<DriverModal | null>(null);
  const assignedCount = (id: string) => vehicles.filter((v) => v.driverId === id).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn onClick={() => setModal({ mode: "add", driver: EMPTY_DRIVER })} disabled={!can(role, "drivers", "create")} title="Your role can't add drivers"><Plus size={15} /> Add Driver</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {drivers.map((d) => (
          <div key={d.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: 999, background: C.accent2, display: "grid", placeItems: "center", fontWeight: 800, color: "#fff" }}>{d.name.split(" ").map((n) => n[0]).join("")}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: C.dim }}>{d.id}</div>
                </div>
              </div>
              <Badge color={d.status === "Active" ? C.green : C.amber}>{d.status}</Badge>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: C.dim, lineHeight: 1.9 }}>
              <div>License: <span style={{ color: C.text }}>{d.license}</span></div>
              <div>Phone: <span style={{ color: C.text }}>{d.phone}</span></div>
              <div>Vehicles: <span style={{ color: C.text }}>{assignedCount(d.id)}</span></div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <Btn variant="ghost" small onClick={() => setModal({ mode: "edit", driver: d })} disabled={!can(role, "drivers", "edit")} title="Your role can't edit drivers"><Pencil size={13} /> Edit</Btn>
              <Btn variant="ghost" small onClick={() => dispatch({ type: "DELETE_DRIVER", payload: d.id })} disabled={!can(role, "drivers", "delete")} title="Your role can't remove drivers"><Trash2 size={13} color={C.red} /> Remove</Btn>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "Add Driver" : `Edit ${modal.driver.name}`} onClose={() => setModal(null)}>
          <DriverForm initial={modal.driver}
            onSave={(f) => {
              if (modal.mode === "add") dispatch({ type: "ADD_DRIVER", payload: f as DriverDraft });
              else dispatch({ type: "EDIT_DRIVER", payload: f as Driver });
            }}
            onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------- Maintenance ---------------------------- */

const EMPTY_WO: WorkOrderDraft = { vehicleId: "", type: "", priority: "Medium", status: "Scheduled", opened: new Date().toISOString().slice(0, 10), cost: 0 };
const WO_ICON: Record<WorkOrder["status"], ReactNode> = {
  Completed: <CheckCircle2 size={15} color={C.green} />,
  "In Progress": <Clock size={15} color={C.amber} />,
  Scheduled: <Clock size={15} color={C.accent2} />,
};

type WOModal = { mode: "add"; wo: WorkOrderDraft } | { mode: "edit"; wo: WorkOrder };

function WOForm({ initial, vehicles, onSave, onClose }: {
  initial: WorkOrder | WorkOrderDraft; vehicles: Vehicle[]; onSave: (f: WorkOrder | WorkOrderDraft) => void; onClose: () => void;
}) {
  const [f, setF] = useState(initial);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  return (
    <>
      <Field label="VEHICLE">
        <select style={inputStyle} value={f.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
          <option value="">Select…</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.id} · {v.make} {v.model}</option>)}
        </select>
      </Field>
      <Field label="SERVICE TYPE"><input style={inputStyle} value={f.type} onChange={(e) => set("type", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="PRIORITY"><select style={inputStyle} value={f.priority} onChange={(e) => set("priority", e.target.value as WorkOrder["priority"])}><option>Low</option><option>Medium</option><option>High</option></select></Field></div>
        <div style={{ flex: 1 }}><Field label="STATUS"><select style={inputStyle} value={f.status} onChange={(e) => set("status", e.target.value as WorkOrder["status"])}><option>Scheduled</option><option>In Progress</option><option>Completed</option></select></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="OPENED"><input type="date" style={inputStyle} value={f.opened} onChange={(e) => set("opened", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="COST ($)"><input type="number" style={inputStyle} value={f.cost} onChange={(e) => set("cost", +e.target.value)} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => { onSave(f); onClose(); }}>Save</Btn>
      </div>
    </>
  );
}

function Maintenance({ state, dispatch, role }: { state: AppState; dispatch: AppDispatch; role: RoleKey }) {
  const { maintenance, vehicles } = state;
  const [modal, setModal] = useState<WOModal | null>(null);
  const vLabel = (id: string) => { const v = vehicles.find((x) => x.id === id); return v ? `${v.id} · ${v.make} ${v.model}` : id; };
  const cols: WorkOrder["status"][] = ["Scheduled", "In Progress", "Completed"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn onClick={() => setModal({ mode: "add", wo: EMPTY_WO })} disabled={!can(role, "maintenance", "create")} title="Your role can't create work orders"><Plus size={15} /> New Work Order</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {cols.map((col) => (
          <div key={col} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              {WO_ICON[col]} {col}
              <span style={{ marginLeft: "auto", color: C.dim, fontSize: 12 }}>{maintenance.filter((m) => m.status === col).length}</span>
            </div>
            {maintenance.filter((m) => m.status === col).map((m) => (
              <div key={m.id} style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{m.type}</span>
                  <Badge color={PRIORITY_COLOR[m.priority]}>{m.priority}</Badge>
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>{vLabel(m.vehicleId)}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Opened {m.opened} · ${m.cost}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <Btn variant="icon" onClick={() => setModal({ mode: "edit", wo: m })} disabled={!can(role, "maintenance", "edit")} title="Your role can't edit work orders"><Pencil size={14} /></Btn>
                  <Btn variant="icon" onClick={() => dispatch({ type: "DELETE_WO", payload: m.id })} disabled={!can(role, "maintenance", "delete")} title="Your role can't delete work orders"><Trash2 size={14} color={C.red} /></Btn>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal.mode === "add" ? "New Work Order" : `Edit ${modal.wo.id}`} onClose={() => setModal(null)}>
          <WOForm initial={modal.wo} vehicles={vehicles}
            onSave={(f) => {
              if (modal.mode === "add") dispatch({ type: "ADD_WO", payload: f as WorkOrderDraft });
              else dispatch({ type: "EDIT_WO", payload: f as WorkOrder });
            }}
            onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ----------------------------- Telematics ----------------------------- */

function Telematics({ state }: { state: AppState }) {
  const { vehicles, drivers } = state;
  const active = vehicles.filter((v) => v.status !== "Retired");
  const [sel, setSel] = useState<Vehicle | null>(null);
  const minLng = -84.9, maxLng = -80.4, minLat = 38.3, maxLat = 42.0;
  const W = 640, H = 420;
  const proj = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * W,
    y: H - ((lat - minLat) / (maxLat - minLat)) * H,
  });
  const driverName = (id: string | null) => drivers.find((d) => d.id === id)?.name || "Unassigned";

  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      <div style={{ flex: 2, minWidth: 360, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
        <h4 style={{ margin: "0 0 6px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={16} color={C.accent} /> Live Fleet Positions — Ohio Region</h4>
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>Simulated GPS telemetry · {active.length} units online</div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
          {Array.from({ length: 9 }).map((_, i) => <line key={`v${i}`} x1={i * W / 8} y1={0} x2={i * W / 8} y2={H} stroke={C.border} strokeWidth={.5} />)}
          {Array.from({ length: 7 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * H / 6} x2={W} y2={i * H / 6} stroke={C.border} strokeWidth={.5} />)}
          {active.map((v) => {
            const { x, y } = proj(v.lat, v.lng);
            const isSel = sel?.id === v.id;
            return (
              <g key={v.id} onClick={() => setSel(v)} style={{ cursor: "pointer" }}>
                {isSel && <circle cx={x} cy={y} r={16} fill={`${STATUS_COLOR[v.status]}33`} />}
                <circle cx={x} cy={y} r={7} fill={STATUS_COLOR[v.status]} stroke="#fff" strokeWidth={isSel ? 2 : 1} />
                <text x={x + 11} y={y + 4} fill={C.text} fontSize={11} fontWeight={600}>{v.id}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 240, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 14 }}>Unit Detail</h4>
        {sel ? (
          <div style={{ fontSize: 13, lineHeight: 2 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{sel.id}</div>
            <div style={{ color: C.dim, marginBottom: 10 }}>{sel.year} {sel.make} {sel.model}</div>
            <Badge color={STATUS_COLOR[sel.status]}>{sel.status}</Badge>
            <div style={{ marginTop: 14, color: C.dim }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={14} /> {driverName(sel.driverId)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Gauge size={14} /> {sel.odometer.toLocaleString()} mi</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Fuel size={14} /> {sel.fuelType}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {sel.lat.toFixed(3)}, {sel.lng.toFixed(3)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Wrench size={14} /> Next service {sel.nextService}</div>
            </div>
          </div>
        ) : <div style={{ color: C.dim, fontSize: 13 }}>Tap a unit on the map to see live detail.</div>}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.dim }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}><span style={{ width: 10, height: 10, borderRadius: 99, background: C.green }} /> Active</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 10, height: 10, borderRadius: 99, background: C.amber }} /> In maintenance</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Audit log ----------------------------- */

const ACTION_COLOR: Record<AuditAction, string> = { Created: C.green, Updated: C.accent2, Deleted: C.red };

const fmtVal = (v: unknown): string => (v === null || v === undefined || v === "" ? "∅" : String(v));
const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

function AuditLog({ state }: { state: AppState }) {
  const { audit } = state;
  const [actionF, setActionF] = useState<"All" | AuditAction>("All");
  const [resourceF, setResourceF] = useState("All");
  const [q, setQ] = useState("");

  const rows = audit.filter((e) =>
    (actionF === "All" || e.action === actionF) &&
    (resourceF === "All" || e.resource === resourceF) &&
    `${e.actor} ${e.target} ${e.label}`.toLowerCase().includes(q.toLowerCase())
  );

  const sel: CSSProperties = { ...inputStyle, width: "auto" };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: 11, color: C.dim }} />
          <input placeholder="Search by user, entity, or name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.dim, fontSize: 12 }}><Filter size={14} /> Action</div>
        <select style={sel} value={actionF} onChange={(e) => setActionF(e.target.value as typeof actionF)}>
          <option>All</option><option>Created</option><option>Updated</option><option>Deleted</option>
        </select>
        <select style={sel} value={resourceF} onChange={(e) => setResourceF(e.target.value)}>
          <option>All</option><option>Vehicle</option><option>Driver</option><option>Work Order</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 14, fontSize: 12, color: C.dim }}>
        <span>{audit.length} total events</span>
        {rows.length !== audit.length && <span>· {rows.length} shown</span>}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.dim, fontSize: 14 }}>
            {audit.length === 0 ? "No activity recorded yet. Create, edit, or delete something to see it logged here." : "No events match your filters."}
          </div>
        ) : rows.map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 14, padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, flexShrink: 0, background: `${ACTION_COLOR[e.action]}22`, border: `1px solid ${ACTION_COLOR[e.action]}55`, display: "grid", placeItems: "center" }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: ACTION_COLOR[e.action] }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700 }}>{e.actor}</span>
                <span style={{ fontSize: 11, color: C.dim }}>({e.role})</span>
                <Badge color={ACTION_COLOR[e.action]}>{e.action}</Badge>
                <span style={{ color: C.dim, fontSize: 13 }}>{e.resource}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{e.label}</span>
                <span style={{ fontSize: 11, color: C.dim }}>· {e.target}</span>
              </div>
              {e.changes.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                  {e.changes.map((c: FieldChange, i: number) => (
                    <div key={i} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ color: C.dim, minWidth: 90 }}>{c.field}</span>
                      <span style={{ color: C.red, textDecoration: "line-through", opacity: .8 }}>{fmtVal(c.from)}</span>
                      <ArrowRight size={12} color={C.dim} />
                      <span style={{ color: C.green }}>{fmtVal(c.to)}</span>
                    </div>
                  ))}
                </div>
              )}
              {e.action === "Updated" && e.changes.length === 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: C.dim, fontStyle: "italic" }}>Saved with no field changes</div>
              )}
            </div>
            <div style={{ fontSize: 12, color: C.dim, whiteSpace: "nowrap", flexShrink: 0 }}>{fmtTime(e.ts)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Login & switcher ------------------------- */

function Login({ onPick }: { onPick: (r: RoleKey) => void }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: C.accent, display: "grid", placeItems: "center", fontWeight: 900, color: "#fff", fontSize: 20 }}>C</div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>Costarella Transportation</div>
        </div>
        <div style={{ textAlign: "center", color: C.dim, fontSize: 13, marginBottom: 26 }}>Select a role to sign in (demo)</div>
        <div style={{ display: "grid", gap: 12 }}>
          {(Object.entries(ROLES) as [RoleKey, typeof ROLES[RoleKey]][]).map(([key, r]) => (
            <div key={key} onClick={() => onPick(key)}
              style={{ display: "flex", alignItems: "center", gap: 14, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "border-color .15s, transform .1s" }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 42, height: 42, borderRadius: 999, background: `${r.color}22`, border: `1px solid ${r.color}66`, display: "grid", placeItems: "center" }}><Shield size={20} color={r.color} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: C.dim }}>{r.blurb}</div>
              </div>
              <div style={{ fontSize: 12, color: C.dim }}>{r.sample}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleSwitcher({ role, onChange, onLogout }: {
  role: RoleKey; onChange: (r: RoleKey) => void; onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const r = ROLES[role];
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 9, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: `${r.color}22`, border: `1px solid ${r.color}66`, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, color: r.color }}>{r.sample.split(" ").map((n) => n[0]).join("")}</div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{r.sample}</div>
          <div style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.label}</div>
        </div>
        <ChevronDown size={15} color={C.dim} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, width: 230, zIndex: 40, boxShadow: "0 10px 30px #0008" }}>
          <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, padding: "6px 10px", letterSpacing: .4 }}>SWITCH ROLE</div>
          {(Object.entries(ROLES) as [RoleKey, typeof ROLES[RoleKey]][]).map(([key, rr]) => (
            <div key={key} onClick={() => { onChange(key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "pointer", background: key === role ? C.panel2 : "transparent" }}
              onMouseOver={(e) => e.currentTarget.style.background = C.panel2}
              onMouseOut={(e) => e.currentTarget.style.background = key === role ? C.panel2 : "transparent"}>
              <Shield size={15} color={rr.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{rr.label}</div>
              </div>
              {key === role && <CheckCircle2 size={14} color={rr.color} />}
            </div>
          ))}
          <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "pointer", color: C.red, borderTop: `1px solid ${C.border}`, marginTop: 4 }}
            onMouseOver={(e) => e.currentTarget.style.background = C.panel2}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
            <LogOut size={15} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Sign out</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- App --------------------------------- */

const TITLES: Record<TabId, string> = {
  dashboard: "Fleet Overview", vehicles: "Vehicle Management", drivers: "Driver Roster",
  maintenance: "Maintenance Work Orders", telematics: "Telematics & Tracking", audit: "Audit Log",
};

export default function App() {
  const [role, setRole] = useState<RoleKey | null>(null);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [state, rawDispatch] = useReducer(reducer, {
    ...INITIAL_STATE, drivers: SEED_DRIVERS, maintenance: SEED_MAINTENANCE,
  } as AppState);

  // Keep the current actor in a ref so `dispatch` stays referentially stable
  // (a fresh dispatch each render would retrigger child data-loading effects).
  const actorRef = useRef<{ actor: string; role: string }>({ actor: "System", role: "—" });
  actorRef.current = role ? { actor: ROLES[role].sample, role } : actorRef.current;

  const dispatch = useCallback<AppDispatch>(
    (action) => rawDispatch({ ...action, meta: actorRef.current }),
    []
  );

  // Load the vehicle list once after login so the Dashboard has data even if
  // the user never opens the Vehicles tab. The Vehicles tab still refetches
  // on its own mount; this just primes the shared store up front.
  const primed = useRef(false);
  useEffect(() => {
    if (!role || primed.current) return;
    primed.current = true;
    fleetApi.list()
      .then((data) => rawDispatch({ type: "SYNC_VEHICLES", payload: data }))
      .catch(() => { primed.current = false; }); // allow a later retry if it failed
  }, [role]);

  if (!role) return <Login onPick={(r) => { setRole(r); setTab("dashboard"); }} />;

  const onDetail = Boolean(selectedVehicle) && tab === "vehicles";
  const heading = onDetail ? "Vehicle Detail" : TITLES[tab];
  const goTab = (id: TabId) => { setSelectedVehicle(null); setTab(id); };
  const switchRole = (r: RoleKey) => {
    setRole(r);
    setSelectedVehicle(null);
    if (!canSeeTab(r, tab)) setTab("dashboard");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar tab={tab} setTab={goTab} role={role} isMobile={isMobile} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div style={{
        flex: 1, minWidth: 0, overflowY: "auto", maxHeight: "100vh",
        padding: isMobile ? 14 : 24,
        // Respect the iPhone status-bar / notch safe area so the header isn't
        // pushed under the system clock. env() resolves to 0 on devices without one.
        paddingTop: isMobile ? "calc(14px + env(safe-area-inset-top))" : 24,
      }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} title="Open menu" aria-label="Open menu"
                style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: 9, cursor: "pointer", color: C.text, display: "inline-flex", flexShrink: 0, alignItems: "center", justifyContent: "center" }}>
                <Menu size={20} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, lineHeight: 1.2 }}>{heading}</h2>
              <div style={{ fontSize: 13, color: C.dim }}>Costarella Transportation · demo data</div>
            </div>
          </div>
          <RoleSwitcher role={role} onChange={switchRole} onLogout={() => setRole(null)} />
        </div>
        {tab === "dashboard" && <Dashboard state={state} />}
        {tab === "vehicles" && (onDetail && selectedVehicle
          ? <VehicleDetail vehicleId={selectedVehicle} state={state} dispatch={dispatch} onBack={() => setSelectedVehicle(null)} role={role} />
          : <Vehicles state={state} dispatch={dispatch} onOpen={setSelectedVehicle} role={role} />)}
        {tab === "drivers" && <Drivers state={state} dispatch={dispatch} role={role} />}
        {tab === "maintenance" && <Maintenance state={state} dispatch={dispatch} role={role} />}
        {tab === "telematics" && <Telematics state={state} />}
        {tab === "audit" && <AuditLog state={state} />}
      </div>
    </div>
  );
}
