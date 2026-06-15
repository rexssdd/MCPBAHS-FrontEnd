// src/api/config.js
// ─────────────────────────────────────────────────────────────────────────────
import { authHeaders } from "../utils/authToken";

// Central API configuration. Swap BASE_URL to your real backend when ready.
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const API_TIMEOUT_MS = 10_000;

/** Shared fetch wrapper with timeout + JSON parsing */
export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const { headers = {}, ...restOptions } = options;

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: authHeaders({
        "Content-Type": "application/json",
        ...headers,
      }),
      signal: controller.signal,
      ...restOptions,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const error = new Error(errBody.message ?? `HTTP ${res.status}`);
      error.status = res.status;
      error.body   = errBody;
      throw error;
    }

    // 204 No Content
    if (res.status === 204) return null;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Multipart/form-data upload — no Content-Type header (browser sets boundary) */
export async function apiUpload(path, formData, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000); // uploads get longer timeout
  const { headers = {}, ...restOptions } = options;

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: authHeaders(headers),
      body: formData,
      signal: controller.signal,
      ...restOptions,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const error = new Error(errBody.message ?? `HTTP ${res.status}`);
      error.status = res.status;
      error.body   = errBody;
      throw error;
    }

    return res.json();
  } finally {
    clearTimeout(timer);
  }
}
