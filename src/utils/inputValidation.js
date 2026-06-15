const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/;
const PHONE_RE = /^(09|\+639)\d{9}$/;
const SCHOOL_YEAR_RE = /^\d{4}[-–]\d{4}$/;
const SAFE_TEXT_RE = /^[^<>]*$/;

export const trimText = (value) => String(value ?? "").trim();

export const isEmpty = (value) => trimText(value).length === 0;

export const isValidEmail = (value) => EMAIL_RE.test(trimText(value));

export const isValidName = (value) => {
  const text = trimText(value);
  return text.length >= 2 && text.length <= 80 && NAME_RE.test(text);
};

export const isValidPhone = (value) => PHONE_RE.test(trimText(value).replace(/\s/g, ""));

export const isValidSchoolYear = (value) => {
  const text = trimText(value);
  if (!SCHOOL_YEAR_RE.test(text)) return false;
  const [start, end] = text.split(/[-–]/).map(Number);
  return end === start + 1;
};

export const hasUnsafeText = (value) => !SAFE_TEXT_RE.test(String(value ?? ""));

export const isValidDate = (value) => {
  if (!value) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

export const isPastDate = (value) => {
  if (!isValidDate(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const validateTextField = (value, label, { min = 1, max = 500, required = true } = {}) => {
  const text = trimText(value);
  if (required && !text) return `${label} is required.`;
  if (!text) return "";
  if (text.length < min) return `${label} must be at least ${min} characters.`;
  if (text.length > max) return `${label} must be ${max} characters or fewer.`;
  if (hasUnsafeText(text)) return `${label} cannot contain angle brackets.`;
  return "";
};

export const validateEmailField = (value, label = "Email") => {
  if (isEmpty(value)) return `${label} is required.`;
  if (!isValidEmail(value)) return `Enter a valid ${label.toLowerCase()}.`;
  return "";
};

export const validateNameField = (value, label = "Name") => {
  if (isEmpty(value)) return `${label} is required.`;
  if (!isValidName(value)) return `${label} may only contain letters, spaces, hyphens, apostrophes, and periods.`;
  return "";
};

export const validatePhoneField = (value, label = "Contact number") => {
  if (isEmpty(value)) return `${label} is required.`;
  if (!isValidPhone(value)) return `${label} must be a valid PH mobile number, e.g. 09XXXXXXXXX.`;
  return "";
};

export const validateSchoolYearField = (value, label = "School year") => {
  if (isEmpty(value)) return `${label} is required.`;
  if (!isValidSchoolYear(value)) return `${label} must use YYYY-YYYY and cover one school year.`;
  return "";
};

export const validatePasswordStrength = (value, label = "Password") => {
  const password = String(value ?? "");
  if (!password) return `${label} is required.`;
  if (password.length < 8) return `${label} must be at least 8 characters.`;
  if (!/[A-Z]/.test(password)) return `${label} must include an uppercase letter.`;
  if (!/[a-z]/.test(password)) return `${label} must include a lowercase letter.`;
  if (!/[0-9]/.test(password)) return `${label} must include a number.`;
  if (!/[^A-Za-z0-9]/.test(password)) return `${label} must include a special character.`;
  return "";
};

export const validateFileList = (
  files,
  {
    required = true,
    maxSizeMb = 10,
    allowedExtensions = ["pdf", "docx", "txt", "png", "jpg", "jpeg"],
    label = "File",
  } = {},
) => {
  const list = Array.from(files || []);
  if (required && list.length === 0) return `${label} is required.`;

  const maxBytes = maxSizeMb * 1024 * 1024;
  const allowed = allowedExtensions.map(ext => ext.toLowerCase());

  for (const file of list) {
    const ext = file.name?.split(".").pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      return `${label} must be ${allowed.map(ext => ext.toUpperCase()).join(", ")}.`;
    }
    if (file.size > maxBytes) {
      return `${label} must be ${maxSizeMb}MB or smaller.`;
    }
  }

  return "";
};

export const normalizePhone = (value) => String(value ?? "").replace(/[^\d+]/g, "").slice(0, 13);

export const normalizeSearch = (value, max = 80) => String(value ?? "").replace(/[<>]/g, "").slice(0, max);
