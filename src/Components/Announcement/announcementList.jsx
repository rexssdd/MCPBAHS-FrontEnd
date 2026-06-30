/**
 * src/Components/Announcement/announcementList.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Props:
 *   announcements     — array of announcement objects
 *   apiStatus         — "loading" | "success" | "error"
 *   itemsPerPage      — number (default 8)
 *   onRetry()         — retry fetch on error
 *   onView(ann)       — open detail view
 *   onEdit(ann)       — open edit form
 *   onAdd()           — open create form
 *   onDelete(id)      — single delete request (parent opens confirm)
 *   onBulkDelete(ids) — bulk delete request  (parent opens confirm)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// NEW-02 FIX: keys use lowercase to match AnnouncementUrgency enum values
// ("high" | "normal" | "low") returned by the API via $this->urgency.
// Title-case aliases retained so pre-existing mock data still works.
const URGENCY_COLORS = {
  high:   { bar: "#dc2626", bg: "#fef2f2", text: "#b91c1c" },
  normal: { bar: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  low:    { bar: "#16a34a", bg: "#f0fdf4", text: "#14532d" },
  // Legacy Title-case aliases (mock data / old records)
  High:   { bar: "#dc2626", bg: "#fef2f2", text: "#b91c1c" },
  Medium: { bar: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  Low:    { bar: "#16a34a", bg: "#f0fdf4", text: "#14532d" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

// ─── Urgency Pill ─────────────────────────────────────────────────────────────

function UrgencyPill({ urgency }) {
  const c = URGENCY_COLORS[urgency];
  if (!c) return null;
  return (
    <span
      className="ann-urgency-pill"
      style={{ background: c.bg, color: c.text }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: c.bar, flexShrink: 0,
      }}/>
      {urgency}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnouncementList({
  announcements = [],
  apiStatus     = "loading",
  onRetry,
  onView,
  onEdit,
  onAdd,
  onDelete,
  onBulkDelete,
}) {
  const [search,         setSearch]         = useState("");
  const [selected,       setSelected]       = useState([]);
  const [showFilters,    setShowFilters]    = useState(false);
  const [urgencyFilter,  setUrgencyFilter]  = useState("All");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");

  // Click-outside to close filter panel
  const filterRef = useRef(null);
  useEffect(() => {
    if (!showFilters) return;
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilters]);

  // Derived filter options from live data
  const urgencyOptions = useMemo(() =>
    ["All", ...new Set(announcements.map(a => a.urgency).filter(Boolean))],
    [announcements]
  );
  const statusOptions = useMemo(() =>
    ["All", ...new Set(announcements.map(a => a.status).filter(Boolean))],
    [announcements]
  );
  const audienceOptions = useMemo(() =>
    ["All", ...new Set(announcements.map(a => a.target_audience).filter(Boolean))],
    [announcements]
  );

  // Active filter count (for badge)
  const activeFilterCount = [urgencyFilter, statusFilter, audienceFilter]
    .filter(v => v !== "All").length;

  // Filtered list
  const filtered = useMemo(() =>
    announcements.filter((a) => {
      // FIX FE-CNS-02: read correct API field names (message, dissemination_modes, target_audience)
      const modes = Array.isArray(a.dissemination_modes)
        ? a.dissemination_modes.join(" ")
        : (a.dissemination_modes ?? "");
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [a.title, a.message, modes, a.target_audience, a.status, a.urgency]
        .some(v => (v || "").toLowerCase().includes(q));
      return (
        matchesSearch &&
        (urgencyFilter  === "All" || a.urgency         === urgencyFilter) &&
        (statusFilter   === "All" || a.status          === statusFilter) &&
        (audienceFilter === "All" || a.target_audience === audienceFilter)
      );
    }),
    [announcements, search, urgencyFilter, statusFilter, audienceFilter]
  );

  const pageItems = filtered;

  // ── Selection ────────────────────────────────────────────────────────────────

  const toggleOne = (uuid) =>
    setSelected(s => s.includes(uuid) ? s.filter(x => x !== uuid) : [...s, uuid]);

  const allPageSelected =
    pageItems.length > 0 && pageItems.every(a => selected.includes(a.uuid));

  const toggleAllPage = () => {
    if (allPageSelected)
      setSelected(s => s.filter(uuid => !pageItems.some(a => a.uuid === uuid)));
    else
      setSelected(s => [...new Set([...s, ...pageItems.map(a => a.uuid)])]);
  };

  const clearFilters = () => {
    setUrgencyFilter("All");
    setStatusFilter("All");
    setAudienceFilter("All");
  };

  // ── Pagination ───────────────────────────────────────────────────────────────


  // ── Format helpers ────────────────────────────────────────────────────────────

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return isNaN(d)
      ? iso
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="ann-page">

      {/* ── Toolbar ── */}
      <div className="ann-toolbar">

        {/* Search */}
        <div className="ann-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search announcements…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div className="ann-filter-wrap" ref={filterRef}>
          <button
            type="button"
            className="btn-secondary ann-filter-toggle"
            onClick={() => setShowFilters(v => !v)}
          >
            <FilterIcon />
            Filters
            {activeFilterCount > 0 && (
              <span className="ann-filter-badge">{activeFilterCount}</span>
            )}
          </button>

          {showFilters && (
            <div className="ann-filter-panel">
              {/* Urgency */}
              <div className="ann-filter-group">
                <div className="ann-filter-label">Urgency</div>
                <div className="ann-filter-options">
                  {urgencyOptions.map(opt => (
                    <button
                      key={opt} type="button"
                      className={`ann-filter-option${urgencyFilter === opt ? " active" : ""}`}
                      onClick={() => setUrgencyFilter(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="ann-filter-group">
                <div className="ann-filter-label">Status</div>
                <div className="ann-filter-options">
                  {statusOptions.map(opt => (
                    <button
                      key={opt} type="button"
                      className={`ann-filter-option${statusFilter === opt ? " active" : ""}`}
                      onClick={() => setStatusFilter(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div className="ann-filter-group">
                <div className="ann-filter-label">Audience</div>
                <div className="ann-filter-options">
                  {audienceOptions.map(opt => (
                    <button
                      key={opt} type="button"
                      className={`ann-filter-option${audienceFilter === opt ? " active" : ""}`}
                      onClick={() => setAudienceFilter(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <>
                  <hr className="ann-filter-divider" />
                  <div className="ann-filter-actions">
                    <button type="button" className="btn-outline" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="ann-toolbar-spacer" />

        {/* Bulk delete */}
        <button
          className="btn-danger"
          onClick={() => selected.length > 0 && onBulkDelete(selected)}
          disabled={selected.length === 0}
        >
          <TrashIcon />
          {selected.length > 0 ? `Delete (${selected.length})` : "Delete"}
        </button>

        {/* Add */}
        <button className="btn-primary" onClick={onAdd}>
          <PlusIcon /> Add Announcement
        </button>
      </div>

      {/* ── Loading ── */}
      {apiStatus === "loading" && (
        <div className="ann-table-wrapper">
          <div className="ann-state">Loading announcements…</div>
        </div>
      )}

      {/* ── Error ── */}
      {apiStatus === "error" && (
        <div className="ann-table-wrapper">
          <div className="ann-state ann-state--error">
            <p style={{ marginBottom: 12 }}>Failed to load announcements.</p>
            <button className="btn-primary" onClick={onRetry}>Retry</button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {apiStatus === "success" && (
        <>
          {/* Select-all row */}
          {pageItems.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 18px",
              background: "#f9fafb",
              border: "1.5px solid #e5e7eb",
              borderRadius: "12px 12px 0 0",
              borderBottom: "none",
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 600,
            }}>
              <input
                type="checkbox"
                className="ann-checkbox"
                checked={allPageSelected}
                onChange={toggleAllPage}
              />
              {selected.length > 0
                ? `${selected.length} of ${filtered.length} selected`
                : `${filtered.length} announcement${filtered.length !== 1 ? "s" : ""}`}
            </div>
          )}

          <div className="ann-table-wrapper" style={pageItems.length > 0 ? { borderRadius: "0 0 12px 12px" } : {}}>
            {pageItems.length === 0 ? (
              <div className="ann-empty">
                <div>
                  <h2 className="ann-empty-title">
                    {search || activeFilterCount > 0
                      ? "No announcements match your filters."
                      : "No announcements yet."}
                  </h2>
                  <p className="ann-empty-subtitle">
                    {search || activeFilterCount > 0
                      ? "Try adjusting the search or clear filters to see all announcements."
                      : "Create an announcement to send a notice to teachers, students, or parents."}
                  </p>
                </div>

                {/* Sample card — only on truly empty */}
                {!search && activeFilterCount === 0 && (
                  <div className="ann-empty-card">
                    <div className="ann-empty-card-badge">Sample announcement</div>
                    <p className="ann-empty-card-text">
                      "Reminder: Parent-teacher conferences are scheduled for next week.
                      Please submit your final grades by Friday so families receive timely updates."
                    </p>
                    <div className="ann-empty-card-meta">
                      <span className="ann-chip ann-chip--high">High urgency</span>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>Post · All</span>
                    </div>
                  </div>
                )}

                <div className="ann-empty-actions">
                  {search || activeFilterCount > 0 ? (
                    <button className="btn-outline" onClick={() => { setSearch(""); clearFilters(); }}>
                      Clear search &amp; filters
                    </button>
                  ) : (
                    <>
                      <button className="btn-primary" onClick={onAdd}>
                        <PlusIcon /> Add Announcement
                      </button>
                      <Link className="btn-outline" to="/principal/notifications">
                        View notifications
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              pageItems.map((ann) => {
                const urgency = URGENCY_COLORS[ann.urgency] ?? { bar: "#9ca3af", bg: "#f9fafb", text: "#374151" };
                return (
                  <div
                    key={ann.uuid}
                    className={`ann-row${selected.includes(ann.uuid) ? " selected" : ""}`}
                    onClick={() => onView(ann)}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      className="ann-checkbox"
                      checked={selected.includes(ann.uuid)}
                      onChange={() => toggleOne(ann.uuid)}
                      onClick={e => e.stopPropagation()}
                    />

                    {/* Urgency bar */}
                    <div
                      className="ann-urgency-bar"
                      style={{ background: urgency.bar }}
                    />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ann-text">{ann.title || ann.message}</div>
                      {ann.title && (
                        <div className="ann-text-preview">{ann.message}</div>
                      )}
                      <div className="ann-meta">
                        <UrgencyPill urgency={ann.urgency} />
                        <span className="ann-meta-sep" />
                        <span>{ann.target_audience}</span>
                        <span className="ann-meta-sep" />
                        <span>{formatDate(ann.scheduled_at ?? ann.created_at)}</span>
                        {ann.status && (
                          <>
                            <span className="ann-meta-sep" />
                            <span>{ann.status}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ann-actions" onClick={e => e.stopPropagation()}>
                    <button
  type="button"
  title="Edit"
  aria-label="Edit announcement"
  className="btn btn-outline btn-sm ann-action-btn ann-action-btn--edit"
  onClick={e => {
    e.stopPropagation();
    onEdit(ann);
  }}
>
  <EditIcon />
  <span>Edit</span>
</button>

<button
  type="button"
  title="Delete"
  aria-label="Delete announcement"
  className="btn btn-outline btn-sm ann-action-btn ann-action-btn--delete"
  onClick={e => {
    e.stopPropagation();
    onDelete(ann.uuid);
  }}
>
  <TrashIcon />
  <span>Delete</span>
</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── Urgency legend ── */}
      <div className="urgency-legend">
        {/* CNS-FE-02 fix: "medium" is not a valid AnnouncementUrgency enum value.
            The backend uses "high" | "normal" | "low". Changed "medium" → "normal"
            so the legend dot resolves a colour from URGENCY_COLORS correctly. */}
        {[["high", "High Urgency"], ["normal", "Normal Urgency"], ["low", "Low Urgency"]].map(([k, label]) => (
          <div key={k} className="urgency-legend-item">
            <div className={`urgency-dot urgency-dot--${k}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
