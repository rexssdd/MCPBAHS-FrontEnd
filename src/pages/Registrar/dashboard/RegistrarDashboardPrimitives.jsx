import { useEffect } from "react";
import { API_STATUS } from "../../../hooks/Principal/useDashboard";

export const Card = ({ children, style = {}, className = "", testId }) => (
  <div data-testid={testId} className={`card ${className}`} style={style}>
    {children}
  </div>
);

export const SectionTitle = ({ children, action, onAction }) => (
  <div className="section-title-row">
    <h2 className="section-title">{children}</h2>
    {action && (
      <button className="section-action-btn" onClick={onAction}>
        {action} →
      </button>
    )}
  </div>
);

export const Divider = () => <div className="divider" />;

export const Skel = ({ w = "100%", h = 14, r = 6, mb = 0 }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
);

export const Modal = ({ open, onClose, title, subtitle, size = "md", children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-box modal-box--${size}`}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const Pagination = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <button className="pagination-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
        ← Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`pagination-btn${page === p ? " active" : ""}`}
          onClick={() => setPage(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="pagination-btn"
        onClick={() => setPage((p) => p + 1)}
        disabled={page === totalPages}
      >
        Next →
      </button>
    </div>
  );
};

export const ApiStatusBar = ({ status, onRetry }) => {
  const configs = {
    [API_STATUS.LOADING]: { label: "Connecting to server…", bg: "#f4f6f4", color: "#6b7c6b", dot: "#9aaa9a", pulsing: true },
    [API_STATUS.CONNECTED]: { label: "Live data", bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", pulsing: false },
    [API_STATUS.FALLBACK]: { label: "Offline — sample data", bg: "#fefce8", color: "#a16207", dot: "#eab308", pulsing: false },
    [API_STATUS.ERROR]: { label: "Server unreachable", bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444", pulsing: false },
  };
  const cfg = configs[status] || configs[API_STATUS.FALLBACK];
  return (
    <div
      data-testid="api-status-bar"
      data-status={status}
      className="api-status-bar"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.dot}33` }}
    >
      <span
        className="api-status-dot"
        style={{
          background: cfg.dot,
          animation: cfg.pulsing ? "db-pulse 1.4s ease-in-out infinite" : "none",
        }}
      />
      <span style={{ flex: 1 }}>
        <strong>{cfg.label}</strong>
      </span>
      {(status === API_STATUS.FALLBACK || status === API_STATUS.ERROR) && (
        <button
          data-testid="api-retry-btn"
          onClick={onRetry}
          className="api-retry-btn"
          style={{ color: cfg.color, border: `1px solid ${cfg.color}66` }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export const Toast = ({ toast, onDismiss }) => {
  if (!toast) return null;
  const bg = toast.type === "error" ? "#dc2626" : toast.type === "warn" ? "#d97706" : "#1a5c1a";
  return (
    <div
      data-testid="toast"
      onClick={onDismiss}
      className="toast"
      style={{ background: bg, boxShadow: `0 8px 24px ${bg}55` }}
    >
      {toast.type === "error" ? "✕" : "✓"} {toast.message}
    </div>
  );
};

export const StatCard = ({
  label,
  value,
  sub,
  subColor = "#1a5c1a",
  tag,
  tagColor,
  loading,
}) => (
  <Card className="stat-card">
    <span className="stat-label">{label}</span>
    {loading ? (
      <>
        <Skel h={36} w="60%" r={8} mb={4} />
        <Skel h={12} w="80%" />
      </>
    ) : (
      <>
        <span className="stat-value">{value}</span>
        {sub && (
          <span className="stat-sub" style={{ color: subColor }}>
            {sub}
          </span>
        )}
        {tag && (
          <span className="stat-tag" style={{ color: tagColor, background: `${tagColor}14` }}>
            {tag}
          </span>
        )}
      </>
    )}
  </Card>
);
