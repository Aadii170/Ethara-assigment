import React from 'react';

/**
 * Toast notification component.
 * Renders a stack of temporary messages in the top-right corner.
 *
 * Props:
 *   toasts – array of { id, message, type('success'|'error') }
 *   onClose – called with toast id to dismiss
 */
export default function Toast({ toasts, onClose }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => onClose(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
