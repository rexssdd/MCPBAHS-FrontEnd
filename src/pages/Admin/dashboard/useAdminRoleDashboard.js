import { useState, useEffect, useCallback, useRef } from "react";
import { fetchDashboardByRole } from "../../../services/Admin/Dashboard/dashboardService";
import { validateDashboardData } from "../../../utils/dashboardValidation";
import { DEFAULT } from "./adminDashboardTokens.js";

export function useAdminRoleDashboard(role) {
  const [data, setData] = useState(DEFAULT);
  const [apiState, setApiState] = useState("loading");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const activeRoleRef = useRef(role);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async (targetRole, isAutoRefresh = false) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    activeRoleRef.current = targetRole;

    if (!isAutoRefresh) {
      setLoading(true);
      setError(null);
    }
    setApiState("loading");

    try {
      const { results, anyLive } = await fetchDashboardByRole(targetRole, DEFAULT, controller.signal);

      if (!mountedRef.current) return;
      if (activeRoleRef.current !== targetRole) return;

      const validatedData = validateDashboardData(results, DEFAULT);
      setData(validatedData);
      setApiState(anyLive ? "connected" : "fallback");
      setError(null);
    } catch (err) {
      if (err.name === "AbortError") return;

      if (!mountedRef.current) return;
      if (activeRoleRef.current !== targetRole) return;

      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
      setData(DEFAULT);
      setApiState("fallback");
    } finally {
      if (mountedRef.current && activeRoleRef.current === targetRole) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData(role, false);
  }, [role, fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(activeRoleRef.current, true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const retry = useCallback(() => {
    fetchData(activeRoleRef.current, false);
  }, [fetchData]);

  return { data, apiState, error, loading, retry };
}
