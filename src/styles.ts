import type { CSSProperties } from "react";
import { C } from "./data";

// Shared form-input styling. Lives here (not inside a component) so that any
// component or form can import it without pulling in a component dependency.
export const inputStyle: CSSProperties = {
  width: "100%",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: C.text,
  fontSize: 14,
  boxSizing: "border-box",
};
