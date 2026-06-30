/**
 * useProfile.js
 * Custom hook that owns all profile data-fetching and mutation logic.
 *
 * Exposes:
 *   form            — committed (server-confirmed) profile state
 *   draft           — in-progress edits (set / draft pattern)
 *   editing         — whether edit mode is active
 *   loading         — initial fetch in-flight
 *   saving          — save mutation in-flight
 *   apiSource       — "api" | "default" (UI badge hint)
 *   avatarUploading — profile picture upload in-flight
 *   setDraftField   — update a single draft field
 *   handleEdit      — enter edit mode (snapshot form → draft)
 *   handleCancel    — exit edit mode, discard draft
 *   handleSave      — persist draft changes via API
 *   handleAvatarUpload — upload + persist a new profile picture
 *   handlePasswordChanged — call after successful password change
 *
 * Fallback behaviour:
 *   - On initial load failure, DEFAULT_PROFILE is used silently (no error shown).
 *   - On save failure, the error is surfaced so the caller can display a toast;
 *     no fake-success is applied.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import profileService from "../services/Admin/Profile/profileService";
import { getAuth } from "../utils/authToken";

// ─── Default / fallback profile ───────────────────────────────
export const DEFAULT_PROFILE = {
  firstName:          "Jane",
  lastName:           "Doe",
  email:              "janedoe@deped.gov.ph",
  role:               "Admin",
  employeeId:         "EMP-2024-0042",
  school:             "M.C.P.B.A.H.S",
  department:         "School Administration",
  contactNumber:      "+63 912 345 6789",
  profileImage:       null,
  lastPasswordChange: null,
};

// ─────────────────────────────────────────────────────────────
export function useProfile() {
  const [form,      setForm]      = useState(DEFAULT_PROFILE);
  const [draft,     setDraft]     = useState(DEFAULT_PROFILE);
  const [editing,   setEditing]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [apiSource, setApiSource] = useState("default"); // "api" | "default"
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Guard against state updates after unmount (StrictMode safe)
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Initial fetch ─────────────────────────────────────────
  useEffect(() => {
    let active = true;

    setLoading(true);

    profileService
      .getProfile()
      .then((data) => {
        if (!active || !mounted.current) return;
        const merged = { ...DEFAULT_PROFILE, ...data };
        setForm(merged);
        setDraft(merged);
        setApiSource("api");
      })
      .catch(() => {
        // API unavailable — silently show default data; no error toast on initial load
        if (!active || !mounted.current) return;
        setApiSource("default");
      })
      .finally(() => {
        if (active && mounted.current) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  // ── Edit helpers ──────────────────────────────────────────
  const handleEdit = useCallback(() => {
    setDraft((current) => ({ ...current })); // snapshot form into draft
    setEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setDraft(form);
    setEditing(false);
  }, [form]);

  // ── Save mutation ─────────────────────────────────────────
  /**
   * Persists draft changes.
   * Returns { success: boolean, error?: string } so the caller can show
   * appropriate toast without any UI logic living in this hook.
   */
  const handleSave = useCallback(async () => {
    setSaving(true);

    const payload = {
      firstName:     draft.firstName,
      lastName:      draft.lastName,
      email:         draft.email,
      contactNumber: draft.contactNumber,
      department:    draft.department,
    };

    try {
      const updated = await profileService.updateProfile(payload);
      // Merge: local payload wins over stale form, server response wins over payload
      const merged  = { ...form, ...payload, ...updated };

      if (mounted.current) {
        setForm(merged);
        setDraft(merged);
        setEditing(false);
      }

      return { success: true };
    } catch (err) {
      // Surface the real error — no fake success
      return { success: false, error: err.message ?? "Failed to update profile." };
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [draft, form]);

  // ── Avatar upload (Supabase Storage + DB persist) ─────────
  /**
   * Uploads a new profile picture and persists its URL on the user's
   * row. Independent of the edit/draft flow — applies immediately so
   * the user gets instant feedback without needing to hit "Save".
   * Returns { success: boolean, error?: string, url?: string }.
   */
  const handleAvatarUpload = useCallback(async (file) => {
    setAvatarUploading(true);
    try {
      const userId = getAuth()?.user?.id ?? getAuth()?.user?.uuid ?? form.employeeId;
      const { profileImage } = await profileService.uploadProfileImage(file, userId);

      if (mounted.current) {
        setForm((f) => ({ ...f, profileImage }));
        setDraft((d) => ({ ...d, profileImage }));
      }
      return { success: true, url: profileImage };
    } catch (err) {
      return { success: false, error: err.message ?? "Failed to upload profile picture." };
    } finally {
      if (mounted.current) setAvatarUploading(false);
    }
  }, [form.employeeId]);

  // ── Password changed (optimistic timestamp update) ────────
  const handlePasswordChanged = useCallback(() => {
    const now = new Date().toISOString();
    setForm((f) => ({ ...f, lastPasswordChange: now }));
  }, []);

  // ── Single-field draft updater ────────────────────────────
  const setDraftField = useCallback((key, value) => {
    setDraft((f) => ({ ...f, [key]: value }));
  }, []);

  return {
    // State
    form,
    draft,
    editing,
    loading,
    saving,
    apiSource,
    avatarUploading,
    // Actions
    setDraftField,
    handleEdit,
    handleCancel,
    handleSave,
    handleAvatarUpload,
    handlePasswordChanged,
  };
}