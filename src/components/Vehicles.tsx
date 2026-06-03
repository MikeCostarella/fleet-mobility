import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Pencil, Trash2, Eye, RefreshCw, AlertCircle, Loader, Wifi,
} from "lucide-react";

import type { AppState, AppDispatch, Vehicle, Driver, VehicleDraft, RoleKey } from "../types";
import { C, STATUS_COLOR } from "../data";
import { can } from "../roles";
import { fleetApi, setForceFail, getForceFail } from "../api";
import { useDraft } from "../hooks/useDraft";
import { card } from "../styles";
import { inputStyle } from "../styles";
import { Badge } from "./ui/Badge";
import { Btn } from "./ui/Btn";
import { Field } from "./ui/Field";
import { Modal } from "./ui/Modal";
import { Toast } from "./ui/Toast";
import { SkeletonRow } from "./ui/Skeletons";

export const EMPTY_VEHICLE: VehicleDraft = { make: "", model: "", year: 2024, vin: "", status: "Active", driverId: null, odometer: 0, fuelType: "Gasoline", monthlyCost: 0, lat: 41.0998, lng: -80.6495, lastService: "", nextService: "" };

export function VehicleForm({ initial, drivers, onSave, onClose, saving }: {
  initial: Vehicle | VehicleDraft;
  drivers: Driver[];
  onSave: (form: Vehicle | VehicleDraft) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [f, set] = useDraft(initial);
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

export function Vehicles({ state, dispatch, onOpen, role }: {
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
        <div style={card({ padding: 0, overflow: "hidden", overflowX: "auto" })}>
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
