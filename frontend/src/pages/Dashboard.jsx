import React, { useEffect, useState } from 'react';
import { fetchDashboard } from '../api/api';

/**
 * Dashboard page — shows summary stats + low-stock alerts.
 * Data is fetched once on mount from the /dashboard endpoint.
 */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then((res) => setData(res.data))
      .catch((err) => console.error('Dashboard fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  if (!data) {
    return (
      <div className="empty-state">
        <p>Unable to load dashboard data. Is the backend running?</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          icon="📦"
          color="purple"
          value={data.total_products}
          label="Total Products"
        />
        <StatCard
          icon="👥"
          color="blue"
          value={data.total_customers}
          label="Total Customers"
        />
        <StatCard
          icon="📋"
          color="green"
          value={data.total_orders}
          label="Total Orders"
        />
        <StatCard
          icon="⚠️"
          color="amber"
          value={data.low_stock_products.length}
          label="Low Stock Alerts"
        />
      </div>

      {/* ── Low stock table ────────────────────────────────── */}
      <h3 className="section-title">Low Stock Products</h3>
      {data.low_stock_products.length === 0 ? (
        <div className="empty-state">
          <p>All products are well stocked 🎉</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.low_stock_products.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                  <td><code>{p.sku}</code></td>
                  <td>{p.quantity}</td>
                  <td>
                    <span className={`badge ${p.quantity === 0 ? 'danger' : 'warning'}`}>
                      {p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ── StatCard sub-component ───────────────────────────────────── */
function StatCard({ icon, color, value, label }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}
