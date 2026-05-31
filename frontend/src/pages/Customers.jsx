import React, { useEffect, useState, useCallback } from 'react';
import { fetchCustomers, createCustomer, deleteCustomer } from '../api/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

/**
 * Customers page — add, list, and delete customers.
 */

const EMPTY_FORM = { full_name: '', email: '', phone: '' };

export default function Customers() {
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts]         = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    fetchCustomers()
      .then((res) => setCustomers(res.data))
      .catch(() => addToast('Failed to load customers', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── toasts ──────────────────────────────────────────────── */
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  /* ── form ────────────────────────────────────────────────── */
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim())                                    errs.full_name = 'Name is required';
    if (!form.email.trim())                                        errs.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))      errs.email     = 'Enter a valid email';
    if (!form.phone.trim())                                        errs.phone     = 'Phone is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createCustomer({
        full_name: form.full_name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
      });
      addToast(`Customer "${form.full_name}" added`);
      setModalOpen(false);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to add customer';
      addToast(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete customer "${c.full_name}"?`)) return;
    try {
      await deleteCustomer(c.id);
      addToast(`Customer "${c.full_name}" deleted`);
      load();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  /* ── filtered list ───────────────────────────────────────── */
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

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
            placeholder="Search customers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{search ? 'No customers match your search.' : 'No customers yet. Add one!'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Modal ───────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        title="New Customer"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : 'Add Customer'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="cust-name">Full Name</label>
          <input id="cust-name" className={`form-control ${errors.full_name ? 'error' : ''}`} placeholder="e.g. Arjun Mehta" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          {errors.full_name && <span className="form-error">{errors.full_name}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="cust-email">Email Address</label>
          <input id="cust-email" type="email" className={`form-control ${errors.email ? 'error' : ''}`} placeholder="arjun@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="cust-phone">Phone Number</label>
          <input id="cust-phone" className={`form-control ${errors.phone ? 'error' : ''}`} placeholder="+91-9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
        </div>
      </Modal>
    </>
  );
}
