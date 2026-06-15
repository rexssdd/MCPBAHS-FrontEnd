const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const DEFAULT_SCHOOL_DATA = {
  stats: {
    students: "4,386",
    teachers: "24",
    sections: "48",
  },
};

const FALLBACK_USERS = {
  admin: "1234",
  principal: "1234",
  registrar: "1234",
  teacher: "1234",
};

const ROLE_ROUTES = ["admin", "principal", "registrar", "teacher"];

// ─────────────────────────────────────────────
// SCHOOL DATA
// ─────────────────────────────────────────────

export async function fetchSchoolData() {
  try {
    const response = await fetch(`${API_URL}/school/dashboard`);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch {
    return DEFAULT_SCHOOL_DATA;
  }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

export async function authenticate(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        reason: data.message || "Invalid credentials",
      };
    }

    const role = String(data.user?.role || "")
      .trim()
      .toLowerCase();

    if (!ROLE_ROUTES.includes(role)) {
      return {
        success: false,
        reason: "Unauthorized role",
      };
    }

    return {
      success: true,
      token:
        data.token ||
        data.access_token ||
        data.jwt ||
        null,
      role,
      user: data.user ?? null,
    };
  } catch (err) {
    // Only use fallback for genuine network failures, not for 4xx HTTP errors
    // (those already returned a structured { success: false } above).
    if (err instanceof TypeError) {
      // TypeError = network failure (CORS, DNS, offline) — safe to fall back
      return authenticateFallback(username, password);
    }
    throw err;
  }
}

// ─────────────────────────────────────────────
// FALLBACK LOGIN
// ─────────────────────────────────────────────

export function authenticateFallback(username, password) {
  const role = username.trim().toLowerCase();

  if (import.meta.env.PROD) {
    if (import.meta.env.DEV) {
      console.error(
        "[auth] authenticateFallback() called in production — this should never happen. " +
        "Check that VITE_API_BASE_URL is set and the backend is reachable."
      );
    }
    return { success: false, reason: "Service unavailable. Please try again later." };
  }

  if (import.meta.env.DEV) {
    console.warn(
      "[auth] Using local fallback login — no token will be issued. " +
      "Authenticated API calls will return 401. Start the backend to get a real token."
    );
  }

  if (FALLBACK_USERS[role] === password) {
    return {
      success: true,
      role,
      token: "dev-token-" + role, // temporary debug token
      user: {
        name: `${role} User`,
        email: `${role}@gmail.com`,
        role,
      },
    };
  }

  return {
    success: false,
    reason: "Invalid credentials",
  };
}

export function getFallbackUsers() {
  return Object.entries(FALLBACK_USERS).map(
    ([username, password]) => ({
      username,
      password,
      role: username,
    })
  );
}

// ─────────────────────────────────────────────
// SESSION LOGGING
// ─────────────────────────────────────────────

export function logSession({
  username,
  role,
  success,
}) {
  try {
    const logs = JSON.parse(
      localStorage.getItem("auditLog") || "[]"
    );

    logs.push({
      username,
      role,
      success,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(
      "auditLog",
      JSON.stringify(logs)
    );
  } catch {
    // ignore storage errors
  }
}