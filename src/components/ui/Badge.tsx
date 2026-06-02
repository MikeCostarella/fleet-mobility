import type { ReactNode } from "react";

export function Badge({ color, children }: { color: string; children: ReactNode }) {
  return <span style={{ color, background: `${color}22`, border: `1px solid ${color}55`, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>;
}
