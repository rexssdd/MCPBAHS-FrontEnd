// src/components/ui/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// All reusable UI atoms in one file.
// Import what you need: import { Toast, Modal, DataTable, ... } from "../Components/ui";
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from "react";
import "../../Css/ui.css";

const SAFE_INPUT_TYPES = new Set(["text", "email", "tel", "search", "url", "password"]);

function clampTextValue(value, maxLength) {
  const text = String(value ?? "").replace(/[<>]/g, "");
  return maxLength ? text.slice(0, maxLength) : text;
}

// ══════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════
export function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);
  return (
    <div className="toast">
      <span className="toast-icon">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      <span className="toast-msg">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CHECKBOX — accessible <input type="checkbox">
// ══════════════════════════════════════════════════════
export function Checkbox({ checked, onChange, indeterminate = false, id, label, disabled }) {
  const refCallback = (el) => {
    if (el) el.indeterminate = indeterminate && !checked;
  };
  return (
    <label className={`cb-label${disabled ? " cb-label--disabled" : ""}`} htmlFor={id}>
      <input
        ref={refCallback}
        type="checkbox"
        id={id}
        className="cb-input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-checked={indeterminate && !checked ? "mixed" : checked}
      />
      <span className="cb-box" aria-hidden="true">
        {indeterminate && !checked ? (
          <span className="cb-dash">−</span>
        ) : checked ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
        ) : null}
      </span>
      {label && <span className="cb-text">{label}</span>}
    </label>
  );
}

// ══════════════════════════════════════════════════════
// MODAL
// Props:
//   size       — "sm" | "md" | "lg"
//   onClose    — fn() called on backdrop click
//   children   — modal content
// ══════════════════════════════════════════════════════
export function Modal({ size = "md", onClose, children, className = "", style }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-card modal-card--${size} ${className}`.trim()}
        style={style}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
export function ModalHeader({ icon, iconBg = "#eff6ff", iconColor = "#3b82f6", children }) {
  return (
    <div className="modal-header">
      {icon && (
        <div className="modal-header-icon" style={{ background: iconBg }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">{icon}</svg>
        </div>
      )}
      <span className="modal-title">{children}</span>
    </div>
  );
}
export function ModalBody({ children }) { return <div className="modal-body">{children}</div>; }
export function ModalFooter({ children }) { return <div className="modal-footer">{children}</div>; }

// ══════════════════════════════════════════════════════
// CONFIRM MODAL (destructive actions: delete, archive, logout)
// Props:
//   title, body   — strings
//   confirmLabel  — string (default "Confirm")
//   danger        — bool (red confirm button)
//   icon          — SVG path string
//   iconBg        — css color for icon bg circle
//   onCancel, onConfirm — fn()
// ══════════════════════════════════════════════════════
export function ConfirmModal({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, icon, iconBg = "#fee2e2", onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card modal-card--sm" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal">
          {icon && (
            <div className="confirm-modal-icon" style={{ background: iconBg }}>
              {icon}
            </div>
          )}
          <h3 className="confirm-modal-title">{title}</h3>
          <p className="confirm-modal-body">{body}</p>
          <div className="confirm-modal-foot">
            <button className="btn btn-outline" onClick={onCancel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {cancelLabel}
            </button>
            <button className={`btn ${danger ? "btn-danger-solid" : "btn-primary"}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// BREADCRUMB
// parts = [{ label, onClick? }]  — last item is always the active/green one
// ══════════════════════════════════════════════════════
export function Breadcrumb({ parts }) {
  return (
    <div className="breadcrumb">
      {parts.map((p, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className={isLast ? "breadcrumb-active" : "breadcrumb-link"}
              onClick={!isLast ? p.onClick : undefined}
            >
              {p.label}
            </span>
            {!isLast && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PAGINATION
// Props: page, total, perPage, onChange(newPage)
// ══════════════════════════════════════════════════════
export function Pagination({ page, total, perPage, onChange }) {
  const safePerPage = perPage > 0 ? perPage : 10;

  const totalPages = Math.max(1, Math.ceil(total / safePerPage));

  if (!total || totalPages <= 1) return null;

  const safePage = Math.min(
    Math.max(Number(page) || 1, 1),
    totalPages
  );

  const items = [1];

  if (safePage > 3) items.push("...");

  for (
    let i = Math.max(2, safePage - 1);
    i <= Math.min(totalPages - 1, safePage + 1);
    i++
  ) {
    items.push(i);
  }

  if (safePage < totalPages - 2) items.push("...");

  if (totalPages > 1) items.push(totalPages);

  const handleChange = (p) => {
    const next = Math.min(Math.max(Number(p), 1), totalPages);
    if (next !== safePage) {
      onChange?.(next);
    }
  };

  return (
    <div className="pagination">
      {/* PREVIOUS */}
      <button
        className="pg-btn"
        onClick={() => handleChange(safePage - 1)}
        disabled={safePage === 1}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Previous
      </button>

      {/* NUMBERS */}
      {items.map((item, i) =>
        item === "..." ? (
          <span key={`e-${i}`} className="pg-ellipsis">
            ...
          </span>
        ) : (
          <button
            key={`p-${item}-${i}`}
            className={`pg-btn${safePage === item ? " pg-btn--active" : ""}`}
            onClick={() => handleChange(item)}
          >
            {item}
          </button>
        )
      )}

      {/* NEXT */}
      <button
        className="pg-btn"
        onClick={() => handleChange(safePage + 1)}
        disabled={safePage === totalPages}
      >
        Next
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// SEARCH INPUT
// ══════════════════════════════════════════════════════
export function SearchInput({ value, onChange, placeholder = "Search records..." }) {
  const handleChange = (event) => {
    event.target.value = clampTextValue(event.target.value, 80);
    onChange?.(event);
  };
  return (
    <div className="search-wrap">
      <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        className="search-input"
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={80}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════
// FORM INPUT / SELECT (controlled)
// ══════════════════════════════════════════════════════
export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  required = false,
  maxLength,
  autoComplete,
  inputMode,
  min,
  max,
  ...rest
}) {
  const resolvedMaxLength = maxLength ?? (type === "text" || type === "email" || type === "tel" ? 120 : undefined);
  const handleChange = (event) => {
    if (SAFE_INPUT_TYPES.has(type)) {
      event.target.value = clampTextValue(event.target.value, resolvedMaxLength);
    }
    onChange?.(event);
  };
  return (
    <div>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      <input
        className={`form-input${error ? " form-input--error" : ""}`}
        type={type}
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder || (label ? `Enter ${label.toLowerCase()}` : "Enter value")}
        required={required}
        maxLength={resolvedMaxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  required = false,
}) {
  return (
    <div>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      <select
        className={`form-select${error ? " form-select--error" : ""}`}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        aria-invalid={Boolean(error)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function CountryField({ label = "Country", required = false }) {
  return (
    <div>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      <input
        className="form-input form-input--readonly"
        type="text"
        value="Philippines"
        readOnly
        aria-readonly="true"
      />
    </div>
  );
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Search and select...",
  error,
  required = false,
  disabled = false,
  name,
  allowCustom = true,
}) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputId = `searchable-${name || label || "field"}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const query = value ?? "";
  const normalizedOptions = useMemo(
    () => options.map(option => ({
      label: typeof option === "string" ? option : option.label,
      value: typeof option === "string" ? option : option.value,
    })).filter(option => option.label && option.value),
    [options]
  );
  const selectedIsValid = !query || normalizedOptions.some(option => option.value === query || option.label === query);
  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return normalizedOptions.slice(0, 80);
    return normalizedOptions
      .filter(option => `${option.label} ${option.value}`.toLowerCase().includes(needle))
      .slice(0, 80);
  }, [normalizedOptions, query]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectOption = (option) => {
    onChange?.(option.value);
    setOpen(false);
  };

  const handleInputChange = (event) => {
    const nextValue = clampTextValue(event.target.value, 120);
    onChange?.(nextValue);
    setOpen(true);
    setActiveIndex(0);
  };

  const handleBlur = () => {
    if (!allowCustom && query && !selectedIsValid) {
      onChange?.("");
    }
  };

  const handleKeyDown = (event) => {
    if (!open && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      setOpen(true);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(index => Math.min(index + 1, filteredOptions.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && open && filteredOptions[activeIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    }
  };

  return (
    <div className={`searchable-select${label ? "" : " searchable-select--unlabeled"}`} ref={wrapperRef}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
          {required && <span className="form-required"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`form-input searchable-select__input${error || (!allowCustom && query && !selectedIsValid) ? " form-input--error" : ""}`}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${inputId}-options`}
        aria-autocomplete="list"
        aria-invalid={Boolean(error || (!allowCustom && query && !selectedIsValid))}
      />
      <button
        type="button"
        className="searchable-select__toggle"
        onClick={() => !disabled && setOpen(current => !current)}
        disabled={disabled}
        aria-label={`Toggle ${label || "options"}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && !disabled && (
        <div className="searchable-select__menu" id={`${inputId}-options`} role="listbox">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={`${option.value}-${index}`}
                type="button"
                className={`searchable-select__option${index === activeIndex ? " searchable-select__option--active" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="searchable-select__empty">No matches found.</div>
          )}
        </div>
      )}
      {error && <span className="form-error">{error}</span>}
      {!error && !allowCustom && query && !selectedIsValid && (
        <span className="form-error">Please select a valid option from the list.</span>
      )}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}

export function DataTable({
  columns = [],
  rows = [],
  getRowKey = (r) => r.id,
  emptyText = "No records found.",
  selected,
  onToggleAll,
  onToggleOne,
  onRowClick,
  renderActions,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const allChecked =
    selected &&
    safeRows.length > 0 &&
    safeRows.every((r) => selected.includes(getRowKey(r)));

  const someChecked =
    selected &&
    safeRows.some((r) => selected.includes(getRowKey(r)));

  const hasSelect = Boolean(selected);

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            {hasSelect && (
              <th style={{ width: 48, paddingLeft: 20 }}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={(checked) =>
                    onToggleAll?.(checked, safeRows)
                  }
                />
              </th>
            )}

            {columns.map((col) => (
              <th key={col.key}>
                {col.label}

                {col.sortable !== false && (
                  <svg
                    className="sort-icon"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </th>
            ))}

            {renderActions && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {safeRows.length === 0 ? (
            <tr>
              <td
                colSpan={
                  columns.length +
                  (hasSelect ? 1 : 0) +
                  (renderActions ? 1 : 0)
                }
                style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "var(--gray-400)",
                  fontSize: "14px",
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            safeRows.map((row) => {
              const key = getRowKey(row);

              if (!key) return null;

              const isSelected = selected?.includes(key);

              return (
                <tr
                  key={key}
                  onClick={
                    onRowClick ? () => onRowClick(row) : undefined
                  }
                  style={{
                    cursor: onRowClick ? "pointer" : "default",
                  }}
                >
                  {hasSelect && (
                    <td
                      style={{ paddingLeft: 20 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleOne(key)}
                      />
                    </td>
                  )}

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        col.bold ? "td-bold" : "",
                        col.muted ? "td-muted" : "",
                        col.link ? "td-link" : "",
                      ]
                        .join(" ")
                        .trim()}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}

                  {renderActions && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="td-actions">
                        {renderActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
// ══════════════════════════════════════════════════════
// PAGE LAYOUT WRAPPER
// Wraps sidebar + main content with correct margins.
// ══════════════════════════════════════════════════════
export function PageLayout({ sidebar, children }) {
  return (
    <div className="page-layout">
      {sidebar}
      <main className="page-main">
        <div className="page-body">
          {children}
        </div>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// INFO CARD (for view/detail pages)
// ══════════════════════════════════════════════════════
export function InfoCard({ title, children }) {
  return (
    <div className="info-card">
      <h3 className="info-card-title">{title}</h3>
      <div className="info-card-divider" />
      {children}
    </div>
  );
}
export function InfoField({ label, value }) {
  return (
    <div>
      <p className="info-field-label">{label}</p>
      <p className="info-field-value">{value || "—"}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// STATUS BADGE
// ══════════════════════════════════════════════════════
export function Badge({ status }) {
  const map = {
    Active:      "badge-green",
    Approved:    "badge-green",
    Pending:     "badge-yellow",
    "On Leave":  "badge-yellow",
    Archived:    "badge-gray",
    Disapproved: "badge-red",
    Inactive:    "badge-gray",
  };
  return (
    <span className={`badge ${map[status] ?? "badge-gray"}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}


