import { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { C } from "../../data";
import { Btn } from "./Btn";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 60, background: C.panel, border: `1px solid ${C.red}66`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, maxWidth: 360, boxShadow: "0 10px 30px #0008" }}>
      <AlertCircle size={18} color={C.red} />
      <span style={{ fontSize: 13, flex: 1 }}>{message}</span>
      <Btn variant="icon" onClick={onClose}><X size={16} /></Btn>
    </div>
  );
}
