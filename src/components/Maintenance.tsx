import { useState, type ReactNode } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";

import type { AppState, AppDispatch, Vehicle, WorkOrder, WorkOrderDraft, RoleKey } from "../types";
import { C, PRIORITY_COLOR } from "../data";
import { can } from "../roles";
import { inputStyle } from "../styles";
import { Badge } from "./ui/Badge";
import { Btn } from "./ui/Btn";
import { Field } from "./ui/Field";
import { Modal } from "./ui/Modal";

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

export function Maintenance({ state, dispatch, role }: { state: AppState; dispatch: AppDispatch; role: RoleKey }) {
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
