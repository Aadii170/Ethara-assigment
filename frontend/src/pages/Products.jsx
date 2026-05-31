import React, { useEffect, useState, useCallback } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

/**
 * Products page — full CRUD with search, modal forms, and toast feedback.
 */

const EMPTY_FORM = { name: '', sku: '', price: '', quantity: '' };

export default function Products() {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);      // null = creating
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts]         = useState([]);

  /* ── data fetching ───────────────────────────────────────── */
  const load = useCallback(() => {
    setLoading(true);
    fetchProducts()
      .then((res) => setProducts(res.data))
      .catch(() => addToast('Failed to load products', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── toast helpers ───────────────────────────────────────── */
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  /* ── form handling ───────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name:     product.name,
      sku:      product.sku,
      price:    String(product.price),
      quantity: String(product.quantity),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())               errs.name     = 'Product name is required';
    if (!form.sku.trim())                errs.sku      = 'SKU is required';
    if (!form.price || Number(form.price) < 0) errs.price = 'Enter a valid price';
    if (form.quantity === '' || Number(form.quantity) < 0) errs.quantity = 'Enter a valid quantity';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      name:     form.name.trim(),
      sku:      form.sku.trim(),
      price:    parseFloat(form.price),
      quantity: parseInt(form.quantity, 10),
    };

    try {
      if (editing) {
        await updateProduct(editing.id, payload);
        addToast(`Product "${payload.name}" updated`);
      } else {
        await createProduct(payload);
        addToast(`Product "${payload.name}" created`);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Operation failed';
      addToast(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      addToast(`Product "${product.name}" deleted`);
      load();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  /* ── filtered list ───────────────────────────────────────── */
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  /* ── render ──────────────────────────────────────────────── */
  return (
    <>
      <Toast toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="page-toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="form-control"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{search ? 'No products match your search.' : 'No products yet. Add one!'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                  <td><code>{p.sku}</code></td>
                  <td>₹{Number(p.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.quantity === 0 ? 'danger' : p.quantity <= 10 ? 'warning' : 'success'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        title={editing ? 'Edit Product' : 'New Product'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="prod-name">Product Name</label>
          <input id="prod-name" className={`form-control ${errors.name ? 'error' : ''}`} placeholder="e.g. Wireless Keyboard" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="prod-sku">SKU / Code</label>
          <input id="prod-sku" className={`form-control ${errors.sku ? 'error' : ''}`} placeholder="e.g. KB-WL-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          {errors.sku && <span className="form-error">{errors.sku}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="prod-price">Price (₹)</label>
          <input id="prod-price" type="number" min="0" step="0.01" className={`form-control ${errors.price ? 'error' : ''}`} placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="prod-qty">Quantity in Stock</label>
          <input id="prod-qty" type="number" min="0" className={`form-control ${errors.quantity ? 'error' : ''}`} placeholder="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          {errors.quantity && <span className="form-error">{errors.quantity}</span>}
        </div>
      </Modal>
    </>
  );
}
