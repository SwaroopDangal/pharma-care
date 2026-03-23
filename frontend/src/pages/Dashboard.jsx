import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import api from "../utils/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

function StatCard({ label, value, sub, icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card flex items-start gap-4 ${onClick ? "cursor-pointer hover:shadow-card-hover transition-shadow" : ""}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const { stats, top_medicines, recent_sales } = data || {};

  const barData = {
    labels:
      top_medicines?.map((m) =>
        m.name.length > 15 ? m.name.slice(0, 15) + "…" : m.name,
      ) || [],
    datasets: [
      {
        label: "Units Sold",
        data: top_medicines?.map((m) => m.total_sold) || [],
        backgroundColor: "rgb(99, 102, 241)",
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={`$${parseFloat(stats?.today_revenue || 0).toFixed(2)}`}
          sub={`${stats?.today_sales || 0} transactions`}
          color="bg-emerald-100 text-emerald-600"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${parseFloat(stats?.monthly_revenue || 0).toFixed(2)}`}
          sub={`${stats?.monthly_sales || 0} sales this month`}
          color="bg-blue-100 text-blue-600"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
        <StatCard
          label="Low Stock Alert"
          value={stats?.low_stock || 0}
          sub="medicines need reorder"
          color="bg-amber-100 text-amber-600"
          onClick={() => navigate("/medicines?filter=low_stock")}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        />
        <StatCard
          label="Expiring Soon"
          value={stats?.expiring_soon || 0}
          sub="within 30 days"
          color="bg-red-100 text-red-600"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
      </div>

      {/* Charts + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4">
            Top Selling Medicines (30 days)
          </h2>
          {top_medicines?.length > 0 ? (
            <Bar
              data={barData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: { font: { size: 11 }, stepSize: 1 },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } },
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No sales data yet
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              {
                label: "New Sale",
                path: "/new-sale",
                color: "bg-indigo-600 text-white hover:bg-indigo-700",
              },
              {
                label: "Add Medicine",
                path: "/medicines?action=add",
                color: "bg-slate-800 text-white hover:bg-slate-900",
              },

              {
                label: "View Reports",
                path: "/reports",
                color:
                  "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
              },
            ].map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${a.color}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Inventory
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Medicines</span>
              <span className="font-semibold text-slate-900">
                {stats?.total_medicines || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Recent Sales</h2>
          <button
            onClick={() => navigate("/sales")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Invoice</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent_sales?.length > 0 ? (
                recent_sales.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="table-cell font-mono text-xs text-indigo-600">
                      {s.invoice_number}
                    </td>
                    <td className="table-cell">
                      {s.customer_name || "Walk-in"}
                    </td>
                    <td className="table-cell font-semibold">
                      ${parseFloat(s.total_amount).toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span className="badge-blue capitalize">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="table-cell text-center text-slate-400 py-8"
                  >
                    No sales yet today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
