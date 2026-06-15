/**
 * schedulingValidation.js
 * Data validation utilities for ClassScheduling black box testing
 */

/**
 * Validates a section object
 */
export const validateSection = (section) => {
  if (!section || typeof section !== "object") return false;
  return (
    typeof section.id === "string" &&
    typeof section.gradeLevel === "string" &&
    typeof section.sectionName === "string" &&
    typeof section.adviser === "string" &&
    typeof section.students === "number"
  );
};

/**
 * Validates a sections array
 */
export const validateSections = (data, defaultData = []) => {
  if (!Array.isArray(data)) {
    console.warn("Invalid sections array, using defaults");
    return defaultData;
  }

  const validated = data.filter(section => {
    try {
      return validateSection(section);
    } catch (err) {
      console.warn("Invalid section skipped:", section, err);
      return false;
    }
  });

  if (validated.length === 0 && defaultData.length > 0) {
    console.warn("No valid sections, using defaults");
    return defaultData;
  }

  return validated.length > 0 ? validated : defaultData;
};

/**
 * Validates a schedule object
 */
export const validateSchedule = (schedule) => {
  if (!schedule || typeof schedule !== "object") return false;
  return (
    typeof schedule.id === "string" &&
    typeof schedule.subject === "string" &&
    typeof schedule.gradeLevel === "string" &&
    typeof schedule.section === "string" &&
    typeof schedule.adviser === "string" &&
    typeof schedule.timeslot === "string"
  );
};

/**
 * Validates a schedules array
 */
export const validateSchedules = (data, defaultData = []) => {
  if (!Array.isArray(data)) {
    console.warn("Invalid schedules array, using defaults");
    return defaultData;
  }

  const validated = data.filter(schedule => {
    try {
      return validateSchedule(schedule);
    } catch (err) {
      console.warn("Invalid schedule skipped:", schedule, err);
      return false;
    }
  });

  if (validated.length === 0 && defaultData.length > 0) {
    console.warn("No valid schedules, using defaults");
    return defaultData;
  }

  return validated.length > 0 ? validated : defaultData;
};

/**
 * Sanitizes section object with fallbacks
 */
export const sanitizeSection = (section) => {
  if (!section || typeof section !== "object") return null;
  return {
    id: section.id || `sec-${Date.now()}`,
    gradeLevel: section.gradeLevel || "7",
    sectionName: section.sectionName || "—",
    adviser: section.adviser || "—",
    students: typeof section.students === "number" ? section.students : 0,
  };
};

/**
 * Sanitizes schedule object with fallbacks
 */
export const sanitizeSchedule = (schedule) => {
  if (!schedule || typeof schedule !== "object") return null;
  return {
    id: schedule.id || `sch-${Date.now()}`,
    subject: schedule.subject || "—",
    gradeLevel: schedule.gradeLevel || "7",
    section: schedule.section || "—",
    adviser: schedule.adviser || "—",
    timeslot: schedule.timeslot || "—",
  };
};

/**
 * True if another schedule uses the same timeslot for the same teacher
 * or the same section (same grade + section name), excluding optional id.
 */
export function schedulesConflict(schedules, candidate, { excludeId } = {}) {
  if (!Array.isArray(schedules) || !candidate || typeof candidate !== "object") return false;
  const ts = String(candidate.timeslot ?? "").trim();
  const adv = String(candidate.adviser ?? "").trim();
  const sec = String(candidate.section ?? "").trim();
  const gl = String(candidate.gradeLevel ?? "").trim();
  if (!ts) return false;
  return schedules.some((s) => {
    if (!s || typeof s !== "object") return false;
    if (excludeId && s.id === excludeId) return false;
    if (String(s.timeslot ?? "").trim() !== ts) return false;
    if (String(s.adviser ?? "").trim() === adv && adv.length > 0) return true;
    if (
      String(s.gradeLevel ?? "").trim() === gl &&
      String(s.section ?? "").trim() === sec &&
      sec.length > 0
    ) {
      return true;
    }
    return false;
  });
}

/** Normalized section name for duplicate checks. */
export function sectionNameKey(name) {
  return String(name ?? "").trim().toLowerCase();
}

/**
 * True if another section shares the same display name within the same grade level.
 * @param {string|undefined} excludeId — section id to ignore (e.g. current row when editing)
 */
export function isDuplicateSection(sections, { sectionName, gradeLevel, excludeId }) {
  if (!Array.isArray(sections)) return false;
  const nk = sectionNameKey(sectionName);
  const gk = String(gradeLevel ?? "").trim();
  return sections.some((s) => {
    if (!s || typeof s !== "object") return false;
    if (excludeId != null && s.id === excludeId) return false;
    return sectionNameKey(s.sectionName) === nk && String(s.gradeLevel ?? "").trim() === gk;
  });
}

/**
 * Safe getters with fallbacks
 */
export const getSectionName = (section, fallback = "—") => {
  try {
    return typeof section?.sectionName === "string" && section.sectionName.trim()
      ? section.sectionName
      : fallback;
  } catch {
    return fallback;
  }
};

export const getScheduleSubject = (schedule, fallback = "—") => {
  try {
    return typeof schedule?.subject === "string" && schedule.subject.trim()
      ? schedule.subject
      : fallback;
  } catch {
    return fallback;
  }
};
