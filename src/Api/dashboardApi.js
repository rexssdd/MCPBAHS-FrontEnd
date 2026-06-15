/**
 * src/Api/dashboardApi.js
 * Backend request wrapper for teacher dashboard AI services.
 * Uses the shared apiClient so dashboard calls behave like the admin API.
 */

import apiClient from "../services/teacher/apiClient";

/**
 * @param {string} path
 * @param {any} body
 * @returns {Promise<any>}
 */
async function apiFetch(path, body = {}) {
  const result = await apiClient.post(path, body);
  if (!result.ok) {
    throw new Error(result.error || `Request failed for ${path}`);
  }
  return result.data;
}

/**
 * Send a teacher dashboard AI request to the backend.
 * @param {{ path: string; body?: any }} params
 */
export async function callDashboardAPI({ path, body }) {
  return apiFetch(path, body);
}

/**
 * Send a teacher dashboard AI request to the backend and parse a JSON response.
 * @param {{ path: string; body?: any }} params
 */
export async function callDashboardAPIJson({ path, body }) {
  const data = await callDashboardAPI({ path, body });
  if (data === null || typeof data !== "object") {
    throw new Error("Expected JSON response from dashboard API.");
  }
  return data;
}
