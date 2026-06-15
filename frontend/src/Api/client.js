import { authHeaders } from "../utils/authToken";
import {
  APIError,
  parseAPIError,
  handleNetworkError,
  logError,
  requiresReAuth,
  ERROR_CODES,
} from "../utils/errorHandler";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Warn if API URL is not configured in production
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.warn("[API Client] VITE_API_BASE_URL is not configured. API calls may fail.");
}

/**
 * Create abort controller with timeout
 */
function createTimeoutController(timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

/**
 * Main API fetch function with comprehensive error handling
 */
export async function apiFetch(endpoint, options = {}) {
  const { controller, timeoutId } = createTimeoutController(options.timeout || REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      credentials: "include",
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorData = null;

      try {
        errorData = await response.json();
      } catch (parseError) {
        if (import.meta.env.DEV) {
          console.error("[API] Failed to parse error response:", parseError);
        }
      }

      const error = parseAPIError(response, errorData);

      // Log the error
      logError(error, {
        endpoint,
        method: options.method || 'GET',
        statusCode: response.status,
      });

      // Handle re-authentication required
      if (requiresReAuth(error)) {
        // Trigger re-authentication in auth context
        window.dispatchEvent(new CustomEvent('auth:required'));
      }

      throw error;
    }

    // Parse successful response
    try {
      return await response.json();
    } catch (parseError) {
      const error = new APIError(
        'Failed to parse server response.',
        response.status,
        ERROR_CODES.SERVER_ERROR,
        parseError.message
      );

      logError(error, { endpoint, parseError: parseError.message });
      throw error;
    }
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle network errors
    if (error instanceof APIError) {
      throw error;
    }

    const networkError = handleNetworkError(error);
    logError(networkError, { endpoint });
    throw networkError;
  }
}

/**
 * POST request wrapper
 */
export async function apiPost(endpoint, data, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request wrapper
 */
export async function apiPut(endpoint, data, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request wrapper
 */
export async function apiPatch(endpoint, data, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request wrapper
 */
export async function apiDelete(endpoint, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * GET request wrapper
 */
export async function apiGet(endpoint, options = {}) {
  return apiFetch(endpoint, {
    ...options,
    method: 'GET',
  });
}