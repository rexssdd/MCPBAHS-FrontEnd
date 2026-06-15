export const Card = ({ children, className = "", style = {} }) => (
  <div className={`card ${className}`} style={style}>
    {children}
  </div>
);

export const STitle = ({ icon, children }) => (
  <div className="section-title">
    {icon && <span className="icon">{icon}</span>}
    {children}
  </div>
);

export const StatCard = ({
  label,
  value,
  sub,
  subColor,
  action,
  accent = "var(--brand-primary)",
  onAction,
}) => (
  <Card className="stat-card">
    <span className="stat-card__label">{label}</span>
    <span className="stat-card__value">{value}</span>
    {sub && (
      <span className="stat-card__sub" style={{ color: subColor || accent }}>
        {sub}
      </span>
    )}
    {action && (
      <button
        className="stat-card__action"
        style={{ color: accent, borderColor: accent }}
        onClick={onAction}
      >
        {action}
      </button>
    )}
  </Card>
);

export const ProgressRow = ({ label, value, max, pct, color, right }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    <span style={{ fontSize: 11, color: "var(--n-500)", width: 56, flexShrink: 0 }}>{label}</span>
    <div className="progress-track" style={{ flex: 1 }}>
      <div
        className="progress-fill"
        style={{ width: `${Math.min(pct ?? (value / max) * 100, 100)}%`, background: color }}
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


