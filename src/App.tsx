import {
  useState, useReducer, useEffect, useCallback, useRef,
  type ReactNode,
} from "react";
import {
  Truck, Users, Wrench, MapPin, LayoutDashboard, CheckCircle2,
  Shield, LogOut, Lock, ChevronDown, ScrollText, Menu,
} from "lucide-react";

import type {
  AppState, AppDispatch,
  RoleKey, TabId,
} from "./types";
import {
  SEED_DRIVERS, SEED_MAINTENANCE,
  C,
} from "./data";
import { ROLES, canSeeTab } from "./roles";
import { fleetApi } from "./api";
import { reducer, INITIAL_STATE } from "./reducer";

// Hooks (extracted in Stage 2 of the refactor).
import { useIsMobile } from "./hooks/useIsMobile";
// Shared styles (GlobalStyles injects the app-wide keyframes once).
import { GlobalStyles } from "./styles";
// Feature components (extracted in Stage 3 of the refactor).
import { Dashboard } from "./components/Dashboard";
import { Telematics } from "./components/Telematics";
import { AuditLog } from "./components/AuditLog";
import { Drivers } from "./components/Drivers";
import { Maintenance } from "./components/Maintenance";
import { Vehicles } from "./components/Vehicles";
import { VehicleDetail } from "./components/VehicleDetail";

/* ------------------------------ Sidebar ------------------------------- */

interface NavItem { id: TabId; label: string; icon: ReactNode; }
const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "vehicles", label: "Vehicles", icon: <Truck size={18} /> },
  { id: "drivers", label: "Drivers", icon: <Users size={18} /> },
  { id: "maintenance", label: "Maintenance", icon: <Wrench size={18} /> },
  { id: "telematics", label: "Telematics", icon: <MapPin size={18} /> },
  { id: "audit", label: "Audit Log", icon: <ScrollText size={18} /> },
];

function Sidebar({ tab, setTab, role, isMobile, open, onClose }: {
  tab: TabId; setTab: (t: TabId) => void; role: RoleKey;
  isMobile: boolean; open: boolean; onClose: () => void;
}) {
  const handlePick = (id: TabId, allowed: boolean) => {
    if (!allowed) return;
    setTab(id);
    if (isMobile) onClose();
  };

  const panel = (
    <div style={{
      width: 220, background: C.panel, borderRight: `1px solid ${C.border}`, padding: 18,
      flexShrink: 0, boxSizing: "border-box",
      ...(isMobile
        ? { position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 70, overflowY: "auto",
            paddingTop: "calc(18px + env(safe-area-inset-top))",
            transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform .25s ease",
            boxShadow: open ? "0 0 40px #000a" : "none" }
        : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, padding: "4px 6px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: C.accent, display: "grid", placeItems: "center", fontWeight: 900, color: "#fff" }}>C</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1 }}>Costarella</div>
          <div style={{ fontSize: 11, color: C.dim }}>Transportation</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", background: `${ROLES[role].color}1a`, border: `1px solid ${ROLES[role].color}44`, borderRadius: 9, marginBottom: 18 }}>
        <Shield size={14} color={ROLES[role].color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: ROLES[role].color }}>{ROLES[role].label}</span>
      </div>
      {NAV.map((n) => {
        const allowed = canSeeTab(role, n.id);
        return (
          <div key={n.id} onClick={() => handlePick(n.id, allowed)} title={allowed ? "" : "Not available for your role"}
            style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 9, cursor: allowed ? "pointer" : "not-allowed", marginBottom: 4, fontSize: 14, fontWeight: 600, opacity: allowed ? 1 : .35, color: tab === n.id ? "#fff" : C.dim, background: tab === n.id ? C.accent : "transparent", transition: "background .15s" }}>
            {n.icon}{n.label}
            {!allowed && <Lock size={12} style={{ marginLeft: "auto" }} />}
          </div>
        );
      })}
    </div>
  );

  if (!isMobile) return panel;

  // Mobile: drawer + tap-to-close backdrop.
  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 65 }} />
      )}
      {panel}
    </>
  );
}

/* --------------------------- Login & switcher ------------------------- */

function Login({ onPick }: { onPick: (r: RoleKey) => void }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: C.accent, display: "grid", placeItems: "center", fontWeight: 900, color: "#fff", fontSize: 20 }}>C</div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>Costarella Transportation</div>
        </div>
        <div style={{ textAlign: "center", color: C.dim, fontSize: 13, marginBottom: 26 }}>Select a role to sign in (demo)</div>
        <div style={{ display: "grid", gap: 12 }}>
          {(Object.entries(ROLES) as [RoleKey, typeof ROLES[RoleKey]][]).map(([key, r]) => (
            <div key={key} onClick={() => onPick(key)}
              style={{ display: "flex", alignItems: "center", gap: 14, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "border-color .15s, transform .1s" }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 42, height: 42, borderRadius: 999, background: `${r.color}22`, border: `1px solid ${r.color}66`, display: "grid", placeItems: "center" }}><Shield size={20} color={r.color} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: C.dim }}>{r.blurb}</div>
              </div>
              <div style={{ fontSize: 12, color: C.dim }}>{r.sample}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleSwitcher({ role, onChange, onLogout }: {
  role: RoleKey; onChange: (r: RoleKey) => void; onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const r = ROLES[role];
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 9, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer" }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, background: `${r.color}22`, border: `1px solid ${r.color}66`, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, color: r.color }}>{r.sample.split(" ").map((n) => n[0]).join("")}</div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{r.sample}</div>
          <div style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.label}</div>
        </div>
        <ChevronDown size={15} color={C.dim} />
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)",
          // Anchor left on mobile (the switcher sits near the left edge there);
          // anchor right on desktop. Cap width to the viewport so it never clips.
          ...(isMobile ? { left: 0 } : { right: 0 }),
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6,
          width: 230, maxWidth: "calc(100vw - 28px)", zIndex: 40, boxShadow: "0 10px 30px #0008",
        }}>
          <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, padding: "6px 10px", letterSpacing: .4 }}>SWITCH ROLE</div>
          {(Object.entries(ROLES) as [RoleKey, typeof ROLES[RoleKey]][]).map(([key, rr]) => (
            <div key={key} onClick={() => { onChange(key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "pointer", background: key === role ? C.panel2 : "transparent" }}
              onMouseOver={(e) => e.currentTarget.style.background = C.panel2}
              onMouseOut={(e) => e.currentTarget.style.background = key === role ? C.panel2 : "transparent"}>
              <Shield size={15} color={rr.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{rr.label}</div>
              </div>
              {key === role && <CheckCircle2 size={14} color={rr.color} />}
            </div>
          ))}
          <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "pointer", color: C.red, borderTop: `1px solid ${C.border}`, marginTop: 4 }}
            onMouseOver={(e) => e.currentTarget.style.background = C.panel2}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
            <LogOut size={15} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Sign out</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- App --------------------------------- */

const TITLES: Record<TabId, string> = {
  dashboard: "Fleet Overview", vehicles: "Vehicle Management", drivers: "Driver Roster",
  maintenance: "Maintenance Work Orders", telematics: "Telematics & Tracking", audit: "Audit Log",
};

export default function App() {
  const [role, setRole] = useState<RoleKey | null>(null);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [state, rawDispatch] = useReducer(reducer, {
    ...INITIAL_STATE, drivers: SEED_DRIVERS, maintenance: SEED_MAINTENANCE,
  } as AppState);

  // Keep the current actor in a ref so `dispatch` stays referentially stable
  // (a fresh dispatch each render would retrigger child data-loading effects).
  const actorRef = useRef<{ actor: string; role: string }>({ actor: "System", role: "—" });
  actorRef.current = role ? { actor: ROLES[role].sample, role } : actorRef.current;

  const dispatch = useCallback<AppDispatch>(
    (action) => rawDispatch({ ...action, meta: actorRef.current }),
    []
  );

  // Load the vehicle list once after login so the Dashboard has data even if
  // the user never opens the Vehicles tab. The Vehicles tab still refetches
  // on its own mount; this just primes the shared store up front.
  const primed = useRef(false);
  useEffect(() => {
    if (!role || primed.current) return;
    primed.current = true;
    fleetApi.list()
      .then((data) => rawDispatch({ type: "SYNC_VEHICLES", payload: data }))
      .catch(() => { primed.current = false; }); // allow a later retry if it failed
  }, [role]);

  if (!role) return <Login onPick={(r) => { setRole(r); setTab("dashboard"); }} />;

  const onDetail = Boolean(selectedVehicle) && tab === "vehicles";
  const heading = onDetail ? "Vehicle Detail" : TITLES[tab];
  const goTab = (id: TabId) => { setSelectedVehicle(null); setTab(id); };
  const switchRole = (r: RoleKey) => {
    setRole(r);
    setSelectedVehicle(null);
    if (!canSeeTab(r, tab)) setTab("dashboard");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <GlobalStyles />
      <Sidebar tab={tab} setTab={goTab} role={role} isMobile={isMobile} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div style={{
        flex: 1, minWidth: 0, overflowY: "auto", maxHeight: "100vh",
        padding: isMobile ? 14 : 24,
        // Respect the iPhone status-bar / notch safe area so the header isn't
        // pushed under the system clock. env() resolves to 0 on devices without one.
        paddingTop: isMobile ? "calc(14px + env(safe-area-inset-top))" : 24,
      }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} title="Open menu" aria-label="Open menu"
                style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: 9, cursor: "pointer", color: C.text, display: "inline-flex", flexShrink: 0, alignItems: "center", justifyContent: "center" }}>
                <Menu size={20} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, lineHeight: 1.2 }}>{heading}</h2>
              <div style={{ fontSize: 13, color: C.dim }}>Costarella Transportation · demo data</div>
            </div>
          </div>
          <RoleSwitcher role={role} onChange={switchRole} onLogout={() => setRole(null)} />
        </div>
        {tab === "dashboard" && <Dashboard state={state} />}
        {tab === "vehicles" && (onDetail && selectedVehicle
          ? <VehicleDetail vehicleId={selectedVehicle} state={state} dispatch={dispatch} onBack={() => setSelectedVehicle(null)} role={role} />
          : <Vehicles state={state} dispatch={dispatch} onOpen={setSelectedVehicle} role={role} />)}
        {tab === "drivers" && <Drivers state={state} dispatch={dispatch} role={role} />}
        {tab === "maintenance" && <Maintenance state={state} dispatch={dispatch} role={role} />}
        {tab === "telematics" && <Telematics state={state} />}
        {tab === "audit" && <AuditLog state={state} />}
      </div>
    </div>
  );
}
