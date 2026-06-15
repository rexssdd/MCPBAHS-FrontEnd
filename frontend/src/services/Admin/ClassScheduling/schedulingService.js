/**
 * schedulingService.js — Sections & Schedules API calls
 *
 * Replaces the inline `API` object + `apiFetch` helper in ClassScheduling.jsx.
 * Built on apiClient so auth headers, timeout, and 204 handling are automatic.
 *
 * All functions return the standard apiClient shape:
 *   { data: T|null, ok: boolean, status: number|null, error: string|null }
 */

import apiClient from "../apiClient";

// ─── Day name maps ────────────────────────────────────────────────
// Frontend timeslot format: "Mon-Wed at 10:00 am - 11:00 am"
// Backend days format:      ["Monday", "Wednesday"]

const DAY_ABBR_TO_FULL = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const DAY_FULL_TO_ABBR = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// ─── Timeslot helpers ─────────────────────────────────────────────

/**
 * Parse a timeslot string like "Mon-Wed at 10:00 am - 11:00 am" into
 * the backend shape: { days: ["Monday","Tuesday","Wednesday"], start_time: "10:00", end_time: "11:00" }
 */
function parseTimeslot(timeslot) {
  if (!timeslot || typeof timeslot !== "string") return null;
  try {
    const [dayPart, timePart] = timeslot.split(" at ");
    if (!dayPart || !timePart) return null;

    // Expand day range e.g. "Mon-Wed" → ["Mon","Tue","Wed"]
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayAbbrs = dayPart.split("-").map((d) => d.trim());
    let expandedAbbrs = [];

    if (dayAbbrs.length === 2) {
      const startIdx = dayOrder.indexOf(dayAbbrs[0]);
      const endIdx   = dayOrder.indexOf(dayAbbrs[1]);
      if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
        expandedAbbrs = dayOrder.slice(startIdx, endIdx + 1);
      } else {
        expandedAbbrs = dayAbbrs;
      }
    } else {
      expandedAbbrs = dayAbbrs;
    }

    const days = expandedAbbrs
      .map((abbr) => DAY_ABBR_TO_FULL[abbr])
      .filter(Boolean);

    // Parse times e.g. "10:00 am - 11:00 am"
    const [startRaw, endRaw] = timePart.split(" - ");
    const toH24 = (raw) => {
      if (!raw) return null;
      const parts = raw.trim().split(" ");
      const [hStr, mStr = "00"] = parts[0].split(":");
      let h = parseInt(hStr, 10);
      const period = parts[1]?.toLowerCase();
      if (period === "pm" && h !== 12) h += 12;
      if (period === "am" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${mStr}`;
    };

    const start_time = toH24(startRaw);
    const end_time   = toH24(endRaw);

    if (!days.length || !start_time || !end_time) return null;
    return { days, start_time, end_time };
  } catch {
    return null;
  }
}

/**
 * Rebuild a frontend timeslot string from backend days + times.
 * e.g. ["Monday","Wednesday"] + "10:00" + "11:00" → "Mon-Wed at 10:00 am - 11:00 am"
 */
function buildTimeslot(days, start_time, end_time) {
  if (!Array.isArray(days) || !days.length || !start_time || !end_time) return "—";

  const abbrs = days.map((d) => DAY_FULL_TO_ABBR[d] ?? d);
  // Compact consecutive days into a range
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const indices  = abbrs.map((a) => dayOrder.indexOf(a)).filter((i) => i !== -1).sort((a,b)=>a-b);
  let dayStr = abbrs.join("-");
  if (
    indices.length >= 2 &&
    indices[indices.length - 1] - indices[0] === indices.length - 1
  ) {
    dayStr = `${dayOrder[indices[0]]}-${dayOrder[indices[indices.length - 1]]}`;
  }

  const fmt = (t) => {
    const [hStr, mStr = "00"] = t.split(":");
    let h = parseInt(hStr, 10);
    const period = h >= 12 ? "pm" : "am";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${mStr} ${period}`;
  };

  return `${dayStr} at ${fmt(start_time)} - ${fmt(end_time)}`;
}

/**
 * Get the current school year string e.g. "2026-2027"
 */
function currentSchoolYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

// ─── Shape transformers ───────────────────────────────────────────

/**
 * Convert a frontend form object → backend POST/PUT payload.
 *
 * Frontend form shape:
 *   { subject, gradeLevel, section (name), adviser (name), timeslot, sectionUuid?, teacherUuid? }
 *
 * Backend payload shape:
 *   { subject, school_year, days, start_time, end_time, section_id?, teacher_id? }
 *
 * Note: section_id and teacher_id are resolved by the backend when
 * sectionUuid / teacherUuid are sent as section_uuid / teacher_uuid.
 * The StoreClassScheduleRequest accepts UUIDs via prepareForValidation.
 * If only name strings are available (no UUIDs), the backend resolves
 * them through the SectionFilter / PersonnelFilter.
 */
function toBackendPayload(form) {
  const parsed = parseTimeslot(form.timeslot);

  return {
    subject:     form.subject     || undefined,
    school_year: form.school_year || currentSchoolYear(),
    semester:    form.semester    || undefined,
    room_no:     form.room_no     || form.room || undefined,

    // Days + times — expanded from the timeslot string
    ...(parsed ?? {}),

    // UUIDs take priority; fall back to name-based lookup on the backend
    section_uuid: form.sectionUuid  || undefined,
    teacher_uuid: form.teacherUuid  || undefined,
  };
}

/**
 * Convert a backend response object → frontend display shape.
 *
 * Backend response shape (ClassScheduleResource):
 *   { uuid, subject, school_year, semester, days, start_time, end_time,
 *     teacher: { uuid, name }, section: { uuid, name } }
 *
 * Frontend display shape:
 *   { id, subject, gradeLevel, section, adviser, timeslot, sectionUuid, teacherUuid }
 */
function toFrontendShape(record) {
  if (!record || typeof record !== "object") return null;

  const raw = record?.data ?? record;

  const timeslot = buildTimeslot(
    raw.days,
    typeof raw.start_time === "string" ? raw.start_time.slice(0, 5) : raw.start_time,
    typeof raw.end_time   === "string" ? raw.end_time.slice(0, 5)   : raw.end_time,
  );

  return {
    id:          raw.uuid ?? raw.id,
    subject:     raw.subject  ?? "—",
    gradeLevel:  raw.section?.grade_level ?? raw.gradeLevel ?? "—",
    section:     raw.section?.name  ?? raw.section?.section_name ?? raw.section ?? "—",
    adviser:     raw.teacher?.name  ?? raw.teacher?.full_name    ?? raw.adviser  ?? "—",
    timeslot,
    school_year: raw.school_year,
    semester:    raw.semester,
    room_no:     raw.room_no ?? raw.room,
    sectionUuid: raw.section?.uuid,
    teacherUuid: raw.teacher?.uuid,
  };
}

/**
 * Convert a backend section response → frontend section shape.
 *
 * Backend: { uuid, section_name, grade_level, school_year, adviser: { uuid, full_name } }
 * Frontend: { id, sectionName, gradeLevel, adviser, students }
 */
function sectionToFrontend(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw?.data ?? raw;
  return {
    id:          r.uuid ?? r.id,
    sectionName: r.section_name ?? r.sectionName ?? "—",
    gradeLevel:  (r.grade_level ?? r.gradeLevel ?? "").replace(/^Grade\s*/i, ""),
    adviser:     r.adviser?.full_name ?? r.adviser ?? "—",
    students:    Array.isArray(r.learners) ? r.learners.length : (r.students ?? 0),
    school_year: r.school_year,
    adviserUuid: r.adviser?.uuid,
  };
}

// ─── Response normalisers ─────────────────────────────────────────

function normaliseList(result, transform, aliases = []) {
  if (!result.ok || result.data === null) return result;

  const raw = result.data;
  const rows =
    Array.isArray(raw)        ? raw
    : Array.isArray(raw?.data) ? raw.data
    : aliases.reduce((found, key) => found ?? raw?.[key], null)
    ?? [];

  return { ...result, data: rows.map(transform).filter(Boolean) };
}

function normaliseOne(result, transform) {
  if (!result.ok || result.data === null) return result;
  const raw = result.data?.data ?? result.data;
  return { ...result, data: transform(raw) };
}

// ══════════════════════════════════════════════════════════════════
//   SECTIONS
// ══════════════════════════════════════════════════════════════════

/** GET /v1/sections — returns { data: Section[], ok, ... } */
export async function listSections() {
  const result = await apiClient.get("/sections");
  return normaliseList(result, sectionToFrontend, ["sections"]);
}

/**
 * POST /v1/sections
 * Accepts frontend form shape; transforms to backend payload.
 */
export async function createSection(form) {
  const payload = {
    section_name:    form.sectionName,
    grade_level:     `Grade ${form.gradeLevel}`,
    school_year:     form.school_year || currentSchoolYear(),
    academic_track:  form.academic_track  || undefined,
    academic_strand: form.academic_strand || undefined,
  };
  const result = await apiClient.post("/sections", payload);
  return normaliseOne(result, sectionToFrontend);
}

/**
 * PUT /v1/sections/:id
 */
export async function updateSection(id, form) {
  const payload = {
    section_name:    form.sectionName,
    grade_level:     `Grade ${form.gradeLevel}`,
    school_year:     form.school_year || currentSchoolYear(),
    academic_track:  form.academic_track  || undefined,
    academic_strand: form.academic_strand || undefined,
  };
  const result = await apiClient.put(`/sections/${id}`, payload);
  return normaliseOne(result, sectionToFrontend);
}

/** PATCH /v1/sections/:id/archive */
export function archiveSection(id) {
  return apiClient.patch(`/sections/${id}/archive`);
}

/** DELETE /v1/sections/:id */
export function deleteSection(id) {
  return apiClient.delete(`/sections/${id}`);
}

// ══════════════════════════════════════════════════════════════════
//   SCHEDULES
// ══════════════════════════════════════════════════════════════════

/** GET /v1/class-schedules — returns { data: Schedule[], ok, ... } */
export async function listSchedules() {
  const result = await apiClient.get("/class-schedules");
  return normaliseList(result, toFrontendShape, ["schedules", "class_schedules"]);
}

/**
 * POST /v1/class-schedules
 * Accepts frontend form shape; transforms to backend payload.
 */
export async function createSchedule(form) {
  const payload = toBackendPayload(form);
  const result  = await apiClient.post("/class-schedules", payload);
  return normaliseOne(result, toFrontendShape);
}

/**
 * PUT /v1/class-schedules/:id
 */
export async function updateSchedule(id, form) {
  const payload = toBackendPayload(form);
  const result  = await apiClient.put(`/class-schedules/${id}`, payload);
  return normaliseOne(result, toFrontendShape);
}

/** PATCH /v1/schedules/:id/archive (AppCompatController alias) */
export function archiveSchedule(id) {
  return apiClient.patch(`/schedules/${id}/archive`);
}

/** DELETE /v1/class-schedules/:id */
export function deleteSchedule(id) {
  return apiClient.delete(`/class-schedules/${id}`);
}