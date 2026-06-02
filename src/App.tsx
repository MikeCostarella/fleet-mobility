import {
  useState, useReducer, useEffect, useCallback, useRef,
  type ReactNode,
} from "react";
import {
  Truck, Users, Wrench, MapPin, LayoutDashboard, Plus, Search,
  Pencil, Trash2, Fuel, Gauge, CheckCircle2,
  DollarSign, Eye, ArrowLeft, Calendar, Hash, Phone,
  Shield, LogOut, Lock, ChevronDown, ScrollText,
  RefreshCw, AlertCircle, Loader, Wifi, Menu,
} from "lucide-react";

import type {
  AppState, AppDispatch, Vehicle, Driver, VehicleDraft,
  RoleKey, TabId,
} from "./types";
import {
  SEED_DRIVERS, SEED_MAINTENANCE,
  C, STATUS_COLOR, PRIORITY_COLOR,
} from "./data";
import { ROLES, can, canSeeTab } from "./roles";
import { fleetApi, setForceFail, getForceFail } from "./api";
import { reducer, INITIAL_STATE } from "./reducer";

// Hooks (extracted in Stage 2 of the refactor).
import { useIsMobile } from "./hooks/useIsMobile";
// Shared styles + UI atoms (extracted in Stage 1 of the refactor).
import { inputStyle } from "./styles";
import { Badge } from "./components/ui/Badge";
import { Btn } from "./components/ui/Btn";
import { Field } from "./components/ui/Field";
import { Modal } from "./components/ui/Modal";
import { Toast } from "./components/ui/Toast";
import { SkeletonRow } from "./components/ui/Skeletons";
// Feature components (extracted in Stage 3 of the refactor).
import { Dashboard } from "./components/Dashboard";
import { Telematics } from "./components/Telematics";
import { AuditLog } from "./components/AuditLog";
import { Drivers } from "./components/Drivers";
import { Maintenance } from "./components/Maintenance";

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
  const isMobile = useIsMobile();
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
        <div style={{
          position: "absolute", top: "calc(100% + 6px)",
          // Anchor left on mobile (the switcher sits near the left edge there);
          // anchor right on desktop. Cap width to the viewport so it never clips.
          ...(isMobile ? { left: 0 } : { right: 0 }),
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6,
          width: 230, maxWidth: "calc(100vw - 28px)", zIndex: 40, boxShadow: "0 10px 30px #0008",
        }}>
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
