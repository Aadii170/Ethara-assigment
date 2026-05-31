import React from 'react';

/**
 * Reusable modal dialog.
 *
 * Props:
 *   isOpen  – boolean visibility flag
 *   title   – modal heading text
 *   onClose – called when the overlay or close button is clicked
 *   footer  – optional JSX rendered in the modal footer
 *   children – body content
 */
export default function Modal({ isOpen, title, onClose, footer, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
