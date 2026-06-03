import { useState, type ReactNode } from "react";
import {
  Pencil, Trash2, Truck, Users, Wrench, MapPin, Fuel, Gauge,
  DollarSign, ArrowLeft, Calendar, Hash, Phone, Loader,
} from "lucide-react";

import type { AppState, AppDispatch, Vehicle, VehicleDraft, RoleKey } from "../types";
import { C, STATUS_COLOR, PRIORITY_COLOR } from "../data";
import { can } from "../roles";
import { fleetApi } from "../api";
import { projectOhio } from "../lib/geo";
import { card } from "../styles";
import { Badge } from "./ui/Badge";
import { Btn } from "./ui/Btn";
import { Modal } from "./ui/Modal";
import { Toast } from "./ui/Toast";
import { VehicleForm } from "./Vehicles";

function DetailStat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.dim, fontSize: 11, fontWeight: 600, letterSpacing: .3 }}>{icon}{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 5 }}>{value}</div>
    </div>
  );
}

export function VehicleDetail({ vehicleId, state, dispatch, onBack, role }: {
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
  const { x: px, y: py } = projectOhio(v.lat, v.lng, W, H);

  return (
    <div>
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
          <div style={card({ marginBottom: 14 })}>
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

          <div style={card()}>
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

        <div style={card({ flex: 1, minWidth: 280 })}>
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
