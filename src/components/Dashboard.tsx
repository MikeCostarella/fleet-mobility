import { useMemo } from "react";
import {
  Truck, Users, Wrench, Fuel, DollarSign, TrendingUp,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

import type { AppState } from "../types";
import { COST_TREND, C, PIE_COLORS } from "../data";
import { card } from "../styles";
import { StatCard } from "./ui/StatCard";

export function Dashboard({ state }: { state: AppState }) {
  const { vehicles, drivers, maintenance } = state;
  const active = vehicles.filter((v) => v.status === "Active").length;
  const inMaint = vehicles.filter((v) => v.status === "Maintenance").length;
  const monthlyCost = vehicles.reduce((s, v) => s + v.monthlyCost, 0);
  const openWO = maintenance.filter((m) => m.status !== "Completed").length;
  const statusData = (["Active", "Maintenance", "Retired"] as const).map((s) => ({ name: s, value: vehicles.filter((v) => v.status === s).length }));
  const fuelData = useMemo(() => {
    const map: Record<string, number> = {};
    vehicles.forEach((v) => { map[v.fuelType] = (map[v.fuelType] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [vehicles]);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={<Truck size={16} />} label="Total Fleet" value={vehicles.length} sub={`${active} active`} color={C.accent2} />
        <StatCard icon={<Wrench size={16} />} label="In Maintenance" value={inMaint} sub={`${openWO} open work orders`} color={C.amber} />
        <StatCard icon={<DollarSign size={16} />} label="Monthly Cost" value={`$${monthlyCost.toLocaleString()}`} sub="across active fleet" color={C.green} />
        <StatCard icon={<Users size={16} />} label="Drivers" value={drivers.length} sub={`${drivers.filter((d) => d.status === "Active").length} active`} color={C.accent} />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div style={card({ flex: 2, minWidth: 320 })}>
          <h4 style={{ margin: "0 0 14px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={16} color={C.accent} /> Fleet Cost Trend</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={COST_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" stroke={C.dim} fontSize={12} />
              <YAxis stroke={C.dim} fontSize={12} />
              <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Line type="monotone" dataKey="cost" stroke={C.accent} strokeWidth={3} dot={{ fill: C.accent }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={card({ flex: 1, minWidth: 240 })}>
          <h4 style={{ margin: "0 0 14px", fontSize: 14 }}>Fleet by Status</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Legend wrapperStyle={{ fontSize: 12, color: C.dim }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card({ marginTop: 14 })}>
        <h4 style={{ margin: "0 0 14px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Fuel size={16} color={C.accent2} /> Fleet by Powertrain</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={fuelData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" stroke={C.dim} fontSize={12} />
            <YAxis stroke={C.dim} fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="count" fill={C.accent2} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
