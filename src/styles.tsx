import type { CSSProperties, ReactElement } from "react";
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

// The panel-card surface used throughout the app (dashboards, detail panels,
// list containers). Padding/flex/min-width vary per site, so this is a function
// that merges per-site overrides onto the shared base rather than a fixed const.
export const card = (overrides: CSSProperties = {}): CSSProperties => ({
  background: C.panel,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 18,
  ...overrides,
});

// The "icon + title" section heading used inside cards.
export const sectionHeader: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

// App-wide keyframes, injected once at the root (see <GlobalStyles/> in App).
// Previously each component that animated re-declared these inline; centralizing
// them removes that duplication and the load-order coupling it created.
export function GlobalStyles(): ReactElement {
  return (
    <style>{`
      @keyframes fleetShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      @keyframes fleetSpin { to { transform: rotate(360deg) } }
    `}</style>
  );
}
