import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Modal from "../components/Modal";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState({
    start_date: "",
    end_date: "",
    status: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get("/sales", { params });
      setSales(data);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    const { data } = await api.get(`/sales/${id}`);
    setDetail(data);
  };

  const applyFilter = () => {
    const p = {};
    if (filter.start_date) p.start_date = filter.start_date;
    if (filter.end_date) p.end_date = filter.end_date;
    if (filter.status) p.status = filter.status;
    fetchSales(p);
  };

  const statusBadge = (s) => {
    if (s === "completed")
      return <span className="badge-green">Completed</span>;
    if (s === "cancelled") return <span className="badge-red">Cancelled</span>;
    if (s === "refunded") return <span className="badge-yellow">Refunded</span>;
    return <span className="badge-blue">Pending</span>;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-slate-500 text-sm">
            {sales.length} transactions found
          </p>
        </div>
        <button className="btn-indigo" onClick={() => navigate("/new-sale")}>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              className="input-field"
              value={filter.start_date}
              onChange={(e) =>
                setFilter((f) => ({ ...f, start_date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              className="input-field"
              value={filter.end_date}
              onChange={(e) =>
                setFilter((f) => ({ ...f, end_date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input-field"
              value={filter.status}
              onChange={(e) =>
                setFilter((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <button className="btn-indigo" onClick={applyFilter}>
            Apply Filter
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setFilter({ start_date: "", end_date: "", status: "" });
              fetchSales();
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-header">Invoice</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Items</th>
                <th className="table-header">Total</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No sales found
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="table-cell font-mono text-xs text-indigo-600 font-medium">
                      {s.invoice_number}
                    </td>
                    <td className="table-cell">
                      {s.customer_name || (
                        <span className="text-slate-400">Walk-in</span>
                      )}
                    </td>
                    <td className="table-cell text-center">{s.item_count}</td>
                    <td className="table-cell font-semibold">
                      ${parseFloat(s.total_amount).toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span className="badge-blue capitalize">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="table-cell">{statusBadge(s.status)}</td>
                    <td className="table-cell text-slate-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString()}
                      <br />
                      <span className="text-slate-300">
                        {new Date(s.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => openDetail(s.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Invoice: ${detail?.invoice_number}`}
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Customer:</span>{" "}
                <span className="font-medium">
                  {detail.customer_name || "Walk-in"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Staff:</span>{" "}
                <span className="font-medium">{detail.staff_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Payment:</span>{" "}
                <span className="capitalize font-medium">
                  {detail.payment_method}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Date:</span>{" "}
                <span className="font-medium">
                  {new Date(detail.created_at).toLocaleString()}
                </span>
              </div>
              {detail.prescription_number && (
                <div className="col-span-2">
                  <span className="text-slate-500">Prescription #:</span>{" "}
                  <span className="font-medium">
                    {detail.prescription_number}
                  </span>
                </div>
              )}
            </div>
            <table className="w-full border border-slate-100 rounded-lg overflow-hidden text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-header">Medicine</th>
                  <th className="table-header text-right">Qty</th>
                  <th className="table-header text-right">Price</th>
                  <th className="table-header text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {detail.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="table-cell">{item.medicine_name}</td>
                    <td className="table-cell text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="table-cell text-right">
                      ${parseFloat(item.unit_price).toFixed(2)}
                    </td>
                    <td className="table-cell text-right font-medium">
                      ${parseFloat(item.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-sm space-y-1 text-right border-t border-slate-100 pt-3">
              {parseFloat(detail.discount) > 0 && (
                <div className="text-slate-500">
                  Discount: -${parseFloat(detail.discount).toFixed(2)}
                </div>
              )}
              {parseFloat(detail.tax) > 0 && (
                <div className="text-slate-500">
                  Tax: +${parseFloat(detail.tax).toFixed(2)}
                </div>
              )}
              <div className="text-lg font-bold text-slate-900">
                Total: ${parseFloat(detail.total_amount).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
