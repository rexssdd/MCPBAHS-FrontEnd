/**
 * facultyValidation.js
 * Data validation utilities for Faculty black box testing
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
 * Validates a single teaching load object
 */
export const validateTeachingLoad = (load) => {
  return load && typeof load === "object" &&
    isValidString(load.subject) &&
    isValidString(load.section) &&
    isValidString(load.timeslot);
};

/**
 * Validates advisory object
 */
export const validateAdvisory = (advisory) => {
  if (!advisory) return true; // Advisory can be null
  return typeof advisory === "object" &&
    isValidString(advisory.section) &&
    isValidNumber(advisory.students);
};

/**
 * Validates a single faculty object
 */
export const validateFaculty = (faculty) => {
  if (!faculty || typeof faculty !== "object") return false;

  const requiredStringFields = [
    "firstName", "middleName", "lastName", "id", "email",
    "contact", "dob", "country", "city", "postalCode", "role", "status"
  ];

  const hasRequiredFields = requiredStringFields.every(field => 
    isValidString(faculty[field])
  );

  if (!hasRequiredFields) return false;

  // Validate teaching load (can be empty array)
  if (!isValidArray(faculty.teachingLoad)) return false;
  if (faculty.teachingLoad.length > 0 && !faculty.teachingLoad.every(validateTeachingLoad)) {
    return false;
  }

  // Validate advisory (can be null)
  if (!validateAdvisory(faculty.advisory)) return false;

  return true;
};

/**
 * Sanitizes/defaults incomplete faculty object
 */
export const sanitizeFaculty = (faculty) => {
  if (!faculty || typeof faculty !== "object") {
    return null;
  }

  return {
    uuid: faculty.uuid ?? null,

    personnel_id_number: faculty.personnel_id_number
      ? Number(faculty.personnel_id_number)
      : null,

    first_name: faculty.first_name?.trim() ?? "",

    middle_name: faculty.middle_name?.trim() ?? "",

    last_name: faculty.last_name?.trim() ?? "",

    email: faculty.email?.trim() ?? "",

    phone_number: faculty.phone_number?.trim() ?? "",

    /**
     * Laravel expects YYYY-MM-DD
     */
    date_of_birth: faculty.date_of_birth ?? "",

    sex: faculty.sex ?? "",

    country: faculty.country?.trim() ?? "",

    region: faculty.region?.trim() ?? "",

    province: faculty.province?.trim() ?? "",

    brgy_street_address:
      faculty.brgy_street_address?.trim() ?? "",

    city: faculty.city?.trim() ?? "",

    postal_code: faculty.postal_code?.trim() ?? "",

    teaching_load:
      faculty.teaching_load !== ""
        ? Number(faculty.teaching_load)
        : 0,

    /**
     * THESE WERE MISSING
     */
    position: faculty.position ?? "",

    department: faculty.department ?? "",

    employment_status:
      faculty.employment_status ?? "Active",
  };
};

/**
 * Validates entire faculty array
 */
export const validateFacultyList = (data, defaultData = []) => {
  if (!isValidArray(data)) {
    console.warn("Invalid faculty array, using defaults");
    return defaultData;
  }

  const validated = data.filter(faculty => {
    try {
      return validateFaculty(faculty);
    } catch (err) {
      console.warn("Invalid faculty skipped:", faculty, err);
      return false;
    }
  });

  if (validated.length === 0 && defaultData.length > 0) {
    console.warn("No valid faculty records, using defaults");
    return defaultData;
  }

  return validated;
};

/**
 * Safe full name getter
 */
export const getFacultyFullName = (faculty, fallback = "Unknown") => {
  try {
    if (!faculty) return fallback;
    const first = isValidString(faculty.firstName) ? faculty.firstName : "";
    const middle = isValidString(faculty.middleName) ? faculty.middleName : "";
    const last = isValidString(faculty.lastName) ? faculty.lastName : "";
    const name = `${first} ${middle} ${last}`.trim();
    return name.length > 0 ? name : fallback;
  } catch (err) {
    console.warn("Error getting faculty name:", err);
    return fallback;
  }
};

/**
 * Safe role getter
 */
export const getFacultyRole = (faculty, fallback = "—") => {
  try {
    return isValidString(faculty?.role) ? faculty.role : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safe city getter
 */
export const getFacultyCity = (faculty, fallback = "—") => {
  try {
    return isValidString(faculty?.city) ? faculty.city : fallback;
  } catch {
    return fallback;
  }
};
