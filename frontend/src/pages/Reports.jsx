import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import api from "../utils/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function Reports() {
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard"),
      api.get("/medicines", { params: { low_stock: true } }),
      api.get("/medicines"),
    ])
      .then(([dash, low, meds]) => {
        setData(dash.data);
        setLowStock(low.data);
        const now = new Date();
        const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        setExpiring(
          meds.data.filter(
            (m) =>
              m.expiry_date &&
              new Date(m.expiry_date) <= in30 &&
              new Date(m.expiry_date) > now,
          ),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const topMedsChart = {
    labels:
      data?.top_medicines?.map((m) =>
        m.name.length > 12 ? m.name.slice(0, 12) + "…" : m.name,
      ) || [],
    datasets: [
      {
        label: "Units Sold (30 days)",
        data: data?.top_medicines?.map((m) => parseInt(m.total_sold)) || [],
        backgroundColor: ["#6366f1"],
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Reports & Analytics
        </h1>
        <p className="text-slate-500 text-sm">
          Overview of pharmacy performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Medicines",
            value: data?.stats?.total_medicines || 0,
            color: "text-slate-900",
          },
          {
            label: "Low Stock Items",
            value: lowStock.length,
            color: "text-amber-600",
          },
          {
            label: "Expiring Soon",
            value: expiring.length,
            color: "text-red-600",
          },
          {
            label: "Today's Sales",
            value: `$${parseFloat(data?.stats?.today_revenue || 0).toFixed(2)}`,
            color: "text-indigo-700",
          },
        ].map((c) => (
          <div key={c.label} className="card text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Medicines */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">
            Top Selling Medicines
          </h2>
          {data?.top_medicines?.length > 0 ? (
            <Bar
              data={topMedsChart}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: { font: { size: 11 }, stepSize: 1 },
                  },
                  x: { grid: { display: false } },
                },
              }}
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              No sales data available
            </div>
          )}
        </div>

        {/* Low Stock Table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Low Stock Alerts</h2>
            <span className="badge-red">{lowStock.length} items</span>
          </div>
          <div className="overflow-y-auto max-h-72">
            {lowStock.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                All stock levels are healthy ✓
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="table-header">Medicine</th>
                    <th className="table-header text-right">Stock</th>
                    <th className="table-header text-right">Reorder At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {lowStock.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="table-cell">
                        <div className="font-medium text-slate-900 text-xs">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {m.category_name}
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <span
                          className={
                            m.quantity_in_stock === 0
                              ? "text-red-600 font-bold"
                              : "text-amber-600 font-semibold"
                          }
                        >
                          {m.quantity_in_stock}
                        </span>
                      </td>
                      <td className="table-cell text-right text-slate-400 text-xs">
                        {m.reorder_level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Expiring Medicines */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            Expiring Within 30 Days
          </h2>
          <span className={expiring.length > 0 ? "badge-red" : "badge-green"}>
            {expiring.length} items
          </span>
        </div>
        {expiring.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No medicines expiring within 30 days ✓
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-header">Medicine</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header">Stock</th>
                  <th className="table-header">Expiry Date</th>
                  <th className="table-header">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expiring.map((m) => {
                  const daysLeft = Math.ceil(
                    (new Date(m.expiry_date) - new Date()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="table-cell font-medium text-slate-900">
                        {m.name}
                      </td>
                      <td className="table-cell text-slate-500">
                        {m.batch_number || "—"}
                      </td>
                      <td className="table-cell">
                        {m.quantity_in_stock} {m.unit}s
                      </td>
                      <td className="table-cell">
                        {new Date(m.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <span
                          className={
                            daysLeft <= 7 ? "badge-red" : "badge-yellow"
                          }
                        >
                          {daysLeft} days
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
