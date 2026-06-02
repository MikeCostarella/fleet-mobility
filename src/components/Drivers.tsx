import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import type { AppState, AppDispatch, Driver, DriverDraft, RoleKey } from "../types";
import { C } from "../data";
import { can } from "../roles";
import { inputStyle } from "../styles";
import { Badge } from "./ui/Badge";
import { Btn } from "./ui/Btn";
import { Field } from "./ui/Field";
import { Modal } from "./ui/Modal";

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

export function Drivers({ state, dispatch, role }: { state: AppState; dispatch: AppDispatch; role: RoleKey }) {
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
