import type { ReactNode } from "react";
import { C } from "../../data";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label style={{ display: "block", marginBottom: 14 }}><span style={{ display: "block", fontSize: 12, color: C.dim, marginBottom: 5, fontWeight: 600, letterSpacing: .3 }}>{label}</span>{children}</label>;
}
