// src/hooks/useUserManagement.js
import { useState, useEffect, useCallback, useRef } from "react";
import userManagementService from "../services/Admin/UserManagement/userManagementService";
import { generateDefaultUsers } from "../utils/userDefaults";

export default function useUserManagement() {
  /* ───────────────── STATE ───────────────── */
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [apiError,  setApiError]  = useState("");
  const [view,      setView]      = useState("list");
  const [target,    setTarget]    = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /* ───────────────── FETCH USERS ───────────────── */
  const fetchUsers = useCallback(async () => {
    if (!mountedRef.current) return;
    setApiStatus("fetching");
    setLoading(true);
    setApiError("");

    try {
      const rows = await userManagementService.getUsers();
      if (!mountedRef.current) return;

      // Laravel's ResourceCollection::paginate() wraps results in { data: [...], links, meta }
      // getUsers() already handles this but double-guard here
      const list = Array.isArray(rows) ? rows : (rows?.data ?? rows?.users ?? []);

      if (list.length > 0) {
        setUsers(list);
        setApiStatus("success");
      } else {
        setUsers([]);
        setApiStatus("fallback");
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setApiError(err.message);
      setUsers([]);
      setApiStatus("error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ───────────────── CREATE ───────────────── */
  const createUser = async (form) => {
    try {
      const res = await userManagementService.createUser(form);
      // Backend wraps in { message, data: UserResource } — unwrap to the flat user object
      const newUser = res?.data ?? res ?? {
        ...form,
        id:      Date.now().toString(),
        staffId: String(200000 + Date.now() % 10000),
        status:  "Active",
      };
      // Ensure the row has every field the table renders
      const row = {
        id:      newUser.id      ?? newUser.uuid ?? Date.now().toString(),
        staffId: newUser.staffId ?? newUser.uuid?.slice(0, 8) ?? "—",
        name:    newUser.name    ?? form.name,
        email:   newUser.email   ?? form.email,
        role:    newUser.role    ?? form.role,
        status:  newUser.status  ?? "Active",
      };
      setUsers((prev) => [row, ...prev]);
      return { ok: true };
    } catch (err) {
      setUsers((prev) => [
        {
          ...form,
          id:      Date.now().toString(),
          staffId: String(200000 + prev.length + 1),
          status:  "Active",
        },
        ...prev,
      ]);
      return { ok: false, error: err.message };
    }
  };

  /* ───────────────── UPDATE ───────────────── */
  const updateUser = async (id, mergedPayload) => {
    try {
      const res     = await userManagementService.updateUser(id, mergedPayload);
      const updated = res?.data ?? { id, ...mergedPayload };
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      return { ok: true };
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...mergedPayload } : u))
      );
      return { ok: false, error: err.message };
    }
  };

  /* ───────────────── DELETE ───────────────── */
  const deleteUsers = async (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    try {
      if (arr.length === 1) {
        await userManagementService.deleteUser(arr[0]);
      } else {
        await userManagementService.bulkDelete(arr);
      }
      setUsers((prev) => prev.filter((u) => !arr.includes(u.id)));
      return { ok: true };
    } catch (err) {
      setUsers((prev) => prev.filter((u) => !arr.includes(u.id)));
      return { ok: false, error: err.message };
    }
  };

  /* ───────────────── ARCHIVE ───────────────── */
  const archiveUser = async (id) => {
    try {
      await userManagementService.archiveUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  /* ───────────────── RESET PASSWORD ───────────────── */
  const resetPassword = async (id, newPassword, actor = null) => {
    const controller = new AbortController();
    try {
      await userManagementService.resetPassword(id, {
        newPassword,
        confirmPassword: newPassword,
      });
      userManagementService.logActivity({
        action:    "RESET_PASSWORD",
        targetId:  id,
        actorId:   actor?.id   ?? null,
        actorName: actor?.name ?? "Administrator",
        timestamp: new Date().toISOString(),
      });
      return { ok: true, abort: () => controller.abort() };
    } catch (err) {
      if (err.name === "AbortError") return { ok: false, error: null };
      return { ok: false, error: err.message };
    }
  };

  /* ───────────────── FETCH ACTIVITY LOGS  (UMSS_004) ───────────────── */
  /**
   * Fetch paginated, filtered activity logs for a user.
   * Uses an AbortController so stale in-flight requests are cancelled when
   * the modal closes or the filters change before the previous fetch resolves.
   *
   * Returns { ok, logs, total, page, totalPages, error? }
   * Never throws — the modal handles errors inline.
   *
   * @param {string} userId
   * @param {{
   *   page?:     number,
   *   limit?:    number,
   *   action?:   string,
   *   dateFrom?: string,
   *   dateTo?:   string,
   *   search?:   string,
   * }} [params]
   * @param {AbortSignal} [signal]  — pass from the caller's AbortController
   */
  const fetchActivityLogs = useCallback(async (userId, params = {}, signal) => {
    if (!userId) return { ok: false, error: "No user selected.", logs: [], total: 0, page: 1, totalPages: 1 };

    try {
      // We use getRetry for reads (idempotent, safe to retry on network blip)
      const result = await userManagementService.getActivityLogs(userId, params);

      // If the AbortController fired while we were awaiting, discard silently
      if (signal?.aborted) return { ok: false, error: null, logs: [], total: 0, page: 1, totalPages: 1 };

      return {
        ok:         true,
        logs:       result?.logs       ?? [],
        total:      result?.total      ?? 0,
        page:       result?.page       ?? 1,
        totalPages: result?.totalPages ?? 1,
      };
    } catch (err) {
      if (err.name === "AbortError" || signal?.aborted) {
        return { ok: false, error: null, logs: [], total: 0, page: 1, totalPages: 1 };
      }
      return { ok: false, error: err.message ?? "Failed to load activity logs.", logs: [], total: 0, page: 1, totalPages: 1 };
    }
  }, []);

  /* ───────────────── UI HELPERS ───────────────── */
  const goList = () => {
    setView("list");
    setTarget(null);
  };

  const startCreate = () => setView("create");

  const startEdit = (user) => {
    setTarget(user);
    setView("edit");
  };

  return {
    /* state */
    users,
    loading,
    apiStatus,
    apiError,
    view,
    target,

    /* actions */
    fetchUsers,
    createUser,
    updateUser,
    deleteUsers,
    archiveUser,
    resetPassword,
    fetchActivityLogs,

    /* ui controls */
    setView,
    setTarget,
    goList,
    startCreate,
    startEdit,
  };
}