/** Layout primitives for the Principal dashboard. */
/* ══════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════════ */
export const Card = ({ children, className = "", style = {} }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

export const STitle = ({ icon, children }) => (
  <div className="section-title">
    {icon && <span className="icon">{icon}</span>}
    {children}
  </div>
);

/** Inline shimmer placeholder shown while a value is still null */
export const Skel = ({ w = 80 }) => (
  <span
    className="skeleton"
    style={{ display: "inline-block", width: w, height: "1em", borderRadius: 4 }}
  />
);

export const StatCard = ({
  label, value, sub, subColor,
  action, accent = "var(--brand-primary)", onAction, loading = false,
}) => (
  <Card className="stat-card">
    <span className="stat-card__label">{label}</span>
    <span className="stat-card__value">
      {loading || value == null ? <Skel w={72} /> : value}
    </span>
    {sub && (
      <span className="stat-card__sub" style={{ color: subColor || accent }}>
        {loading ? <Skel w={90} /> : sub}
      </span>
    )}
    {action && (
      <button
        className="stat-card__action"
        style={{ color: accent, borderColor: accent }}
        onClick={onAction}
        disabled={loading}
      >
        {action}
      </button>
    )}
  </Card>
);

export const ProgressRow = ({ label, pct, color, right }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    <span style={{ fontSize: 11, color: "var(--n-500)", width: 56, flexShrink: 0 }}>{label}</span>
    <div className="progress-track" style={{ flex: 1 }}>
      <div
        className="progress-fill"
        style={{ width: `${Math.min(pct ?? 0, 100)}%`, background: color }}
      />
    </div>
    {right && (
      <span
        className="font-mono"
        style={{ fontSize: 11.5, fontWeight: 700, color, width: 38, textAlign: "right" }}
      >
        {right}
      </span>
    )}
  </div>
);