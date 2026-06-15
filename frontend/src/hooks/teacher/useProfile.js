/**
 * useTeacherProfile.js
 * Custom hook that owns all teacher profile data-fetching and mutation logic.
 *
 * Teacher-specific fields added vs Admin version:
 *   subjects        — string  (e.g. "Mathematics, Science")
 *   gradeLevel      — string  (e.g. "Grade 10")
 *   isAdviser       — boolean (whether the teacher is a class adviser)
 *   advisorySection — string  (e.g. "10 - Rizal")
 *
 * Exposes:
 *   form                  — committed (server-confirmed) profile state
 *   draft                 — in-progress edits
 *   editing               — whether edit mode is active
 *   loading               — initial fetch in-flight
 *   saving                — save mutation in-flight
 *   apiSource             — "api" | "default"
 *   setDraftField         — update a single draft field
 *   handleEdit            — enter edit mode
 *   handleCancel          — exit edit mode, discard draft
 *   handleSave            — persist draft changes via API
 *   handlePasswordChanged — call after successful password change
 *
 * Fallback:
 *   On initial load failure, DEFAULT_TEACHER_PROFILE is used silently.
 *   On save failure, the error is surfaced; no fake-success is applied.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import teacherProfileService from "../../services/teacher/profileService";

// ─────────────────────────────────────────────────────────────
export function useTeacherProfile() {
  const [form,      setForm]      = useState(null);
  const [draft,     setDraft]     = useState(null);
  const [editing,   setEditing]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);

  // Guard against state updates after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Initial fetch ─────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    teacherProfileService
      .getProfile()
      .then((data) => {
        if (!active || !mounted.current) return;
        setForm(data);
        setDraft(data);
      })
      .catch((err) => {
        if (!active || !mounted.current) return;
        setError(err.message || "Failed to load profile data.");
      })
      .finally(() => {
        if (active && mounted.current) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  // ── Edit helpers ──────────────────────────────────────────
  const handleEdit = useCallback(() => {
    if (!draft) return;
    setDraft((current) => ({ ...current }));
    setEditing(true);
  }, [draft]);

  const handleCancel = useCallback(() => {
    if (!form) return;
    setDraft(form);
    setEditing(false);
  }, [form]);

  // ── Save mutation ─────────────────────────────────────────
  /**
   * Only firstName, lastName, email, and contactNumber are editable by
   * the teacher themselves — school/teaching-assignment fields are
   * managed by the admin and are read-only in this view.
   *
   * Returns { success: boolean, error?: string }.
   */
  const handleSave = useCallback(async () => {
    if (!draft) return { success: false, error: "No data to save." };
    setSaving(true);

    const payload = {
      firstName:     draft.firstName,
      lastName:      draft.lastName,
      email:         draft.email,
      contactNumber: draft.contactNumber,
    };

    try {
      const updated = await teacherProfileService.updateProfile(payload);
      const merged  = { ...form, ...payload, ...updated };

      if (mounted.current) {
        setForm(merged);
        setDraft(merged);
        setEditing(false);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message ?? "Failed to update profile." };
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [draft, form]);

  // ── Password changed (optimistic timestamp update) ────────
  const handlePasswordChanged = useCallback(() => {
    if (!form) return;
    const now = new Date().toISOString();
    setForm((f) => ({ ...f, lastPasswordChange: now }));
  }, [form]);

  // ── Single-field draft updater ────────────────────────────
  const setDraftField = useCallback((key, value) => {
    setDraft((f) => f ? ({ ...f, [key]: value }) : null);
  }, []);

  return {
    form,
    draft,
    editing,
    loading,
    saving,
    error,
    setDraftField,
    handleEdit,
    handleCancel,
    handleSave,
    handlePasswordChanged,
  };
}