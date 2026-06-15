/**
 * enrollmentValidation.js
 * Data validation utilities for Enrollment black box testing
 */

/**
 * Validates if value is a safe string
 */
export const isValidString = (val) => typeof val === "string" && val.trim().length > 0;

/**
 * Validates if value is a safe number
 */
export const isValidNumber = (val) => typeof val === "number" && isFinite(val) && val >= 0;

/**
 * Validates array structure
 */
export const isValidArray = (val) => Array.isArray(val);

/**
 * Validates a single enrollee object
 */
// Change validateEnrollee to only check truly required fields,
// and allow nullable optional ones:
export const validateEnrollee = (enrollee) => {
  if (!enrollee || typeof enrollee !== "object") return false;
  return (
    isValidString(enrollee.id) &&
    isValidString(enrollee.firstName) &&
    isValidString(enrollee.lastName)

  );
};

/**
 * Sanitizes/defaults incomplete enrollee object
 */
const VALID_STATUSES = ["Enrolled", "Pending", "Rejected", "Incomplete", "Active", "Archived"];

export const sanitizeEnrollee = (enrollee, defaults = {}) => {
  if (!enrollee || typeof enrollee !== "object") return null;
 
  const EMPTY_FORM = {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    country: "Philippines",
    city: "",
    postalCode: "",
    oldSchoolName: "",
    oldSchoolType: "Public",
    oldSchoolId: "",
    oldSchoolAddress: "",
  };

  return {
    id: enrollee.id || defaults.id || Date.now().toString(),
    learnerId: enrollee.learnerId || defaults.learnerId || `LRN${Date.now()}`,
    status: VALID_STATUSES.includes(enrollee.status) ? enrollee.status : "Pending",
    ...EMPTY_FORM,
    ...defaults,
    ...enrollee,
  };
};

/**
 * Validates entire enrollees array
 */
export const validateEnrollees = (data, defaultData = []) => {
  if (!isValidArray(data)) {
    console.warn("Invalid enrollees array, using defaults");
    return defaultData;
  }

  // Filter to only valid enrollees
  const validated = data.filter(enrollee => {
    try {
      return validateEnrollee(enrollee);
    } catch (err) {
      console.warn("Invalid enrollee skipped:", enrollee, err);
      return false;
    }
  });

  if (validated.length === 0 && defaultData.length > 0) {
    console.warn("No valid enrollees, using defaults");
    return defaultData;
  }

  return validated;
};

/**
 * Validates enrollee form data before submission
 */
export const validateEnrolleeForm = (form) => {
  const errors = {};

  if (!isValidString(form.firstName)) errors.firstName = "First name is required";
  if (!isValidString(form.lastName)) errors.lastName = "Last name is required";
  if (!isValidString(form.email)) errors.email = "Valid email is required";
  if (!isValidString(form.phone)) errors.phone = "Phone number is required";
  if (!isValidString(form.dob)) errors.dob = "Date of birth is required";
  if (!isValidString(form.country)) errors.country = "Country is required";
  if (!isValidString(form.city)) errors.city = "City is required";
  if (!isValidString(form.postalCode)) errors.postalCode = "Postal code is required";
  if (!isValidString(form.oldSchoolName)) errors.oldSchoolName = "School name is required";
  if (!isValidString(form.oldSchoolType)) errors.oldSchoolType = "School type is required";

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Safe property accessor with defaults
 */
export const getEnrolleeName = (enrollee, fallback = "Unknown") => {
  try {
    if (!enrollee) return fallback;
    const first = isValidString(enrollee.firstName) ? enrollee.firstName : "";
    const middle = isValidString(enrollee.middleName) ? enrollee.middleName[0] : "";
    const last = isValidString(enrollee.lastName) ? enrollee.lastName : "";
    const name = `${first} ${middle}. ${last}`.trim();
    return name.length > 0 ? name : fallback;
  } catch (err) {
    console.warn("Error getting enrollee name:", err);
    return fallback;
  }
};

/**
 * Safe property accessor for grade level
 */
export const getEnrolleeGrade = (enrollee, fallback = "—") => {
  try {
    return isValidString(enrollee?.gradeLevel) ? enrollee.gradeLevel : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safe property accessor for status
 */
export const getEnrolleeStatus = (enrollee, fallback = "Pending") => {
  try {
    const status = enrollee?.status;
    return VALID_STATUSES.includes(status) ? status : fallback;
  } catch {
    return fallback;
  }
};
