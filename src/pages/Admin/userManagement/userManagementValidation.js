import { ROLES } from "../../../utils/userDefaults";
import { hasUnsafeText, trimText, validateEmailField, validateNameField } from "../../../utils/inputValidation";

export function validateForm(form) {
  const errors = {};
  const name = trimText(form.name);
  const email = trimText(form.email);
  const role = trimText(form.role);
  const nameError = validateNameField(name, "Full name");
  const emailError = validateEmailField(email);

  if (nameError) errors.name = nameError;
  if (hasUnsafeText(name)) errors.name = "Full name cannot contain angle brackets.";
  if (emailError) errors.email = emailError;
  if (!role || !ROLES.includes(role)) errors.role = "Please select a valid role.";

  return errors;
}


