import type { ReactNode } from "react";
import { C } from "../../data";

export function StatCard({ icon, label, value, sub, color }: {
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
