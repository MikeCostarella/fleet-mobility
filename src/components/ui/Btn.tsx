import type { ReactNode, CSSProperties } from "react";
import { C } from "../../data";

export type BtnVariant = "primary" | "ghost" | "icon";

export function Btn({ children, onClick, variant = "primary", small, disabled, title }: {
  children: ReactNode; onClick?: () => void; variant?: BtnVariant;
  small?: boolean; disabled?: boolean; title?: string;
}) {
  const styles: Record<BtnVariant, CSSProperties> = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.dim, border: `1px solid ${C.border}` },
    icon: { background: "transparent", color: C.dim, border: "none", padding: 6 },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} title={disabled && title ? title : undefined}
      style={{ ...styles[variant], cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .38 : 1, borderRadius: 8, padding: small ? "6px 12px" : "9px 16px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity .15s" }}
      onMouseOver={(e) => { if (!disabled) e.currentTarget.style.opacity = ".85"; }}
      onMouseOut={(e) => { if (!disabled) e.currentTarget.style.opacity = "1"; }}>
      {children}
    </button>
  );
}
