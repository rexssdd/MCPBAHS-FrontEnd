/**
 * useFormSubmit.js
 * Generic async-submission hook shared by ALL enrollment forms.
 */

import { useCallback, useReducer } from "react";

// ─── State machine ───────────────────────────────────────────────

/** @typedef {"idle" | "loading" | "success" | "error"} SubmitStatus */

/** @type {{ status: SubmitStatus; error: string|null }} */
const INITIAL_STATE = { status: "idle", error: null }; // ✅ FIXED — was missing entirely

function reducer(_state, action) {
  switch (action.type) {
    case "SUBMIT":  return { status: "loading", error: null };
    case "SUCCESS": return { status: "success", error: null };
    case "FAILURE": return { status: "error",   error: action.error ?? "Unknown error" };
    case "RESET":   return { status: "idle",    error: null }; // ✅ FIXED — was missing; reset dispatched FAILURE before
    default:        return _state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────

/**
 * @template TFormData, TFiles
 * @param {(formData: TFormData, files: TFiles) => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>} submitFn
 * @param {{ onSuccess?: () => void }} [options]
 */
export function useFormSubmit(submitFn, { onSuccess } = {}) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const submit = useCallback(async (formData, files) => {
    dispatch({ type: "SUBMIT" });
    const result = await submitFn(formData, files);
    if (result.ok) {
      dispatch({ type: "SUCCESS" });
      onSuccess?.();
    } else {
      dispatch({ type: "FAILURE", error: result.error });
    }
  }, [submitFn, onSuccess]);

  // 🔁 FIXED — dispatches RESET (→ idle) not FAILURE (→ error with null message)
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    submit,
    submitting: state.status === "loading",
    error:      state.status === "error" ? state.error : null,
    succeeded:  state.status === "success",
    reset,
  };
}