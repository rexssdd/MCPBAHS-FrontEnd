/**
 * src/Components/Announcement/announcementView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Props:
 *   ann      — announcement object to display
 *   onBack() — navigate back to the list
 * ─────────────────────────────────────────────────────────────────────────────
 */

// NEW-02 FIX: lowercase keys match AnnouncementUrgency enum ("high"|"normal"|"low").
// Title-case aliases kept for mock/legacy data compatibility.
const URGENCY_COLORS = {
  high:   "#dc2626",
  normal: "#f59e0b",
  low:    "#16a34a",
  High:   "#dc2626",
  Medium: "#f59e0b",
  Low:    "#16a34a",
};

// FIX FE-CNS-02: handle full ISO datetime strings (scheduled_at) as well as
// the old separate date+time strings.
function fmtDateLong(isoOrDate, time) {
  if (!isoOrDate) return "N/A";
  // If it already contains a "T" it is a full ISO timestamp — parse directly.
  const d = isoOrDate.includes("T")
    ? new Date(isoOrDate)
    : new Date(isoOrDate + "T00:00:00");
  if (isNaN(d)) return isoOrDate;
  const ds = d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
  // time arg is only used for the legacy date+time split; ignored for full ISO.
  if (!time && !isoOrDate.includes("T")) return ds;
  const timeSource = isoOrDate.includes("T")
    ? d
    : (() => { const t = new Date(`1970-01-01T${time}:00`); return isNaN(t) ? null : t; })();
  if (!timeSource) return ds;
  const ts = timeSource.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }) + " PST";
  return `${ds} ${ts}`;
}

export default function AnnouncementView({ ann }) {
  if (!ann) return null;

  const urgencyColor = URGENCY_COLORS[ann.urgency] ?? "#6b7280";

  const metaRowStyle = {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  };

  const metaValueStyle = {
    color: "#111827",
    fontWeight: 600,
  };

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      overflow: "hidden",
      display: "flex",
    }}>
      {/* Urgency side-bar */}
      <div style={{
        width: 8,
        background: urgencyColor,
        flexShrink: 0,
      }} />

      {/* Body */}
      <div style={{ padding: "28px 32px", flex: 1 }}>
        {/* Announcement text */}
        <p style={{
          fontSize: 14,
          lineHeight: 1.8,
          color: "#111827",
          marginBottom: 24,
          paddingBottom: 24,
          borderBottom: "1px solid #f1f5f9",
        }}>
          {ann.message}
        </p>

        {/* Meta fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={metaRowStyle}>
            Date Created:{" "}
            <span style={metaValueStyle}>{ann.created_at ?? ann.dateCreated ?? "N/A"}</span>
          </div>
          <div style={metaRowStyle}>
            Last Updated:{" "}
            <span style={metaValueStyle}>{ann.updated_at ?? ann.lastUpdated ?? "N/A"}</span>
          </div>
          <div style={metaRowStyle}>
            Urgency:{" "}
            <span style={metaValueStyle}>{ann.urgency}</span>
          </div>
          <div style={metaRowStyle}>
            Mode of dissemination:{" "}
            <span style={metaValueStyle}>{Array.isArray(ann.dissemination_modes) ? ann.dissemination_modes.join(", ") : (ann.dissemination_modes ?? ann.mode ?? "—")}</span>
          </div>
          <div style={metaRowStyle}>
            Target audience:{" "}
            <span style={metaValueStyle}>{ann.target_audience ?? ann.audience}</span>
          </div>
          <div style={metaRowStyle}>
            Date to be disseminated:{" "}
            <span style={metaValueStyle}>{fmtDateLong(ann.scheduled_at ?? ann.date, ann.time)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
