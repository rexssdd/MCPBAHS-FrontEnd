import { useState, useEffect, useCallback, useRef } from "react";
import { fetchPrincipalDashboard } from "../../../services/Principal/principalDashboardService";
import { validateDashboardData } from "../../../utils/dashboardValidation";
import { EMPTY } from "./principalDashboardTokens.js";

export function usePrincipalDashboard() {
  const [data,     setData]     = useState(EMPTY);
  const [apiState, setApiState] = useState("loading");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  const abortRef   = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (isAutoRefresh = false) => {
    // Cancel any in-flight request before starting a new one
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!isAutoRefresh) {
      setLoading(true);
      setError(null);
    }
    setApiState("loading");

    try {
      // ← Dedicated principal service: 14 shared + 5 executive endpoints
      const { results, anyLive } = await fetchPrincipalDashboard(EMPTY, controller.signal);

      if (!mountedRef.current) return;

      const validated = validateDashboardData(results, EMPTY);
      setData(validated);
      setApiState(anyLive ? "connected" : "error");
      setError(anyLive ? null : "Could not reach server. Data may be stale.");
    } catch (err) {
      if (err.name === "AbortError") return; // intentional cancel — not an error
      if (!mountedRef.current) return;

      console.error("Principal Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data.");
      setApiState("error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => { fetchData(false); }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const retry = useCallback(() => fetchData(false), [fetchData]);
  return { data, apiState, error, loading, retry };
}