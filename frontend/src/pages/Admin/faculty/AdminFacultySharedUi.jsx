/** Shared list / loading UI for admin Faculty & Staff (extracted from the former mega-file). */

export function TableSkeleton({ rows = 6 }) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--gray-200,#e5e7eb)", overflow: "hidden" }}>
      <div className="skeleton-row" style={{ borderBottom: "2px solid var(--gray-100,#f3f4f6)", paddingTop: "16px", paddingBottom: "16px" }}>
        <div className="skeleton skeleton-checkbox" />
        {["80px", "140px", "100px", "90px", "70px", "80px"].map((w, i) => (
          <div key={i} className="skeleton skeleton-cell" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton skeleton-checkbox" />
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton skeleton-cell skeleton-cell--id" />
          <div className="skeleton skeleton-cell skeleton-cell--name" />
          <div className="skeleton skeleton-cell skeleton-cell--role" />
          <div className="skeleton skeleton-cell skeleton-cell--name" />
          <div className="skeleton skeleton-cell skeleton-cell--badge" />
          <div className="skeleton skeleton-cell skeleton-cell--btn" />
        </div>
      ))}
    </div>
  );
}

export function ViewSkeleton() {
  const FieldRow = ({ count = 3 }) => (
    <div className="skeleton-field-grid" style={{ marginBottom: "16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton skeleton-field-label" />
          <div className="skeleton skeleton-field-value" />
        </div>
      ))}
    </div>
  );
  return (
    <div>
      <div className="skeleton-card" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div className="skeleton skeleton-avatar" style={{ width: 72, height: 72, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-cell" style={{ width: "180px", height: "20px", marginBottom: "8px" }} />
          <div className="skeleton skeleton-cell" style={{ width: "100px", height: "14px", marginBottom: "6px" }} />
          <div className="skeleton skeleton-cell" style={{ width: "140px", height: "12px" }} />
        </div>
        <div className="skeleton skeleton-cell skeleton-cell--btn" style={{ marginLeft: "auto" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {[3, 3, 3, 3].map((count, i) => (
          <div className="skeleton-card" key={i}>
            <div className="skeleton skeleton-card-title" style={{ marginBottom: "16px" }} />
            <FieldRow count={count} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApiStatusBanner({ status, error, onRetry }) {
  if (!status) return null;

  const map = {
    fetching: { cls: "fetching", text: "Fetching data from API…" },
    success: { cls: "success", text: "Loaded from API successfully." },
    error: { cls: "error", text: `API unavailable — showing mock data. ${error ?? ""}` },
  };

  const { cls, text } = map[status] ?? {};

  return (
    <div className={`api-status-banner ${cls}`}>
      <span className="api-status-dot" />
      <span>{text}</span>
      {status === "error" && (
        <button type="button" className="retry-btn" onClick={onRetry}>
          ↺ Retry
        </button>
      )}
    </div>
  );
}
