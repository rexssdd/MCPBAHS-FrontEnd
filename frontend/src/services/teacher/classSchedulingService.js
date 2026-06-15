/**
 * classSchedulingService.js
 * src/services/teacher/classSchedulingService.js
 * ─────────────────────────────────────────────────────────────────
 * READ-ONLY service layer for the Teacher scheduling view.
 *
 * Responsibilities:
 *   • Execute HTTP GET requests only
 *   • Normalise responses into a Result<T, E> union
 *   • Provide mock fallback when VITE_API_BASE_URL is not set
 *
 * ❌ INTENTIONALLY OMITTED (admin-only):
 *   createSection / updateSection / deleteSection / archiveSection
 *   createSchedule / updateSchedule / deleteSchedule / archiveSchedule
 * ─────────────────────────────────────────────────────────────────
 */

// Vite exposes env vars via import.meta.env — never use process.env in browser code.
const API_BASE =
  (typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : "") || "";

const IS_DEV =
  (typeof import.meta !== "undefined" ? import.meta.env?.DEV : false) ?? true;

const GENERIC_NETWORK_ERROR =
  "A network error occurred. Please check your connection and try again.";

// ─── Shared helpers ──────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function authHeaders() {
  try {
    const token =
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken") ||
      "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function buildTeacherQuery(teacher = {}) {
  const params = new URLSearchParams();
  const id =
    teacher.id ?? teacher.teacherId ?? teacher._id ?? teacher.facultyId;
  const email = teacher.email;
  const name =
    teacher.name ?? teacher.fullName ?? teacher.displayName;

  if (id) params.set("teacherId", String(id));
  if (email) params.set("email", String(email));
  if (name) params.set("teacherName", String(name));

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function parseErrorResponse(res) {
  const clone = res.clone();
  try {
    const json = await res.json();
    if (json?.message) return json.message;
    if (json?.error) return json.error;
    return JSON.stringify(json);
  } catch {
    const text = await clone.text().catch(() => "");
    return text || `HTTP ${res.status} ${res.statusText}`;
  }
}

async function get(url) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
    });
    if (!res.ok) {
      const error = await parseErrorResponse(res);
      return { ok: false, error };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : GENERIC_NETWORK_ERROR;
    return { ok: false, error };
  }
}

// ─── Mock data ───────────────────────────────────────────────────

export const MOCK_SECTIONS = [
  { id: "sec-001", gradeLevel: "9",  sectionName: "Gumamela",    adviser: "Mr. John Jay Doe",    students: 30 },
  { id: "sec-002", gradeLevel: "8",  sectionName: "Sampaguita",  adviser: "Ms. Maria Santos",    students: 35 },
  { id: "sec-003", gradeLevel: "10", sectionName: "Rosal",       adviser: "Ms. Ana Dela Cruz",   students: 38 },
  { id: "sec-004", gradeLevel: "7",  sectionName: "Ilang-Ilang", adviser: "Mr. Pedro Garcia",    students: 32 },
  { id: "sec-005", gradeLevel: "11", sectionName: "Dahlia",      adviser: "Mr. Carlo Reyes",     students: 29 },
  { id: "sec-006", gradeLevel: "12", sectionName: "Camia",       adviser: "Ms. Liza Tan",        students: 28 },
  { id: "sec-007", gradeLevel: "9",  sectionName: "Rosas",       adviser: "Mr. Mark Villanueva", students: 31 },
  { id: "sec-008", gradeLevel: "8",  sectionName: "Sunflower",   adviser: "Ms. Joy Reyes",       students: 33 },
  { id: "sec-009", gradeLevel: "10", sectionName: "Adelfa",      adviser: "Mr. Leo Santos",      students: 37 },
  { id: "sec-010", gradeLevel: "7",  sectionName: "Lotus",       adviser: "Ms. Nina Cruz",       students: 34 },
  { id: "sec-011", gradeLevel: "11", sectionName: "Lily",        adviser: "Mr. Ben Flores",      students: 27 },
  { id: "sec-012", gradeLevel: "12", sectionName: "Orchid",      adviser: "Ms. Carla Mendoza",   students: 26 },
];

export const MOCK_SCHEDULES = [
  { id: "sch-001", subject: "Science",            gradeLevel: "9",  section: "Gumamela",    adviser: "Mr. John Jay Doe",    timeslot: "Mon-Wed at 10:00 am - 11:00 am" },
  { id: "sch-002", subject: "Mathematics",        gradeLevel: "8",  section: "Sampaguita",  adviser: "Ms. Maria Santos",    timeslot: "Tue-Thu at 8:00 am - 9:00 am"   },
  { id: "sch-003", subject: "English",            gradeLevel: "10", section: "Rosal",       adviser: "Ms. Ana Dela Cruz",   timeslot: "Mon-Fri at 1:00 pm - 2:00 pm"   },
  { id: "sch-004", subject: "Filipino",           gradeLevel: "7",  section: "Ilang-Ilang", adviser: "Mr. Pedro Garcia",    timeslot: "Wed-Fri at 9:00 am - 10:00 am"  },
  { id: "sch-005", subject: "MAPEH",              gradeLevel: "11", section: "Dahlia",      adviser: "Mr. Carlo Reyes",     timeslot: "Tue-Thu at 2:00 pm - 3:00 pm"   },
  { id: "sch-006", subject: "TLE",                gradeLevel: "12", section: "Camia",       adviser: "Ms. Liza Tan",        timeslot: "Mon-Wed at 3:00 pm - 4:00 pm"   },
  { id: "sch-007", subject: "Araling Panlipunan", gradeLevel: "9",  section: "Rosas",       adviser: "Mr. Mark Villanueva", timeslot: "Mon-Wed at 11:00 am - 12:00 pm" },
  { id: "sch-008", subject: "Science",            gradeLevel: "8",  section: "Sunflower",   adviser: "Ms. Joy Reyes",       timeslot: "Thu-Fri at 10:00 am - 11:00 am" },
  { id: "sch-009", subject: "Mathematics",        gradeLevel: "10", section: "Adelfa",      adviser: "Mr. Leo Santos",      timeslot: "Mon-Wed at 8:00 am - 9:00 am"   },
  { id: "sch-010", subject: "English",            gradeLevel: "7",  section: "Lotus",       adviser: "Ms. Nina Cruz",       timeslot: "Tue-Thu at 1:00 pm - 2:00 pm"   },
  { id: "sch-011", subject: "Filipino",           gradeLevel: "11", section: "Lily",        adviser: "Mr. Ben Flores",      timeslot: "Wed-Fri at 11:00 am - 12:00 pm" },
  { id: "sch-012", subject: "MAPEH",              gradeLevel: "12", section: "Orchid",      adviser: "Ms. Carla Mendoza",   timeslot: "Mon-Tue at 2:00 pm - 3:00 pm"   },
];

// ─── Public API ──────────────────────────────────────────────────

/**
 * Returns sections from the API; falls back to mock data.
 * @param {object} teacher - Teacher identity object
 * @returns {Promise<{ ok: boolean; data?: unknown; scoped?: boolean; error?: string }>}
 */
export async function listSections(teacher = {}) {
  if (!API_BASE) {
    if (IS_DEV)
    await delay(400 + Math.random() * 200);
    return { ok: true, data: MOCK_SECTIONS, scoped: false };
  }

  // Try teacher-scoped endpoint first
  const scoped = await get(
    `${API_BASE}/teacher/sections${buildTeacherQuery(teacher)}`
  );
  if (scoped.ok) return { ...scoped, scoped: true };

  // Fall back to generic endpoint
  const generic = await get(`${API_BASE}/sections`);
  if (generic.ok) return { ...generic, scoped: false };

  // Both failed → use mock so the UI still renders
  if (IS_DEV)
  return { ok: true, data: MOCK_SECTIONS, scoped: false };
}

/**
 * Returns schedules from the API; falls back to mock data.
 * @param {object} teacher - Teacher identity object
 * @returns {Promise<{ ok: boolean; data?: unknown; scoped?: boolean; error?: string }>}
 */
export async function listSchedules(teacher = {}) {
  if (!API_BASE) {
    if (IS_DEV)
    await delay(400 + Math.random() * 200);
    return { ok: true, data: MOCK_SCHEDULES, scoped: false };
  }

  const scoped = await get(
    `${API_BASE}/teacher/schedules${buildTeacherQuery(teacher)}`
  );
  if (scoped.ok) return { ...scoped, scoped: true };

  const generic = await get(`${API_BASE}/schedules`);
  if (generic.ok) return { ...generic, scoped: false };

  if (IS_DEV)
  return { ok: true, data: MOCK_SCHEDULES, scoped: false };
}
