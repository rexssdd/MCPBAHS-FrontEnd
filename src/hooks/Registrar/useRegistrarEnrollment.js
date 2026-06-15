/**
 * src/hooks/Registrar/useRegistrarEnrollment.js
 *
 * Custom hook that encapsulates all data-fetching, mutation logic, and
 * UI state for the registrar enrollment page.
 *
 * All-enrollees mode — no section scoping. The registrar sees every
 * enrollee across all sections/grades, same as admin, while retaining
 * approve / reject / add / edit / archive permissions.
 *
 * Fallback behaviour:
 *   When the API is unreachable or not yet configured, the service layer
 *   returns FALLBACK_ENROLLEES automatically and sets `_isFallback: true`.
 *   The hook surfaces this via `apiStatus: "fallback"` so the UI can show
 *   a non-blocking info banner without hiding any content.
 *
 * Exposed state:
 *   enrollees       — full list post-fetch
 *   view            — "list" | "view" | "edit" | "create"
 *   target          — the enrollee currently being viewed/edited
 *   toast           — { message, type } | null
 *   isSaving        — mutation in-flight
 *   apiStatus       — "loading" | "success" | "error" | "fallback"
 *   error           — fetch-level error string | null
 *   mutationError   — last mutation error string | null
 *   isLoading       — true while apiStatus === "loading"
 *
 * Exposed actions:
 *   fetchEnrollees()
 *   goList()
 *   goView(enrollee)
 *   goEdit(enrollee)
 *   goCreate()
 *   handleSave(form)
 *   handleCreate(form)
 *   handleUpdate(form)
 *   handleArchive(ids)
 *   handleApprove(id)
 *   handleReject(id, reason)
 *   dismissMutationError()
 *   dismissToast()
 *   showToast(message, type?)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as registrarEnrollmentService from "../../services/Registrar/registrarEnrollmentService";
import { validateEnrollees, validateEnrollee } from "../../utils/enrollmentValidation";
import { FALLBACK_ENROLLEES } from "../../services/Registrar/registrarEnrollmentService";

/* ═══════════════════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════════════════ */

export function useRegistrarEnrollment() {
  /* ── state ─────────────────────────────────────────────────── */
  const [enrollees,     setEnrollees]     = useState([]);
  const [view,          setView]          = useState("list");   // "list"|"view"|"edit"|"create"
  const [target,        setTarget]        = useState(null);
  const [toast,         setToast]         = useState(null);     // { message, type }
  const [isSaving,      setIsSaving]      = useState(false);
  const [apiStatus,     setApiStatus]     = useState("loading"); // "loading"|"success"|"error"|"fallback"
  const [error,         setError]         = useState(null);
  const [mutationError, setMutationError] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  /* ── toast helper ───────────────────────────────────────────── */
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  /* ── navigation helpers ─────────────────────────────────────── */
  const goList   = useCallback(() => { setView("list");   setTarget(null); setMutationError(null); }, []);
  const goView   = useCallback(e  => { setView("view");   setTarget(e); }, []);
  const goEdit   = useCallback(e  => { setView("edit");   setTarget(e); }, []);
  const goCreate = useCallback(()  => { setView("create"); setTarget(null); }, []);

  /* ── fetch ──────────────────────────────────────────────────── */
  const fetchEnrollees = useCallback(async () => {
    setApiStatus("loading");
    setError(null);

    try {
      const result = await registrarEnrollmentService.listEnrollees();

      if (!isMountedRef.current) return;

      if (result._isFallback) {
        /* Service returned seed data — API is down or not configured */
        const validated = validateEnrollees(result.data, [...FALLBACK_ENROLLEES]);
        setEnrollees(validated);
        setApiStatus("fallback");
        /* Don't surface an error banner — fallback data is intentional */
        return;
      }

      if (result.ok && result.data) {
        const validated = validateEnrollees(result.data, []);
        setEnrollees(validated);
        setApiStatus("success");
      } else {
        throw new Error(result.error ?? "API returned an invalid response");
      }
    } catch (err) {
      console.error("[RegistrarEnrollment] Fetch failed:", err);
      if (!isMountedRef.current) return;
      setError(err.message || "Failed to load enrollees");
      setEnrollees([...FALLBACK_ENROLLEES]);
      setApiStatus("error");
    }
  }, []);

  useEffect(() => { fetchEnrollees(); }, [fetchEnrollees]);

  /* ── create ─────────────────────────────────────────────────── */
  const handleCreate = useCallback(async (form) => {
    setIsSaving(true);
    setMutationError(null);

    try {
      const result = await registrarEnrollmentService.createEnrollee(form);

      if (!isMountedRef.current) return;

      if (result.ok && result.data) {
        /* validateEnrollee returns truthy for both real and synthetic records */
        const record = validateEnrollee(result.data) ? result.data : { ...form, id: result.data.id, learnerId: result.data.learnerId, status: "Pending" };
        setEnrollees(prev => [record, ...prev]);
        showToast(result._isFallback ? "Enrollee added (offline mode)" : "Enrollee successfully added");
        goList();
      } else {
        throw new Error(result.error ?? "Invalid response from server");
      }
    } catch (err) {
      console.error("[RegistrarEnrollment] Create failed:", err);
      if (!isMountedRef.current) return;
      const msg = err.message || "Failed to add enrollee";
      setMutationError(msg);
      showToast(msg, "error");
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  }, [goList, showToast]);

  /* ── update ─────────────────────────────────────────────────── */
  const handleUpdate = useCallback(async (form) => {
    setIsSaving(true);
    setMutationError(null);

    try {
      if (!target?.id) throw new Error("No target enrollee selected");

      const result = await registrarEnrollmentService.updateEnrollee(target.id, form);

      if (!isMountedRef.current) return;

      if (result.ok && result.data) {
        const updated = validateEnrollee(result.data) ? result.data : { ...target, ...form };
        setEnrollees(prev => prev.map(x => x.id === updated.id ? updated : x));
        showToast(result._isFallback ? "Enrollee updated (offline mode)" : "Enrollee successfully updated");
        goList();
      } else {
        throw new Error(result.error ?? "Invalid response from server");
      }
    } catch (err) {
      console.error("[RegistrarEnrollment] Update failed:", err);
      if (!isMountedRef.current) return;
      const msg = err.message || "Failed to update enrollee";
      setMutationError(msg);
      showToast(msg, "error");

      /* Optimistic fallback for network errors only */
      if (err.message?.includes("network") || err.message?.includes("fetch")) {
        setEnrollees(prev => prev.map(x => x.id === target.id ? { ...x, ...form } : x));
      }
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  }, [target, goList, showToast]);

  /* ── approve ────────────────────────────────────────────────── */
  const handleApprove = useCallback(async (id) => {
    setMutationError(null);

    /* Optimistic update — rolls back on failure */
    setEnrollees(prev => prev.map(x => x.id === id ? { ...x, status: "Enrolled" } : x));

    try {
      const result = await registrarEnrollmentService.approveEnrollee(id);

      if (!isMountedRef.current) return;

      if (result.ok) {
        showToast(result._isFallback ? "Approved (offline mode)" : "Enrollee approved successfully");
      } else {
        throw new Error(result.error ?? "Failed to approve enrollee");
      }
    } catch (err) {
      console.error("[RegistrarEnrollment] Approve failed:", err);
      if (!isMountedRef.current) return;
      const msg = err.message || "Failed to approve enrollee";
      setMutationError(msg);
      showToast(msg, "error");
      fetchEnrollees(); // roll back optimistic update
    }
  }, [showToast, fetchEnrollees]);

  /* ── reject ─────────────────────────────────────────────────── */
  const handleReject = useCallback(async (id, reason = "") => {
    setMutationError(null);

    /* Optimistic update */
    setEnrollees(prev => prev.map(x => x.id === id ? { ...x, status: "Rejected" } : x));

    try {
      const result = await registrarEnrollmentService.rejectEnrollee(id, reason);

      if (!isMountedRef.current) return;

      if (result.ok) {
        showToast(result._isFallback ? "Rejected (offline mode)" : "Enrollee rejected");
      } else {
        throw new Error(result.error ?? "Failed to reject enrollee");
      }
    } catch (err) {
      console.error("[RegistrarEnrollment] Reject failed:", err);
      if (!isMountedRef.current) return;
      const msg = err.message || "Failed to reject enrollee";
      setMutationError(msg);
      showToast(msg, "error");
      fetchEnrollees();
    }
  }, [showToast, fetchEnrollees]);

  /* ── archive (single or bulk) ───────────────────────────────── */
  const handleArchive = useCallback(async (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    setMutationError(null);

    /* Optimistic update */
    setEnrollees(prev => prev.map(x => arr.includes(x.id) ? { ...x, status: "Archived" } : x));

    try {
      const result = arr.length === 1
        ? await registrarEnrollmentService.archiveEnrollee(arr[0])
        : await registrarEnrollmentService.bulkArchiveEnrollees(arr);

      if (!isMountedRef.current) return;

      if (result.ok) {
        const label = arr.length > 1 ? `${arr.length} enrollees archived` : "Enrollee archived";
        showToast(result._isFallback ? `${label} (offline mode)` : label);
      } else {
        throw new Error(result.error ?? "Failed to archive enrollee(s)");
      }
    } catch (err) {
      console.error("[RegistrarEnrollment] Archive failed:", err);
      if (!isMountedRef.current) return;
      const msg = err.message || "Failed to archive enrollee(s)";
      setMutationError(msg);
      showToast(msg, "error");
      fetchEnrollees();
    }
  }, [showToast, fetchEnrollees]);

  /* ── unified save dispatcher ────────────────────────────────── */
  const handleSave = useCallback((form) => {
    if (view === "create") handleCreate(form);
    else                   handleUpdate(form);
  }, [view, handleCreate, handleUpdate]);

  /* ═══════════════════════════════════════════════════════════
     RETURN
     ═══════════════════════════════════════════════════════════ */
  return {
    /* state */
    enrollees,
    view,
    target,
    toast,
    isSaving,
    apiStatus,
    error,
    mutationError,
    isLoading: apiStatus === "loading",

    /* actions */
    fetchEnrollees,
    goList,
    goView,
    goEdit,
    goCreate,
    handleSave,
    handleCreate,
    handleUpdate,
    handleApprove,
    handleReject,
    handleArchive,
    dismissMutationError: () => setMutationError(null),
    dismissToast:         () => setToast(null),
    showToast,
  };
}