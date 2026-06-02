import { C } from "../../data";

// NOTE: relies on the `fleetShimmer` keyframe, currently injected by the
// Vehicles component. Stage-4 extraction will hoist that keyframe app-wide.
export function SkeletonRow() {
  return (
    <tr style={{ borderTop: `1px solid ${C.border}` }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 14px" }}>
          <div style={{ height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${C.panel2} 25%, ${C.border} 50%, ${C.panel2} 75%)`, backgroundSize: "200% 100%", animation: "fleetShimmer 1.2s infinite" }} />
        </td>
      ))}
    </tr>
  );
}
