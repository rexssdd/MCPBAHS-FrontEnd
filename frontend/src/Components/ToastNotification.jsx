// src/Components/ToastNotification.jsx
// Unified toast system — uses CSS variables from tokens.css
// API: toastService.success/error/warning/info(message)

import { useState, useCallback, useEffect } from 'react';
import '../Css/Toast.css';

const TYPES = { SUCCESS: 'success', ERROR: 'error', WARNING: 'warning', INFO: 'info' };
const DURATION = 5000;

const ICONS = {
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  ),
};

function ToastItem({ id, type = TYPES.INFO, message, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    const t = setTimeout(dismiss, DURATION);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <div className={`tn-toast tn-toast--${type}${exiting ? ' tn-toast--out' : ''}`} role="alert" aria-live="polite">
      <span className="tn-icon">{ICONS[type]}</span>
      <span className="tn-msg">{message}</span>
      <button className="tn-close" onClick={dismiss} aria-label="Dismiss notification">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { type, message, id } = e.detail;
      setToasts(prev => [...prev, { id: id ?? Date.now(), type, message }]);
    };
    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, []);

  return (
    <div className="tn-container" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} id={t.id} type={t.type} message={t.message} onDismiss={dismiss} />
      ))}
    </div>
  );
}

const dispatch = (type, message) =>
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { type, message } }));

export const toastService = {
  success: (m) => dispatch(TYPES.SUCCESS, m),
  error:   (m) => dispatch(TYPES.ERROR, m),
  warning: (m) => dispatch(TYPES.WARNING, m),
  info:    (m) => dispatch(TYPES.INFO, m),
};

export default ToastContainer;
