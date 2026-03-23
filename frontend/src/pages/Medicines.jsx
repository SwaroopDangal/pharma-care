import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import Modal from "../components/Modal";

const EMPTY = {
  name: "",
  generic_name: "",
  category_id: "",
  supplier_id: "",
  dosage: "",
  unit: "tablet",
  purchase_price: "",
  selling_price: "",
  quantity_in_stock: "",
  reorder_level: 10,
  expiry_date: "",
  batch_number: "",
  description: "",
  requires_prescription: false,
};

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [searchParams] = useSearchParams();

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (searchParams.get("filter") === "low_stock") params.low_stock = true;
      const { data } = await api.get("/medicines", { params });
      setMedicines(data);
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, searchParams]);

  useEffect(() => {
    fetchMedicines();
    api.get("/categories").then((r) => setCategories(r.data));
    api.get("/suppliers").then((r) => setSuppliers(r.data));
  }, [fetchMedicines]);

  useEffect(() => {
    if (searchParams.get("action") === "add") openAdd();
  }, [searchParams]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  };
  const openEdit = (m) => {
    setEditing(m);
    setForm({
      ...m,
      expiry_date: m.expiry_date ? m.expiry_date.split("T")[0] : "",
      category_id: m.category_id || "",
      supplier_id: m.supplier_id || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/medicines/${editing.id}`, form);
        toast.success("Medicine updated");
      } else {
        await api.post("/medicines", form);
        toast.success("Medicine added");
      }
      setShowModal(false);
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error saving medicine");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success("Medicine deleted");
      fetchMedicines();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getStockBadge = (m) => {
    if (m.quantity_in_stock === 0)
      return <span className="badge-red">Out of Stock</span>;
    if (m.quantity_in_stock <= m.reorder_level)
      return <span className="badge-yellow">Low Stock</span>;
    return <span className="badge-green">In Stock</span>;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicines</h1>
          <p className="text-slate-500 text-sm">
            {medicines.length} medicines in inventory
          </p>
        </div>
        <button className="btn-indigo" onClick={openAdd}>
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
          Add Medicine
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="input-field max-w-xs"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-field max-w-[200px]"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-header">Medicine</th>
                <th className="table-header">Category</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Buy Price</th>
                <th className="table-header">Sell Price</th>
                <th className="table-header">Expiry</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No medicines found
                  </td>
                </tr>
              ) : (
                medicines.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="table-cell">
                      <div className="font-medium text-slate-900">{m.name}</div>
                      {m.generic_name && (
                        <div className="text-xs text-slate-400">
                          {m.generic_name}
                        </div>
                      )}
                      {m.dosage && (
                        <div className="text-xs text-slate-400">{m.dosage}</div>
                      )}
                    </td>
                    <td className="table-cell text-slate-500">
                      {m.category_name || "—"}
                    </td>
                    <td className="table-cell font-mono text-sm">
                      <span
                        className={
                          m.quantity_in_stock <= m.reorder_level
                            ? "text-red-600 font-semibold"
                            : ""
                        }
                      >
                        {m.quantity_in_stock}
                      </span>
                      <span className="text-slate-400 text-xs"> {m.unit}s</span>
                    </td>
                    <td className="table-cell">
                      ${parseFloat(m.purchase_price).toFixed(2)}
                    </td>
                    <td className="table-cell font-semibold text-slate-900">
                      ${parseFloat(m.selling_price).toFixed(2)}
                    </td>
                    <td className="table-cell text-xs">
                      {m.expiry_date
                        ? new Date(m.expiry_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="table-cell">{getStockBadge(m)}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Medicine" : "Add Medicine"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Medicine Name *</label>
              <input
                className="input-field"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Amoxicillin 500mg"
              />
            </div>
            <div>
              <label className="label">Generic Name</label>
              <input
                className="input-field"
                value={form.generic_name}
                onChange={(e) => set("generic_name", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Dosage</label>
              <input
                className="input-field"
                value={form.dosage}
                onChange={(e) => set("dosage", e.target.value)}
                placeholder="e.g. 500mg"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input-field"
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Supplier</label>
              <select
                className="input-field"
                value={form.supplier_id}
                onChange={(e) => set("supplier_id", e.target.value)}
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select
                className="input-field"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              >
                {[
                  "tablet",
                  "capsule",
                  "syrup",
                  "injection",
                  "cream",
                  "drops",
                  "inhaler",
                  "patch",
                  "sachet",
                  "bottle",
                ].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Batch Number</label>
              <input
                className="input-field"
                value={form.batch_number}
                onChange={(e) => set("batch_number", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Purchase Price ($) *</label>
              <input
                className="input-field"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.purchase_price}
                onChange={(e) => set("purchase_price", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Selling Price ($) *</label>
              <input
                className="input-field"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.selling_price}
                onChange={(e) => set("selling_price", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Stock Quantity *</label>
              <input
                className="input-field"
                type="number"
                min="0"
                required
                value={form.quantity_in_stock}
                onChange={(e) => set("quantity_in_stock", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input
                className="input-field"
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={(e) => set("reorder_level", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input
                className="input-field"
                type="date"
                value={form.expiry_date}
                onChange={(e) => set("expiry_date", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="rx"
                checked={form.requires_prescription}
                onChange={(e) => set("requires_prescription", e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="rx"
                className="text-sm text-slate-700 font-medium"
              >
                Requires Prescription
              </label>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-indigo" disabled={saving}>
              {saving
                ? "Saving..."
                : editing
                  ? "Update Medicine"
                  : "Add Medicine"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
