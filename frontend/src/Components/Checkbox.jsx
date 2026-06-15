// src/Components/Checkbox.jsx
// Accessible checkbox using a real <input type="checkbox">
// Styled to match the existing design system.

import "../Css/Checkbox.css";

export default function Checkbox({
  checked = false,
  onChange,
  indeterminate = false,
  label,
  id,
  disabled = false,
  className = "",
}) {
  // wire up indeterminate via ref callback
  const refCallback = (el) => {
    if (el) el.indeterminate = indeterminate && !checked;
  };

  return (
    <label className={`cb-label${disabled ? " cb-label--disabled" : ""} ${className}`} htmlFor={id}>
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
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
      </span>
      {label && <span className="cb-text">{label}</span>}
    </label>
  );
}
