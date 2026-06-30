/**
 * src/Api/homeApi.js
 * ─────────────────────────────────────────────────────────────────
 * All public-facing API calls used by the HomePage sections.
 *
 *   1. School stats          → fetchHomeStats()       GET /api/school/dashboard
 *   2. Announcements (public)→ fetchAnnouncements()   GET /api/v1/announcements
 *   3. Faculty (public)      → fetchFaculty()         GET /api/v1/faculty  (auth:sanctum)
 *
 * Both endpoints are public (no auth token required).
 *
 * Backend response shapes:
 *
 *   GET /api/school/dashboard
 *     {
 *       stats:         { students: string, teachers: string, sections: string },
 *       announcements: { count: number, latest: string },
 *       enrollment:    { isOpen: boolean, label: string },
 *       schedule:      { label: string },
 *       reports:       { label: string },
 *     }
 *
 *   GET /api/v1/announcements  (public, no token needed)
 *     Array<{
 *       id:          string,
 *       title:       string,
 *       text:        string,   ← body/message field
 *       urgency:     string,
 *       mode:        string,
 *       audience:    string,
 *       date:        string,   ← dissemination_date YYYY-MM-DD
 *       time:        string,
 *       status:      string,
 *       dateCreated: string,
 *       lastUpdated: string,
 *     }>
 *
 *   GET /api/v1/faculty  (requires auth:sanctum token)
 *     Array<{
 *       id:         string,
 *       firstName:  string,
 *       middleName: string | null,
 *       lastName:   string,
 *       role:       "Teacher" | "Non-Teaching",
 *       department: string,   ← humanized position
 *       email:      string | null,
 *       contact:    string | null,
 *       status:     string,
 *     }>
 * ─────────────────────────────────────────────────────────────────
 */

const BACKEND_BASE =
  (import.meta.env.VITE_BACKEND_URL ??
   import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ??
   "http://localhost:8000")
  .replace(/\/$/, "");

// ─── Shared fetch helper ──────────────────────────────────────────

/**
 * Thin fetch wrapper. Adds Accept: application/json and throws on
 * non-2xx responses with a clean error message.
 *
 * @param {string}      path      e.g. "/api/v1/announcements"
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>}
 */
async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BACKEND_BASE}${path}`, {
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Unable to reach the server. Check your connection.");
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch { /* non-JSON body */ }
    throw new Error(message);
  }

  return res.status === 204 ? {} : res.json();
}

// ─── Default / fallback data ──────────────────────────────────────

export const DEFAULT_STATS = {
  students: "—",
  teachers: "—",
  sections: "—",
};

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 1,
    type: "notice",
    title: "Enrollment for SY 2025–2026 Now Open",
    date: "March 10, 2025",
    excerpt: "Online and walk-in enrollment for Grade 7 and Grade 11 is now open. Visit the registrar's office from Monday to Friday, 8 AM–4 PM.",
    tag: "Enrollment",
  },
  {
    id: 2,
    type: "event",
    title: "Brigada Eskwela 2025 Schedule Released",
    date: "March 5, 2025",
    excerpt: "Volunteer clean-up and repair days are set for May 19–23, 2025. All parents, alumni, and community members are welcome to join.",
    tag: "Community",
  },
  {
    id: 3,
    type: "exam",
    title: "4th Quarter Exam Schedule Posted",
    date: "March 1, 2025",
    excerpt: "Fourth-quarter examinations will run from March 26–28. Review the subject schedule posted on the bulletin boards.",
    tag: "Academic",
  },
  {
    id: 4,
    type: "holiday",
    title: "School Closed – Holy Week",
    date: "Feb 25, 2025",
    excerpt: "Classes are suspended from April 14–18, 2025 in observance of Holy Week. Regular classes resume on April 22.",
    tag: "Advisory",
  },
];

export const DEFAULT_FACULTY = [
  { id: 1, name: "Mr. Juan dela Cruz",  subject: "Science & Technology",          role: "Department Head", photo_url: null },
  { id: 2, name: "Ms. Maria Santos",    subject: "Mathematics",                    role: "Senior Teacher",  photo_url: null },
  { id: 3, name: "Mr. Pedro Reyes",     subject: "Filipino & Araling Panlipunan", role: "Teacher II",      photo_url: null },
  { id: 4, name: "Ms. Ana Flores",      subject: "English & Humanities",           role: "Teacher III",     photo_url: null },
  { id: 5, name: "Mr. Carlo Bautista",  subject: "TVL – Agri-Fishery",            role: "Teacher II",      photo_url: null },
  { id: 6, name: "Ms. Liza Mendoza",    subject: "Values Education & MAPEH",      role: "Teacher I",       photo_url: null },
];

// ─── 1. School stats ──────────────────────────────────────────────

/**
 * Fetches the public school dashboard stats used by StatsSection
 * and the LoginPage decorative panel.
 *
 * GET /api/school/dashboard
 *
 * @returns {Promise<{ students: string, teachers: string, sections: string }>}
 */
export async function fetchHomeStats() {
  try {
    const data = await apiFetch("/api/school/dashboard");
    const s = data?.stats ?? {};
    return {
      students: s.students ?? DEFAULT_STATS.students,
      teachers: s.teachers ?? DEFAULT_STATS.teachers,
      sections: s.sections ?? DEFAULT_STATS.sections,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[homeApi] fetchHomeStats failed; using defaults.", err.message);
    }
    return DEFAULT_STATS;
  }
}

// ─── 2. Announcements ─────────────────────────────────────────────

/**
 * Maps a raw API announcement to the shape AnnouncementsSection expects.
 *
 * Backend returns:
 *   { id, title, text, urgency, mode, audience, date, time, status, dateCreated, lastUpdated }
 *
 * Section expects:
 *   { id, type, title, date, excerpt, tag }
 */
function mapAnnouncement(item) {
  // Map urgency → display type for badge colors
  const urgencyToType = {
    high:   "exam",    // red/urgent
    normal: "notice",  // blue
    low:    "notice",
  };

  const rawUrgency = (item.urgency ?? "").toLowerCase();
  const type = urgencyToType[rawUrgency] ?? "notice";

  // Derive a human-readable date from dateCreated or date field
  let date = item.date ?? item.dateCreated ?? "";
  if (date) {
    try {
      date = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch { /* keep raw string */ }
  }

  return {
    id:      item.id,
    type,
    title:   item.title  ?? "Untitled",
    date,
    excerpt: item.text   ?? item.message ?? item.excerpt ?? "",
    tag:     item.audience ?? item.tag ?? "General",
  };
}

/**
 * Fetches public announcements for the homepage.
 *
 * GET /api/v1/announcements  — public, no auth required
 *
 * Returns the mapped list on success, DEFAULT_ANNOUNCEMENTS on failure.
 *
 * @returns {Promise<Array>}
 */
export async function fetchAnnouncements() {
  try {
    const data = await apiFetch("/api/v1/public/announcements");
    const raw = Array.isArray(data) ? data : (data?.data ?? []);

    if (raw.length === 0) return DEFAULT_ANNOUNCEMENTS;

    return raw.map(mapAnnouncement);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[homeApi] fetchAnnouncements failed; using defaults.", err.message);
    }
    return DEFAULT_ANNOUNCEMENTS;
  }
}

// ─── 3. Faculty ───────────────────────────────────────────────────

/**
 * Maps a raw API faculty record to the shape FacultySection expects.
 *
 * Backend returns:
 *   { id, firstName, middleName, lastName, role, department, email, contact, status }
 *
 * Section expects:
 *   { id, name, subject, role, photo_url }
 */
function mapFacultyMember(item) {
  const nameParts = [item.firstName, item.middleName, item.lastName].filter(Boolean);
  const name = nameParts.length > 0
    ? nameParts.join(" ")
    : (item.name ?? "Unknown");

  return {
    id:        item.id,
    name,
    subject:   item.department ?? item.subject ?? "—",
    role:      item.role       ?? "Staff",
    photo_url: item.photo_url  ?? null,
  };
}

/**
 * Fetches faculty/personnel for the homepage FacultySection.
 *
 * GET /api/v1/faculty — requires auth:sanctum (Sanctum token).
 * Pass the currently logged-in user's token if available.
 * Falls back to DEFAULT_FACULTY on auth error or network failure
 * so the public homepage always shows something.
 *
 * @param {string|null} [token]  Sanctum bearer token (from AuthContext)
 * @returns {Promise<{ data: Array, isLive: boolean }>}
 */
export async function fetchFaculty(token = null) {
  try {
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BACKEND_BASE}/api/v1/public/faculty`, {
      headers,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const raw = Array.isArray(json) ? json : (json?.data ?? []);

    if (raw.length === 0) return { data: DEFAULT_FACULTY, isLive: false };

    return { data: raw.map(mapFacultyMember), isLive: true };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[homeApi] fetchFaculty failed; using defaults.", err.message);
    }
    return { data: DEFAULT_FACULTY, isLive: false };
  }
}

// ─── 4. Calendar events ───────────────────────────────────────────

/**
 * Fetches the public school calendar for CalendarSection.jsx.
 *
 * GET /api/v1/public/calendar-events — public, no auth required.
 *
 * @returns {Promise<Array>}
 */
export async function fetchCalendarEvents() {
  try {
    const data = await apiFetch("/api/v1/public/calendar-events");
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[homeApi] fetchCalendarEvents failed; using defaults.", err.message);
    }
    return [];
  }
}

// ─── 5. TVL offers ────────────────────────────────────────────────

/**
 * Fetches the public TVL track list for TVLSection.jsx.
 *
 * GET /api/v1/public/tvl-offers — public, no auth required.
 *
 * @returns {Promise<Array>}
 */
export async function fetchTvlOffers() {
  try {
    const data = await apiFetch("/api/v1/public/tvl-offers");
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[homeApi] fetchTvlOffers failed; using defaults.", err.message);
    }
    return [];
  }
}