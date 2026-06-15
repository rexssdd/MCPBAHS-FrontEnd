/**
 * src/hooks/useAnnouncements.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Owns ALL async state for the Announcements feature.
 * Delegates every network call to announcementApi.js.
 *
 * Strategy for default data:
 *   The hook starts empty with apiStatus "loading". It does NOT pre-seed the
 *   list with DEFAULT_ANNOUNCEMENTS — doing so caused uuid-mismatch duplicates
 *   on re-fetch. Pages that want placeholder cards can render them separately
 *   while apiStatus === "loading", using DEFAULT_ANNOUNCEMENTS from announcementApi.
 *
 * Returned shape:
 *   announcements   — current list (array)
 *   apiStatus       — "loading" | "success" | "error"
 *   isSaving        — true while create / update / delete is in-flight
 *   fetchAll()      — (re)fetch the full list
 *   create(form)    — POST  → Promise<{ ok, errorMsg? }>
 *   update(id,form) — PUT   → Promise<{ ok, errorMsg? }>
 *   remove(id)      — DELETE→ Promise<{ ok, errorMsg? }>
 *   bulkRemove(ids) — DELETE→ Promise<{ ok, errorMsg? }>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from "react";

import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  bulkDeleteAnnouncements,
  buildPayload,
} from "../Api/announcementApi";

export function useAnnouncements() {
  // Start empty with "loading" — never pre-show fake announcements as real ones.
  const [announcements, setAnnouncements] = useState([]);
  const [apiStatus,     setApiStatus]     = useState("loading");
  const [isSaving,      setIsSaving]      = useState(false);

  // ── GET ─────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setApiStatus("loading");
    const result = await fetchAnnouncements();

    if (result.ok) {
      setAnnouncements(result.data);
      setApiStatus("success");
    } else {
      console.error("[useAnnouncements] fetchAll failed:", result.error);
      // Show real error status so the UI can display an error banner
      setAnnouncements([]);
      setApiStatus("error");
    }

    return result;
  }, []);

  // ── POST ────────────────────────────────────────────────────────────────────

  const create = useCallback(async (form) => {
    setIsSaving(true);
    const result = await createAnnouncement(form);

    if (result.ok) {
      // Prepend the server-assigned record; strip any remaining defaults
      setAnnouncements(prev => [
        result.data,
        ...prev.filter(a => !a.isDefault),
      ]);
    } else {
      // FIX FE-CNS-04: do NOT insert a fake local record with id: Date.now().
      // On re-fetch, that numeric id would never match any server uuid and the
      // record would be duplicated instead of replaced.  Instead, just log the
      // error and leave the list unchanged so the user can retry explicitly.
      console.warn("[useAnnouncements] create failed:", result.error);
    }

    setIsSaving(false);
    return { ok: result.ok, errorMsg: result.ok ? null : result.error };
  }, []);

  // ── PUT ─────────────────────────────────────────────────────────────────────

  const update = useCallback(async (id, form) => {
    setIsSaving(true);
    const result = await updateAnnouncement(id, form);

    if (result.ok) {
      // Match on uuid — the server response always carries uuid, not a numeric id.
      setAnnouncements(prev =>
        prev.map(x => x.uuid === result.data.uuid ? result.data : x)
      );
    } else {
      // Optimistic local patch
      console.warn("[useAnnouncements] update failed:", result.error);
      const payload = buildPayload(form);
      setAnnouncements(prev =>
        prev.map(x =>
          x.uuid === id
            ? { ...x, ...payload, updated_at: new Date().toISOString() }
            : x
        )
      );
    }

    setIsSaving(false);
    return { ok: result.ok, errorMsg: result.ok ? null : result.error };
  }, []);

  // ── DELETE (single) ─────────────────────────────────────────────────────────

  const remove = useCallback(async (id) => {
    // CNS-FE-01 fix: the API response hides the numeric `id` field (it's in
    // $hidden on the Announcement model). The public identity field is `uuid`.
    // Filtering by x.id was always a no-op — no record was ever removed from
    // the list optimistically because x.id was undefined for every real record.
    // Match on uuid instead, which callers must pass (the server-assigned UUID).
    setAnnouncements(prev => prev.filter(x => x.uuid !== id));

    const result = await deleteAnnouncement(id);
    if (!result.ok) {
      console.warn("[useAnnouncements] remove failed:", result.error);
      // Could rollback here; for now log — user can retry via fetchAll
    }
    return { ok: result.ok, errorMsg: result.ok ? null : result.error };
  }, []);

  // ── DELETE (bulk) ───────────────────────────────────────────────────────────

  const bulkRemove = useCallback(async (ids) => {
    // CNS-FE-01 fix: same uuid vs id issue — match on uuid for bulk removal.
    setAnnouncements(prev => prev.filter(x => !ids.includes(x.uuid)));

    const result = await bulkDeleteAnnouncements(ids);
    if (!result.ok) {
      console.warn("[useAnnouncements] bulkRemove failed:", result.error);
    }
    return { ok: result.ok, errorMsg: result.ok ? null : result.error };
  }, []);

  return {
    announcements,
    apiStatus,
    isSaving,
    fetchAll,
    create,
    update,
    remove,
    bulkRemove,
  };
}
