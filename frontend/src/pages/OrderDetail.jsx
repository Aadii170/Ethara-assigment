import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrder } from '../api/api';

/**
 * Order detail view — shows customer info, line items, and total.
 */
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder(id)
      .then((res) => setOrder(res.data))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (error) return <div className="empty-state"><p>{error}</p></div>;
  if (!order) return null;

  return (
    <>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orders')} style={{ marginBottom: 20 }}>
        ← Back to Orders
      </button>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 className="section-title" style={{ marginBottom: 18 }}>Order #{order.id}</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <label>Customer</label>
            <span>{order.customer_name || '—'}</span>
          </div>
          <div className="detail-field">
            <label>Status</label>
            <span>
              <span className={`badge ${order.status === 'pending' ? 'info' : 'success'}`}>{order.status}</span>
            </span>
          </div>
          <div className="detail-field">
            <label>Date</label>
            <span>{new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div className="detail-field">
            <label>Total Amount</label>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <h3 className="section-title">Line Items</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.product_name || '—'}</td>
                <td><code>{item.product_sku || '—'}</code></td>
                <td>₹{Number(item.unit_price).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td style={{ fontWeight: 600 }}>₹{Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
