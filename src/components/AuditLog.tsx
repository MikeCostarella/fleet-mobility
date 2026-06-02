import { useState, type CSSProperties } from "react";
import { Search, Filter, ArrowRight } from "lucide-react";

import type { AppState, AuditAction, FieldChange } from "../types";
import { C } from "../data";
import { inputStyle } from "../styles";
import { Badge } from "./ui/Badge";

const ACTION_COLOR: Record<AuditAction, string> = { Created: C.green, Updated: C.accent2, Deleted: C.red };

const fmtVal = (v: unknown): string => (v === null || v === undefined || v === "" ? "∅" : String(v));
const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function AuditLog({ state }: { state: AppState }) {
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
