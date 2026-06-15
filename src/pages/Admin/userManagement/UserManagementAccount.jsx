import { useState, useEffect, useCallback, useRef } from "react";
import { validatePasswordStrength } from "../../../utils/inputValidation";
import { LOG_PAGE_SIZE, ACTION_TYPES, ACTION_CONFIG } from "./userManagementConstants.js";
import {
  Overlay, Modal, ModalHeader, ModalBody, ModalFooter,
  EyeIcon, EyeOffIcon, InfoIcon, ShieldIcon, CheckCircleIcon, KeyIcon,
  SearchIcon, FilterIcon, ChevDownIcon, XIcon, RefreshIcon, EmptyLogIcon,
  ActivityIcon, ClockIcon, MonitorIcon, GlobeIcon,
  Pagination,
} from "./UserManagementUIKit.jsx";

/* ════════════════════════════════════════════════════════════
   PASSWORD VALIDATION
   ════════════════════════════════════════════════════════════ */
const PW_RULES = [
  { id: "length",    label: "At least 8 characters",          test: pw => pw.length >= 8 },
  { id: "uppercase", label: "At least one uppercase letter",  test: pw => /[A-Z]/.test(pw) },
  { id: "lowercase", label: "At least one lowercase letter",  test: pw => /[a-z]/.test(pw) },
  { id: "number",    label: "At least one number",            test: pw => /[0-9]/.test(pw) },
  { id: "special",   label: "At least one special character", test: pw => /[^A-Za-z0-9]/.test(pw) },
];

function validatePassword(newPassword, confirmPassword) {
  const errors = {};
  const strengthError = validatePasswordStrength(newPassword, "New password");
  if (strengthError) errors.newPassword = strengthError;
  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm the password.";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

/* ════════════════════════════════════════════════════════════
   PASSWORD UI
   ════════════════════════════════════════════════════════════ */
function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = PW_RULES.filter(r => r.test(password)).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "var(--red-600)", "#d97706", "#2563eb", "#15803d"];
  return (
    <div className="pw-strength">
      <div className="pw-strength__bars">
        {[1,2,3,4].map(i => (
          <div key={i} className="pw-strength__bar"
            style={{ background: i <= passed ? colors[passed] : "#e5e7eb" }}/>
        ))}
      </div>
      <span className="pw-strength__label" style={{ color: colors[passed] }}>{labels[passed]}</span>
    </div>
  );
}

function PasswordChecklist({ password }) {
  return (
    <ul className="pw-checklist">
      {PW_RULES.map(rule => {
        const ok = rule.test(password);
        return (
          <li key={rule.id} className={`pw-checklist__item ${ok ? "pw-checklist__item--ok" : ""}`}>
            <span className="pw-checklist__icon">{ok ? "✓" : "○"}</span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

function PasswordInput({ label, value, onChange, placeholder = "Enter password", error, showChecklist = false }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-input-wrapper">
      {label && <label className="form-label">{label}</label>}
      <div className="pw-input-wrapper">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          maxLength={128}
          required
          aria-invalid={Boolean(error)}
          className={`form-input pw-input${error ? " form-input--error" : ""}`}
        />
        <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)}
          tabIndex={-1} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOffIcon/> : <EyeIcon/>}
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
      {showChecklist && value && <PasswordChecklist password={value}/>}
      {showChecklist && <PasswordStrength password={value}/>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RESET PASSWORD MODAL  (UMSS_002)
   ════════════════════════════════════════════════════════════ */
function ResetPasswordModal({ user, onReset, onCancel }) {
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors,          setErrors]          = useState({});
  const [saving,          setSaving]          = useState(false);
  const [saveErr,         setSaveErr]         = useState("");
  const [success,         setSuccess]         = useState(false);

  const submittingRef = useRef(false);
  const abortRef      = useRef(null);
  useEffect(() => () => { if (abortRef.current) abortRef.current(); }, []);

  const handleSubmit = () => {
    const errs = validatePassword(newPassword, confirmPassword);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    handleConfirm();
  };

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true); setSaveErr("");
    const result = await onReset(user.id, newPassword);
    if (result?.abort) abortRef.current = result.abort;
    submittingRef.current = false;
    setSaving(false);
    if (!result || !result.ok) {
      setSaveErr(result?.error ?? "An unexpected error occurred. Please try again.");
    } else {
      setSuccess(true);
    }
  };

  return (
    <Overlay>
      <div className="modal modal--md">
        <div className="modal-header reset-pw-header">
          <div className="reset-pw-shield"><ShieldIcon/></div>
          <div>
            <span className="modal-header__title">Reset Password</span>
            <p className="reset-pw-subtitle">{user.name} &nbsp;·&nbsp; {user.staffId}</p>
          </div>
        </div>

        {success ? (
          <>
            <div className="modal-body" style={{ textAlign:"center", paddingTop:20, paddingBottom:8 }}>
              <div className="reset-pw-success-icon"><CheckCircleIcon/></div>
              <p className="reset-pw-success-title">Password Reset Successfully</p>
              <p className="reset-pw-success-body">
                The password for <strong>{user.name}</strong> has been updated.
                They will be required to use the new password on next login.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent:"center" }}>
              <button className="btn btn-primary" onClick={onCancel}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-body">
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <PasswordInput label="New Password" value={newPassword}
                  onChange={e=>{ setNewPassword(e.target.value); setErrors(p=>({...p,newPassword:undefined})); setSaveErr(""); }}
                  placeholder="Enter new password" error={errors.newPassword} showChecklist/>
                <PasswordInput label="Confirm Password" value={confirmPassword}
                  onChange={e=>{ setConfirmPassword(e.target.value); setErrors(p=>({...p,confirmPassword:undefined})); setSaveErr(""); }}
                  placeholder="Re-enter new password" error={errors.confirmPassword}/>
                {saveErr && (
                  <div className="reset-pw-api-error"><InfoIcon/><span>{saveErr}</span></div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}
                disabled={saving || !newPassword || !confirmPassword}>
                {saving ? <><div className="spinner"/>Resetting…</> : <><KeyIcon/>Reset Password</>}
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}

/* ════════════════════════════════════════════════════════════
   ACTIVITY LOG HELPERS
   ════════════════════════════════════════════════════════════ */

/** Format an ISO timestamp into a readable local string. */
function formatTimestamp(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Relative time label (e.g. "3 minutes ago"). */
function relativeTime(iso) {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return "";
    const s = Math.floor(diff / 1000);
    if (s < 60)   return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)   return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)   return `${h}h ago`;
    const day = Math.floor(h / 24);
    if (day < 30) return `${day}d ago`;
    return "";
  } catch { return ""; }
}

/** Return the action badge config, with a fallback for unknown types. */
function getActionConfig(action) {
  return ACTION_CONFIG[action] ?? { cls: "log-badge--other", label: action ?? "Unknown" };
}

/* ════════════════════════════════════════════════════════════
   ACTIVITY LOGS SKELETON
   ════════════════════════════════════════════════════════════ */
function ActivityLogsSkeleton({ rows = 8 }) {
  return (
    <div className="al-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="al-skeleton__row">
          <div className="al-skeleton__badge skeleton"/>
          <div className="al-skeleton__body">
            <div className="al-skeleton__line al-skeleton__line--md skeleton"/>
            <div className="al-skeleton__line al-skeleton__line--sm skeleton"/>
          </div>
          <div className="al-skeleton__meta">
            <div className="al-skeleton__line al-skeleton__line--xs skeleton"/>
            <div className="al-skeleton__line al-skeleton__line--xs skeleton"/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ACTIVITY LOG ENTRY
   ════════════════════════════════════════════════════════════ */
function ActivityLogEntry({ log }) {
  const cfg      = getActionConfig(log?.action);
  const rel      = relativeTime(log?.timestamp ?? log?.createdAt);
  const timestamp = formatTimestamp(log?.timestamp ?? log?.createdAt);
  const ip        = log?.ip       ?? log?.ipAddress   ?? null;
  const device    = log?.device   ?? log?.userAgent   ?? null;
  const affected  = log?.affected ?? log?.targetName  ?? log?.recordId ?? null;
  const desc      = log?.description ?? log?.details  ?? null;

  return (
    <div className="al-entry">
      {/* Left: action badge */}
      <div className="al-entry__left">
        <span className={`log-badge ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {/* Centre: description + affected record */}
      <div className="al-entry__body">
        {desc && <p className="al-entry__desc">{desc}</p>}
        {affected && (
          <p className="al-entry__affected">
            <span className="al-entry__affected-label">Record:</span> {affected}
          </p>
        )}
        {!desc && !affected && (
          <p className="al-entry__desc al-entry__desc--muted">{cfg.label} activity recorded</p>
        )}
      </div>

      {/* Right: timestamp + device + IP */}
      <div className="al-entry__meta">
        <span className="al-entry__time" title={timestamp}>
          <ClockIcon/>
          {rel || timestamp}
        </span>
        {device && (
          <span className="al-entry__device" title={device}>
            <MonitorIcon/>
            <span className="al-entry__device-text">{device}</span>
          </span>
        )}
        {ip && (
          <span className="al-entry__ip">
            <GlobeIcon/>{ip}
          </span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ACTIVITY LOGS MODAL  (UMSS_004)
   ════════════════════════════════════════════════════════════ */
function ActivityLogsModal({ user, onFetch, onClose }) {
  /* ── filter state ── */
  const [search,   setSearch]   = useState("");
  const [action,   setAction]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [page,     setPage]     = useState(1);

  /* ── data state ── */
  const [logs,       setLogs]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  // AbortController ref — cancel in-flight requests on filter change / unmount
  const abortRef = useRef(null);

  /* ── active filter count for "clear" affordance ── */
  const activeFilterCount = [action, dateFrom, dateTo, search].filter(Boolean).length;

  /* ── fetch function ── */
  const load = useCallback(async (params) => {
    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    const result = await onFetch(user.id, params, controller.signal);

    // Discard stale results if a newer request has already fired
    if (controller.signal.aborted) return;

    setLoading(false);

    if (!result.ok) {
      if (result.error) setError(result.error);
      return;
    }

    setLogs(result.logs       ?? []);
    setTotal(result.total     ?? 0);
    setTotalPages(result.totalPages ?? 1);
  }, [user.id, onFetch]);

  /* ── initial load & re-fetch on filter / page change ── */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() drives modal list from filters (legacy behavior)
    load({ page, limit: LOG_PAGE_SIZE, action, dateFrom, dateTo, search });
  }, [load, page, action, dateFrom, dateTo, search]);

  /* ── cleanup on unmount ── */
  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  /* ── helpers ── */
  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const handleActionChange = (e) => { setAction(e.target.value); setPage(1); };
  const handleDateFrom     = (e) => { setDateFrom(e.target.value); setPage(1); };
  const handleDateTo       = (e) => { setDateTo(e.target.value); setPage(1); };

  const clearFilters = () => {
    setSearch(""); setAction(""); setDateFrom(""); setDateTo(""); setPage(1);
  };

  const retry = () => {
    setError("");
    load({ page, limit: LOG_PAGE_SIZE, action, dateFrom, dateTo, search });
  };

  /* ── derived ── */
  const isEmpty = !loading && !error && logs.length === 0;

  return (
    <Overlay>
      <div className="modal modal--xl al-modal">

        {/* ── Modal header ── */}
        <div className="al-modal__header">
          <div className="al-modal__header-left">
            <div className="al-modal__icon">
              <ActivityIcon/>
            </div>
            <div>
              <h2 className="al-modal__title">Activity Logs</h2>
              <p className="al-modal__subtitle">
                {user.name}&nbsp;&nbsp;·&nbsp;&nbsp;{user.staffId}&nbsp;&nbsp;·&nbsp;&nbsp;{user.role}
              </p>
            </div>
          </div>
          <button className="al-modal__close" onClick={onClose} aria-label="Close">
            <XIcon/>
          </button>
        </div>

        {/* ── Filters bar ── */}
        <div className="al-filters">
          {/* Search */}
          <div className="al-search-wrapper">
            <SearchIcon/>
            <input
              className="al-search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by description, IP, device…"
            />
            {search && (
              <button className="al-search__clear" onClick={() => { setSearch(""); setPage(1); }}>
                <XIcon/>
              </button>
            )}
          </div>

          {/* Action type */}
          <div className="al-select-wrapper">
            <FilterIcon/>
            <select className="al-select" value={action} onChange={handleActionChange}>
              {ACTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevDownIcon/>
          </div>

          {/* Date from */}
          <div className="al-date-wrapper">
            <label className="al-date-label">From</label>
            <input type="date" className="al-date" value={dateFrom} onChange={handleDateFrom}
              max={dateTo || undefined} aria-label="Activity date from"/>
          </div>

          {/* Date to */}
          <div className="al-date-wrapper">
            <label className="al-date-label">To</label>
            <input type="date" className="al-date" value={dateTo} onChange={handleDateTo}
              min={dateFrom || undefined} aria-label="Activity date to"/>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button className="al-clear-btn" onClick={clearFilters}>
              <XIcon/> Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ""}
            </button>
          )}

          {/* Refresh */}
          <button className="al-refresh-btn" onClick={retry} disabled={loading}
            title="Refresh" aria-label="Refresh logs">
            <span className={loading ? "al-refresh-btn__icon--spinning" : ""}><RefreshIcon/></span>
          </button>
        </div>

        {/* ── Results count ── */}
        {!loading && !error && (
          <div className="al-results-bar">
            <span className="al-results-count">
              {total > 0
                ? `${total} log${total !== 1 ? "s" : ""}${activeFilterCount > 0 ? " matching filters" : ""}`
                : ""}
            </span>
            {total > 0 && (
              <span className="al-results-page">
                Page {page} of {totalPages}
              </span>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div className="al-modal__body">

          {/* Loading skeleton */}
          {loading && <ActivityLogsSkeleton rows={8}/>}

          {/* Error state */}
          {!loading && error && (
            <div className="al-error">
              <div className="al-error__icon"><InfoIcon/></div>
              <p className="al-error__title">Failed to load activity logs</p>
              <p className="al-error__msg">{error}</p>
              <button className="btn btn-outline al-error__retry" onClick={retry}>
                <RefreshIcon/> Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="al-empty">
              <EmptyLogIcon/>
              <p className="al-empty__title">No activity logs found</p>
              <p className="al-empty__body">
                {activeFilterCount > 0
                  ? "No logs match your current filters. Try adjusting the date range or action type."
                  : "This user has no recorded activity yet."}
              </p>
              {activeFilterCount > 0 && (
                <button className="btn btn-outline" style={{ marginTop:12 }} onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Log entries */}
          {!loading && !error && logs.length > 0 && (
            <div className="al-entries">
              {logs.map((log, i) => (
                <ActivityLogEntry key={log?.id ?? log?.logId ?? i} log={log}/>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="al-modal__footer">
            <Pagination page={page} total={total} perPage={LOG_PAGE_SIZE} onChange={setPage}/>
          </div>
        )}
      </div>
    </Overlay>
  );
}

export { ResetPasswordModal, ActivityLogsModal };


