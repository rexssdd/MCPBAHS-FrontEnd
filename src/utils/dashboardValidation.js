/**
 * dashboardValidation.js
 * Data validation utilities for Dashboard black box testing
 */

/**
 * Validates if value is a safe number
 */
export const isValidNumber = (val) => typeof val === "number" && isFinite(val) && val >= 0;

/**
 * Validates array structure
 */
export const isValidArray = (val) => Array.isArray(val) && val.length > 0;

/**
 * Validates and sanitizes stats object
 */
export const validateStats = (stats) => {
  if (!stats || typeof stats !== "object") return false;
  
  const requiredFields = [
    "enrolledToday", "totalEnrolled", "pendingApps", "completionRate",
    "atRiskCount", "avgGpa", "passRate", "lowAttendanceSections"
  ];
  
  return requiredFields.every(field => isValidNumber(stats[field]));
};

/**
 * Validates grade data array
 */
export const validateGradeData = (data) => {
  if (!isValidArray(data)) return false;
  
  return data.every(item => 
    item && typeof item === "object" &&
    isValidNumber(item.grade) &&
    isValidNumber(item.male) &&
    isValidNumber(item.female)
  );
};

/**
 * Validates enrollment table
 */
export const validateEnrollmentTable = (data) => {
  if (!isValidArray(data)) return false;
  
  return data.every(row =>
    row && typeof row === "object" &&
    isValidNumber(row.grade) &&
    isValidNumber(row.enrolled) &&
    isValidNumber(row.capacity) &&
    typeof row.status === "string"
  );
};

/**
 * Validates application status object
 */
export const validateApplicationStatus = (data) => {
  return data && typeof data === "object" &&
    isValidNumber(data.total) &&
    isValidNumber(data.enrolled) &&
    isValidNumber(data.pending) &&
    isValidNumber(data.cancelled);
};

/**
 * Validates attendance data
 */
export const validateAttendanceData = (data) => {
  if (!isValidArray(data)) return false;
  
  return data.every(item =>
    item && typeof item === "object" &&
    isValidNumber(item.grade) &&
    isValidNumber(item.rate) &&
    item.rate >= 0 && item.rate <= 100
  );
};

/**
 * Validates at-risk students list
 */
export const validateAtRiskStudents = (data) => {
  if (!isValidArray(data)) return false;
  
  return data.every(student =>
    student && typeof student === "object" &&
    typeof student.name === "string" &&
    isValidNumber(student.grade) &&
    typeof student.reason === "string" &&
    ["high", "med", "low"].includes(student.severity)
  );
};

/**
 * Validates strands data
 */
export const validateStrands = (data) => {
  if (!isValidArray(data)) return false;
  
  return data.every(strand =>
    strand && typeof strand === "object" &&
    typeof strand.name === "string" &&
    isValidNumber(strand.count)
  );
};

/**
 * Validates notifications
 */
export const validateNotifications = (data) => {
  if (!isValidArray(data)) return false;
  
  return data.every(notif =>
    notif && typeof notif === "object" &&
    typeof notif.msg === "string" &&
    ["warn", "info", "alert"].includes(notif.type) &&
    typeof notif.time === "string"
  );
};

/**
 * Validates calendar events
 */
export const validateCalendarEvents = (data) => {
  if (!isValidArray(data)) return false;
  
  return data.every(event =>
    event && typeof event === "object" &&
    typeof event.date === "string" &&
    typeof event.label === "string" &&
    ["deadline", "event", "exam"].includes(event.type)
  );
};

/**
 * Master validation for entire dashboard data object
 */
export const validateDashboardData = (data, defaultData) => {
  if (!data || typeof data !== "object") {
    console.warn("Invalid dashboard data structure");
    return defaultData;
  }

  // Preserve dashboard fields that do not yet have strict validators, then
  // let the validators below replace only known-bad core fields with defaults.
  const validated = { ...defaultData, ...data };
  const validators = {
    stats: validateStats,
    gradeData: validateGradeData,
    enrollmentTable: validateEnrollmentTable,
    applicationStatus: validateApplicationStatus,
    attendanceData: validateAttendanceData,
    atRiskStudents: validateAtRiskStudents,
    strands: validateStrands,
    notifications: validateNotifications,
    calendarEvents: validateCalendarEvents,
  };

  Object.entries(validators).forEach(([key, validator]) => {
    try {
      if (!validator(data[key])) {
        console.warn(`Validation failed for ${key}, using default`);
        validated[key] = defaultData[key];
      } else {
        validated[key] = data[key];
      }
    } catch (err) {
      console.warn(`Error validating ${key}:`, err);
      validated[key] = defaultData[key];
    }
  });

  return validated;
};
