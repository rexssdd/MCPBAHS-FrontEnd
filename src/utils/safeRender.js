/**
 * safeRender.js
 * ─────────────────────────────────────────────────────────────────
 * Guards against React error #31 ("Objects are not valid as a React
 * child"), which happens whenever live API data has a different shape
 * than the mock data it replaces — e.g. a field that used to be a
 * plain string ("Math Department") comes back from the real backend
 * as a relation object ({ uuid: "...", name: "Math Department" }).
 *
 * Use toText() anywhere a value from API data is rendered directly
 * inside JSX (e.g. {toText(t.name)} instead of {t.name}).
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Coerce any value into something safe to render as a React child.
 *
 * - null/undefined            -> fallback
 * - string/number/boolean     -> returned as-is (cast to string for booleans)
 * - { name }, { label }, etc. -> the nested label-like field
 * - array                     -> each item resolved + joined
 * - other object               -> fallback (never dumps raw object/JSON into the UI)
 *
 * @param {*} value
 * @param {string} [fallback="—"]
 * @returns {string|number}
 */
export function toText(value, fallback = "—") {
  if (value === null || value === undefined) return fallback;

  const type = typeof value;
  if (type === "string") return value.trim() ? value : fallback;
  if (type === "number") return Number.isFinite(value) ? value : fallback;
  if (type === "boolean") return String(value);

  if (Array.isArray(value)) {
    const items = value.map((v) => toText(v, "")).filter(Boolean);
    return items.length ? items.join(", ") : fallback;
  }

  if (type === "object") {
    const candidate =
      value.name ?? value.label ?? value.title ?? value.full_name ?? value.fullName;
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    return fallback;
  }

  return fallback;
}

/**
 * Like toText, but for values used as React `key`s or class lookups
 * (e.g. badge status), where we still need a primitive but don't want
 * a translated fallback string showing up in logic comparisons.
 */
export function toKey(value, fallback = "") {
  const text = toText(value, fallback);
  return typeof text === "string" ? text : String(text);
}
