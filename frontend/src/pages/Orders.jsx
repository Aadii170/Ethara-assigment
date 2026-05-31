import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, createOrder, deleteOrder, fetchProducts, fetchCustomers } from '../api/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

/**
 * Orders page — list existing orders and create new ones.
 * The create-order modal lets you pick a customer, add multiple
 * products with quantities, and see a live-calculated total.
 */

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [products, setProducts]     = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts]         = useState([]);

  // order form state
  const [customerId, setCustomerId] = useState('');
  const [items, setItems]           = useState([{ product_id: '', quantity: 1 }]);
  const [formError, setFormError]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchOrders()
      .then((res) => setOrders(res.data))
      .catch(() => addToast('Failed to load orders', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── toasts ──────────────────────────────────────────────── */
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  /* ── modal open ──────────────────────────────────────────── */
  const openCreate = async () => {
    // prefetch dropdown data
    try {
      const [pRes, cRes] = await Promise.all([fetchProducts(), fetchCustomers()]);
      setProducts(pRes.data);
      setCustomers(cRes.data);
    } catch {
      addToast('Could not load products / customers', 'error');
      return;
    }
    setCustomerId('');
    setItems([{ product_id: '', quantity: 1 }]);
    setFormError('');
    setModalOpen(true);
  };

  /* ── item row management ─────────────────────────────────── */
  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addItemRow = () => setItems((prev) => [...prev, { product_id: '', quantity: 1 }]);

  const removeItemRow = (index) => {
    if (items.length <= 1) return;            // must have at least one item
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── live total ──────────────────────────────────────────── */
  const liveTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === Number(item.product_id));
    if (!product) return sum;
    return sum + Number(product.price) * Number(item.quantity || 0);
  }, 0);

  /* ── submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setFormError('');
    if (!customerId)                         { setFormError('Select a customer');  return; }
    if (items.some((i) => !i.product_id))    { setFormError('Select a product for every line'); return; }
    if (items.some((i) => i.quantity < 1))   { setFormError('Quantity must be at least 1'); return; }

    setSubmitting(true);
    try {
      await createOrder({
        customer_id: Number(customerId),
        items: items.map((i) => ({
          product_id: Number(i.product_id),
          quantity:   Number(i.quantity),
        })),
      });
      addToast('Order placed successfully');
      setModalOpen(false);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to place order';
      addToast(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete ──────────────────────────────────────────────── */
  const handleDelete = async (order) => {
    if (!window.confirm(`Cancel order #${order.id}? Stock will be restored.`)) return;
    try {
      await deleteOrder(order.id);
      addToast(`Order #${order.id} cancelled`);
      load();
    } catch {
      addToast('Cancel failed', 'error');
    }
  };

  return (
    <>
      <Toast toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="page-toolbar">
        <div />
        <button className="btn btn-primary" onClick={openCreate}>+ New Order</button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : orders.length === 0 ? (
        <div className="empty-state"><p>No orders yet.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>#{o.id}</td>
                  <td>{o.customer_name || '—'}</td>
                  <td>₹{Number(o.total_amount).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${o.status === 'pending' ? 'info' : 'success'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => navigate(`/orders/${o.id}`)}>View</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Order Modal ─────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        title="Place New Order"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Placing…' : 'Place Order'}
            </button>
          </>
        }
      >
        {formError && <div style={{ color: 'var(--clr-danger)', marginBottom: 14, fontSize: '.88rem' }}>{formError}</div>}

        {/* Customer selector */}
        <div className="form-group">
          <label htmlFor="order-customer">Customer</label>
          <select
            id="order-customer"
            className="form-control"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">— select customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
            ))}
          </select>
        </div>

        {/* Line items */}
        <label style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'block' }}>
          Order Items
        </label>
        <div className="order-items-list">
          {items.map((item, idx) => (
            <div className="order-item-row" key={idx}>
              <select
                className="form-control"
                value={item.product_id}
                onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
              >
                <option value="">— product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {p.quantity}) — ₹{Number(p.price).toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
              />
              <button
                className="btn-icon"
                title="Remove item"
                onClick={() => removeItemRow(idx)}
                disabled={items.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addItemRow} style={{ marginTop: 6 }}>
            + Add Item
          </button>
        </div>

        <div className="order-total">
          Estimated Total: ₹{liveTotal.toFixed(2)}
        </div>
      </Modal>
    </>
  );
}
