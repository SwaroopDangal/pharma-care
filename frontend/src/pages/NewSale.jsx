import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";

export default function NewSale() {
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchMed, setSearchMed] = useState("");
  const [medResults, setMedResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/customers").then((r) => setCustomers(r.data));
    api.get("/medicines").then((r) => setMedicines(r.data));
  }, []);

  useEffect(() => {
    if (searchMed.trim().length < 1) {
      setMedResults([]);
      return;
    }
    const q = searchMed.toLowerCase();
    setMedResults(
      medicines
        .filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            (m.generic_name || "").toLowerCase().includes(q),
        )
        .slice(0, 8),
    );
  }, [searchMed, medicines]);

  const addToCart = (med) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.medicine_id === med.id);
      if (exists)
        return prev.map((i) =>
          i.medicine_id === med.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [
        ...prev,
        {
          medicine_id: med.id,
          name: med.name,
          dosage: med.dosage,
          unit: med.unit,
          unit_price: parseFloat(med.selling_price),
          quantity: 1,
          max: med.quantity_in_stock,
        },
      ];
    });
    setSearchMed("");
    setMedResults([]);
  };

  const updateQty = (id, qty) => {
    const q = parseInt(qty);
    if (isNaN(q) || q < 1) return;
    setCart((prev) =>
      prev.map((i) =>
        i.medicine_id === id ? { ...i, quantity: Math.min(q, i.max) } : i,
      ),
    );
  };

  const removeItem = (id) =>
    setCart((prev) => prev.filter((i) => i.medicine_id !== id));

  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const total = subtotal - parseFloat(discount || 0) + parseFloat(tax || 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/sales", {
        customer_id: customer || null,
        items: cart.map((i) => ({
          medicine_id: i.medicine_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        discount: parseFloat(discount || 0),
        tax: parseFloat(tax || 0),
        payment_method: paymentMethod,
        prescription_number: prescription,
        notes,
      });
      toast.success(`Sale ${data.invoice_number} completed!`);
      navigate("/sales");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error processing sale");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">New Sale</h1>
        <p className="text-slate-500 text-sm">Create a new sales transaction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Search + Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Medicine Search */}
          <div className="card">
            <label className="label">Search Medicine</label>
            <div className="relative">
              <input
                className="input-field pr-10"
                placeholder="Type medicine name..."
                value={searchMed}
                onChange={(e) => setSearchMed(e.target.value)}
                autoComplete="off"
              />
              <svg
                className="w-4 h-4 absolute right-3 top-2.5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {medResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {medResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addToCart(m)}
                      disabled={m.quantity_in_stock === 0}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left disabled:opacity-40 disabled:cursor-not-allowed border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {m.dosage} · {m.category_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-indigo-600">
                          ${parseFloat(m.selling_price).toFixed(2)}
                        </div>
                        <div
                          className={`text-xs ${m.quantity_in_stock <= m.reorder_level ? "text-red-500" : "text-slate-400"}`}
                        >
                          {m.quantity_in_stock} left
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                Cart ({cart.length} items)
              </h2>
            </div>
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <svg
                  className="w-10 h-10 mx-auto mb-2 text-slate-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-sm">Search and add medicines above</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {cart.map((item) => (
                  <div
                    key={item.medicine_id}
                    className="px-6 py-3 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.dosage} · ${item.unit_price.toFixed(2)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQty(item.medicine_id, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <input
                        type="number"
                        className="w-12 text-center text-sm border border-slate-300 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQty(item.medicine_id, e.target.value)
                        }
                        min="1"
                        max={item.max}
                      />
                      <button
                        onClick={() =>
                          updateQty(item.medicine_id, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <svg
                          className="w-3 h-3"
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
                      </button>
                    </div>
                    <div className="w-20 text-right font-semibold text-sm text-slate-900">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.medicine_id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sale Details */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Sale Details</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Customer</label>
                <select
                  className="input-field"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `· ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  className="input-field"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="mobile">Mobile Payment</option>
                </select>
              </div>
              <div>
                <label className="label">Prescription #</label>
                <input
                  className="input-field"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-24 text-right py-1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Tax ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field w-24 text-right py-1"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-indigo-700">
                  ${Math.max(0, total).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || cart.length === 0}
              className="btn-indigo w-full justify-center mt-4 py-3 text-base"
            >
              {saving ? "Processing..." : "✓ Complete Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
