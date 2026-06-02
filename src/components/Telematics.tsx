import { useState } from "react";
import { MapPin, Users, Wrench, Fuel, Gauge } from "lucide-react";

import type { AppState, Vehicle } from "../types";
import { C, STATUS_COLOR } from "../data";
import { Badge } from "./ui/Badge";

export function Telematics({ state }: { state: AppState }) {
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
