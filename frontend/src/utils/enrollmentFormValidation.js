import { ALL_CITIES, ALL_PROVINCES, getCityOptions } from "./philippineLocations";

const LRN_PATTERN = /^\d{12}$/;
const STUDENT_ID_PATTERN = /^[A-Za-z0-9-]{4,20}$/;
const PHONE_PATTERN = /^(09|\+639)\d{9}$/;
const ZIP_PATTERN = /^\d{4}$/;
const SCHOOL_YEAR_PATTERN = /^\d{4}[-\u2013]\d{4}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const trimValue = (value) => String(value ?? "").trim();

const isBlank = (value) => trimValue(value).length === 0;

const isFutureDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

const validateRequired = (errors, form, fields) => {
  fields.forEach(([key, label]) => {
    if (isBlank(form[key])) errors[key] = `${label} is required.`;
  });
};

const validateLearnerBasics = (errors, form, { lrnRequired = true } = {}) => {
  if (lrnRequired || !isBlank(form.lrn)) {
    if (!LRN_PATTERN.test(trimValue(form.lrn))) {
      errors.lrn = "LRN must contain exactly 12 digits.";
    }
  }

  validateRequired(errors, form, [
    ["lastName", "Last name"],
    ["firstName", "First name"],
    ["birthDate", "Birth date"],
    ["sex", "Sex"],
    ["age", "Age"],
    ["placeOfBirth", "Place of birth"],
  ]);

  if (form.birthDate && isFutureDate(form.birthDate)) {
    errors.birthDate = "Birth date cannot be in the future.";
  }

  const age = Number(form.age);
  if (!isBlank(form.age) && (!Number.isInteger(age) || age < 10 || age > 25)) {
    errors.age = "Age must be a whole number from 10 to 25.";
  }

  if (form.isIP === "Yes" && isBlank(form.ipSpecify)) {
    errors.ipSpecify = "Please specify the IP or cultural community.";
  }

  if (form.is4Ps === "Yes" && isBlank(form.householdId)) {
    errors.householdId = "Please enter the 4Ps household ID.";
  }
};

const validateAddress = (errors, form) => {
  validateRequired(errors, form, [
    ["barangay", "Barangay"],
    ["municipality", "Municipality or city"],
    ["province", "Province"],
    ["zipCode", "Zip code"],
    ["contactNumber", "Contact number"],
  ]);

  if (!isBlank(form.zipCode) && !ZIP_PATTERN.test(trimValue(form.zipCode))) {
    errors.zipCode = "Zip code must be 4 digits.";
  }

  if (!isBlank(form.contactNumber) && !PHONE_PATTERN.test(trimValue(form.contactNumber))) {
    errors.contactNumber = "Use a valid PH mobile number, e.g. 09XXXXXXXXX.";
  }

  if (!isBlank(form.country) && trimValue(form.country) !== "Philippines") {
    errors.country = "Select a valid country from the list.";
  }

  if (!isBlank(form.province) && !ALL_PROVINCES.includes(trimValue(form.province))) {
    errors.province = "Select a valid province from the list.";
  }

  const validCities = form.province ? getCityOptions(form.province) : ALL_CITIES;
  if (!isBlank(form.municipality) && !validCities.includes(trimValue(form.municipality))) {
    errors.municipality = "Select a valid city or municipality from the list.";
  }
};

const validateBirthplace = (errors, form) => {
  if (!isBlank(form.placeOfBirth) && !ALL_CITIES.includes(trimValue(form.placeOfBirth))) {
    errors.placeOfBirth = "Select a valid city or municipality from the list.";
  }
};

const validateParents = (errors, form) => {
  validateRequired(errors, form, [
    ["fatherLast", "Father's last name"],
    ["fatherFirst", "Father's first name"],
    ["motherLast", "Mother's last name"],
    ["motherFirst", "Mother's first name"],
  ]);
};

const validateFiles = (errors, files, requiredFiles) => {
  requiredFiles.forEach(([key, label]) => {
    const file = files[key];

    if (!file) {
      errors[key] = `${label} is required.`;
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors[key] = `${label} must be 5MB or smaller.`;
      return;
    }

    if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
      errors[key] = `${label} must be a JPG, PNG, or PDF file.`;
    }
  });
};

const validateConsent = (errors, form) => {
  if (!form.consentImages) errors.consentImages = "Image and signature consent is required.";
  if (!form.consentData) errors.consentData = "Data privacy certification is required.";
};

export const normalizeEnrollmentField = (key, value) => {
  const raw = String(value ?? "");

  if (["lrn", "age", "zipCode"].includes(key)) {
    return raw.replace(/\D/g, "").slice(0, key === "lrn" ? 12 : key === "zipCode" ? 4 : 2);
  }

  if (key === "contactNumber") {
    return raw.replace(/[^\d+]/g, "").slice(0, raw.startsWith("+") ? 13 : 11);
  }

  if (key === "studentId") {
    return raw.replace(/[^A-Za-z0-9-]/g, "").slice(0, 20).toUpperCase();
  }

  return raw.replace(/[<>]/g, "").slice(0, 120);
};

export const validateG7Step = (step, form, files) => {
  const errors = {};

  if (step === 0) {
    validateLearnerBasics(errors, form, { lrnRequired: form.withLRN === "Yes" });
    validateBirthplace(errors, form);
  }

  if (step === 1) validateAddress(errors, form);
  if (step === 2) validateParents(errors, form);

  if (step === 3) {
    validateFiles(errors, files, [
      ["idPic", "2x2 ID picture"],
      ["signature", "E-signature"],
      ["birthCert", "Birth certificate"],
      ["reportCard", "Form 137 or report card"],
    ]);
    validateConsent(errors, form);
  }

  return errors;
};

export const validateOldStudentStep = (step, form, files) => {
  const errors = {};

  if (step === 0) {
    validateRequired(errors, form, [
      ["studentId", "Student ID"],
      ["lrn", "LRN"],
      ["lastName", "Last name"],
      ["firstName", "First name"],
    ]);

    if (!isBlank(form.studentId) && !STUDENT_ID_PATTERN.test(trimValue(form.studentId))) {
      errors.studentId = "Student ID may only use letters, numbers, and hyphens.";
    }

    if (!isBlank(form.lrn) && !LRN_PATTERN.test(trimValue(form.lrn))) {
      errors.lrn = "LRN must contain exactly 12 digits.";
    }
  }

  if (step === 1) validateAddress(errors, form);

  if (step === 2) {
    validateRequired(errors, form, [
      ["lastGradeLevel", "Last grade level"],
      ["section", "Last section"],
      ["schoolYearLastAttended", "Last school year attended"],
    ]);

    if (
      !isBlank(form.schoolYearLastAttended) &&
      !SCHOOL_YEAR_PATTERN.test(trimValue(form.schoolYearLastAttended))
    ) {
      errors.schoolYearLastAttended = "Use the format YYYY-YYYY.";
    }
  }

  if (step === 3) {
    validateFiles(errors, files, [
      ["idPic", "Updated ID picture"],
      ["reportCard", "Latest report card"],
    ]);
    validateConsent(errors, form);
  }

  return errors;
};

export const validateTransfereeStep = (step, form, files) => {
  const errors = {};

  if (step === 0) validateLearnerBasics(errors, form, { lrnRequired: false });
  if (step === 0) validateBirthplace(errors, form);
  if (step === 1) validateAddress(errors, form);
  if (step === 2) validateParents(errors, form);

  if (step === 3) {
    validateRequired(errors, form, [
      ["previousSchool", "Previous school"],
      ["previousSchoolAddress", "Previous school address"],
      ["lastGradeCompleted", "Last grade completed"],
      ["lastSyAttended", "Last school year attended"],
      ["gradeToEnroll", "Grade level to enroll in"],
      ["reasonForTransfer", "Reason for transfer"],
    ]);

    if (!isBlank(form.lastSyAttended) && !SCHOOL_YEAR_PATTERN.test(trimValue(form.lastSyAttended))) {
      errors.lastSyAttended = "Use the format YYYY-YYYY.";
    }

    if (form.reasonForTransfer === "Other" && isBlank(form.otherReason)) {
      errors.otherReason = "Please specify the reason for transfer.";
    }
  }

  if (step === 4) {
    validateFiles(errors, files, [
      ["idPic", "2x2 ID picture"],
      ["signature", "E-signature"],
      ["birthCert", "Birth certificate"],
      ["form137", "Form 137"],
      ["goodMoral", "Good moral certificate"],
      ["reportCard", "Latest report card"],
    ]);
    validateConsent(errors, form);
  }

  return errors;
};

export const hasValidationErrors = (errors) => Object.keys(errors).length > 0;
