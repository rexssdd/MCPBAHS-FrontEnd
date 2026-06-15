import { useState, useEffect, useRef } from "react";

import {
  Breadcrumb,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormInput,
  FormSelect,
  CountryField,
  SearchableSelect,
} from "../../../Components/ui";

import { sanitizeFaculty } from "../../../utils/facultyValidation";
import {
  hasUnsafeText,
  isValidDate,
  trimText,
  validateEmailField,
  validateNameField,
  validatePhoneField,
  validateTextField,
} from "../../../utils/inputValidation";
import { PHILIPPINE_REGIONS, getCityOptions, getProvinceOptions } from "../../../utils/philippineLocations";

const SEX_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "On Leave", value: "On Leave" },
  { label: "Resigned", value: "Resigned" },
  { label: "Retired", value: "Retired" },
];

const DEPARTMENT_OPTIONS = [
  { label: "English", value: "English" },
  { label: "Filipino", value: "Filipino" },
  { label: "Mathematics", value: "Mathematics" },
  { label: "Science", value: "Science" },
  { label: "Araling Panlipunan", value: "Araling Panlipunan" },
  { label: "MAPEH", value: "MAPEH" },
  { label: "TLE", value: "TLE" },
  { label: "Values Education", value: "Values Education" },
  { label: "ICT", value: "ICT" },
  { label: "TVL", value: "TVL" },
  { label: "HUMSS", value: "HUMSS" },
  { label: "STEM", value: "STEM" },
  { label: "ABM", value: "ABM" },
  { label: "GAS", value: "GAS" },
  { label: "Administration", value: "Administration" },
  { label: "Guidance", value: "Guidance" },
  { label: "Registrar", value: "Registrar" },
];

const POSITION_OPTIONS = [
  { label: "Principal I", value: "Principal I" },
  { label: "Principal II", value: "Principal II" },
  { label: "Principal III", value: "Principal III" },
  { label: "Principal IV", value: "Principal IV" },
  { label: "Assistant School Principal I", value: "Assistant School Principal I" },
  { label: "Assistant School Principal II", value: "Assistant School Principal II" },
  { label: "Assistant School Principal III", value: "Assistant School Principal III" },
  { label: "Head Teacher I", value: "Head Teacher I" },
  { label: "Head Teacher II", value: "Head Teacher II" },
  { label: "Head Teacher III", value: "Head Teacher III" },
  { label: "Head Teacher IV", value: "Head Teacher IV" },
  { label: "Head Teacher V", value: "Head Teacher V" },
  { label: "Head Teacher VI", value: "Head Teacher VI" },
  { label: "Master Teacher I", value: "Master Teacher I" },
  { label: "Master Teacher II", value: "Master Teacher II" },
  { label: "Master Teacher III", value: "Master Teacher III" },
  { label: "Master Teacher IV", value: "Master Teacher IV" },
  { label: "Teacher I", value: "Teacher I" },
  { label: "Teacher II", value: "Teacher II" },
  { label: "Teacher III", value: "Teacher III" },
  { label: "Guidance Counselor I", value: "Guidance Counselor I" },
  { label: "Librarian I", value: "Librarian I" },
  { label: "Administrative Officer II", value: "Administrative Officer II" },
  { label: "Administrative Assistant I", value: "Administrative Assistant I" },
  { label: "Administrative Assistant II", value: "Administrative Assistant II" },
  { label: "Administrative Assistant III", value: "Administrative Assistant III" },
  { label: "Accountant I", value: "Accountant I" },
  { label: "Bookkeeper", value: "Bookkeeper" },
  { label: "Nurse I", value: "Nurse I" },
  { label: "Dentist I", value: "Dentist I" },
];

const normalizeInitial = (data) => {
  if (!data) return { country: "Philippines" };
  return {
    personnel_id_number: data.personnel_id_number ?? "",
    first_name: data.first_name ?? "",
    middle_name: data.middle_name ?? "",
    last_name: data.last_name ?? "",
    email: data.email ?? "",
    phone_number: data.phone_number ?? "",
    date_of_birth: data.date_of_birth ?? "",
    sex: data.sex ?? "",
    country: "Philippines",
    region: data.address?.region ?? data.region ?? "",
    province: data.address?.province ?? data.province ?? "",
    brgy_street_address:
      data.address?.brgy_street_address ?? data.address?.street ?? data.brgy_street_address ?? "",
    city: data.address?.city ?? data.city ?? "",
    postal_code: data.address?.postal_code ?? data.postal_code ?? "",
    teaching_load: data.teaching_load ?? "",
    position: data.position ?? "",
    department: data.department ?? "",
    employment_status: data.employment_status ?? "Active",
  };
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFacultyForm(form, isEdit) {
  const errors = {};

  // Required fields differ by mode
  const alwaysRequired = {
    first_name: "First name",
    last_name: "Last name",
    email: "Email",
    phone_number: "Phone number",
    date_of_birth: "Date of birth",
    sex: "Sex",
    position: "Position",
    employment_status: "Employment status",
  };

  const createOnlyRequired = {
    personnel_id_number: "Personnel ID",
    country: "Country",
    region: "Region",
    province: "Province",
    brgy_street_address: "Street address",
    city: "City",
    postal_code: "Postal code",
    teaching_load: "Teaching load",
    department: "Department",
  };

  const requiredFields = isEdit
    ? alwaysRequired
    : { ...alwaysRequired, ...createOnlyRequired };

  // Presence check
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!trimText(form[field])) errors[field] = `${label} is required.`;
  });

  // Name format validation
  if (trimText(form.first_name)) {
    const e = validateNameField(form.first_name, "First name");
    if (e) errors.first_name = e;
  }
  if (trimText(form.middle_name)) {
    const e = validateNameField(form.middle_name, "Middle name");
    if (e) errors.middle_name = e;
  }
  if (trimText(form.last_name)) {
    const e = validateNameField(form.last_name, "Last name");
    if (e) errors.last_name = e;
  }

  // Email
  if (trimText(form.email)) {
    const e = validateEmailField(form.email);
    if (e) errors.email = e;
  }

  // Phone
  if (trimText(form.phone_number)) {
    const e = validatePhoneField(form.phone_number, "Phone number");
    if (e) errors.phone_number = e;
  }

  // Date of birth
  if (trimText(form.date_of_birth)) {
    const dob = new Date(`${form.date_of_birth}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isValidDate(form.date_of_birth)) {
      errors.date_of_birth = "Enter a valid date of birth.";
    } else if (dob >= today) {
      errors.date_of_birth = "Date of birth must be in the past.";
    }
  }

  // Postal code — 4 digits
  if (trimText(form.postal_code) && !/^\d{4}$/.test(trimText(form.postal_code))) {
    errors.postal_code = "Postal code must be exactly 4 digits.";
  }

  if (trimText(form.country) && trimText(form.country) !== "Philippines") {
    errors.country = "Select a valid country from the list.";
  }

  if (trimText(form.region) && !PHILIPPINE_REGIONS.includes(trimText(form.region))) {
    errors.region = "Select a valid region from the list.";
  }

  if (trimText(form.province) && !getProvinceOptions(form.region).includes(trimText(form.province))) {
    errors.province = "Select a valid province from the list.";
  }

  if (trimText(form.city) && !getCityOptions(form.province).includes(trimText(form.city))) {
    errors.city = "Select a valid city or municipality from the list.";
  }

  // Teaching load — positive number
  if (trimText(String(form.teaching_load)) && Number(form.teaching_load) <= 0) {
    errors.teaching_load = "Teaching load must be a positive number.";
  }

  // Personnel ID — min 3 chars
  if (trimText(form.personnel_id_number)) {
    const e = validateTextField(form.personnel_id_number, "Personnel ID", { min: 3, max: 40 });
    if (e) errors.personnel_id_number = e;
  }

  // XSS / unsafe text guard
  Object.entries(form).forEach(([field, value]) => {
    if (typeof value === "string" && hasUnsafeText(value)) {
      errors[field] = "This field cannot contain angle brackets.";
    }
  });

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FacultyForm({ initial, mode, onSave, onBackToList, onBackToView }) {
  const isEdit = mode === "edit";
  const handleCancel = isEdit && onBackToView ? onBackToView : onBackToList;

  const [form, setForm] = useState(() => normalizeInitial(initial));
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (initial) setForm(normalizeInitial(initial));
  }, [initial]);

  useEffect(() => () => { isMountedRef.current = false; }, []);

  // Generic setter for native inputs (e.target.value)
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Setter for SearchableSelect (receives value directly, not an event)
  const setSearchable = (key) => (value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "region") {
        next.province = "";
        next.city = "";
      }
      if (key === "province") next.city = "";
      return next;
    });
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const openPreview = () => {
    const errs = validateFacultyForm(form, isEdit);
    setErrors(errs);
    if (Object.keys(errs).length === 0) setPreview(true);
  };

  const handleConfirm = async () => {
    const errs = validateFacultyForm(form, isEdit);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = sanitizeFaculty({ ...form, uuid: initial?.uuid });
    setSaving(true);
    try {
      await onSave(payload);
      if (!isMountedRef.current) return;
      setPreview(false);
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumb
        parts={[
          { label: "Faculty and Staff", onClick: onBackToList },
          { label: isEdit ? "Edit" : "Add" },
        ]}
      />

      <div className="form-card">
        <h2 className="form-section-title">
          {isEdit ? "Edit Faculty" : "Add Faculty"}
        </h2>

        {/* ── Personal ── */}
        <div className="form-grid-3">
          <FormInput label="First Name"  value={form.first_name}  onChange={set("first_name")}  error={errors.first_name}  required maxLength={80} autoComplete="given-name" />
          <FormInput label="Middle Name" value={form.middle_name} onChange={set("middle_name")} error={errors.middle_name} maxLength={80} autoComplete="additional-name" />
          <FormInput label="Last Name"   value={form.last_name}   onChange={set("last_name")}   error={errors.last_name}   required maxLength={80} autoComplete="family-name" />
        </div>

        <div className="form-grid-3">
          <FormInput label="Email"         type="email" value={form.email}         onChange={set("email")}         error={errors.email}         required maxLength={120} autoComplete="email" />
          <FormInput label="Phone Number"  type="tel"   value={form.phone_number}  onChange={set("phone_number")}  error={errors.phone_number}  required maxLength={13} inputMode="tel" autoComplete="tel" />
          <FormInput label="Date of Birth" type="date"  value={form.date_of_birth} onChange={set("date_of_birth")} error={errors.date_of_birth} required />
        </div>

        <div className="form-grid-3">
          <FormSelect label="Sex"               value={form.sex}               onChange={set("sex")}               options={SEX_OPTIONS}               error={errors.sex}               required />
          <FormSelect label="Position"          value={form.position}          onChange={set("position")}          options={POSITION_OPTIONS}          error={errors.position}          required />
          <FormSelect label="Employment Status" value={form.employment_status} onChange={set("employment_status")} options={EMPLOYMENT_STATUS_OPTIONS} error={errors.employment_status} required />
        </div>

        {/* ── Create-only fields ── */}
        {!isEdit && (
          <>
            <FormInput label="Personnel ID" value={form.personnel_id_number} onChange={set("personnel_id_number")} error={errors.personnel_id_number} required maxLength={40} />

            <div className="form-grid-3">
              <FormSelect label="Department"    value={form.department}    onChange={set("department")}    options={DEPARTMENT_OPTIONS} error={errors.department}    required />
              <FormInput  label="Teaching Load" type="number" value={form.teaching_load} onChange={set("teaching_load")} error={errors.teaching_load} required />
            </div>

            <div className="form-grid-3">
              <CountryField value={form.country || "Philippines"} required />
              <SearchableSelect label="Region"   value={form.region}    onChange={setSearchable("region")}   options={PHILIPPINE_REGIONS} placeholder="Search region" error={errors.region} required name="faculty-region" allowCustom={false} />
              <SearchableSelect label="Province" value={form.province}  onChange={setSearchable("province")} options={getProvinceOptions(form.region)} placeholder="Search province" error={errors.province} required name="faculty-province" allowCustom={false} disabled={!form.region} />
            </div>

            <div className="form-grid-3">
              <FormInput        label="Street Address" value={form.brgy_street_address} onChange={set("brgy_street_address")} error={errors.brgy_street_address} required maxLength={120} />
              <SearchableSelect label="City"           value={form.city}                onChange={setSearchable("city")}      options={getCityOptions(form.province)} placeholder="Search city or municipality" error={errors.city} required name="faculty-city" allowCustom={false} disabled={!form.province} />
              <FormInput        label="Postal Code"    value={form.postal_code}         onChange={set("postal_code")}         error={errors.postal_code}         required maxLength={4} inputMode="numeric" />
            </div>
          </>
        )}

        {/* ── Actions ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-outline" onClick={handleCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={openPreview}>
            {isEdit ? "Save Changes" : "Add Faculty"}
          </button>
        </div>
      </div>

      {/* ── Preview modal ── */}
      {preview && (
        <Modal size="lg" onClose={() => setPreview(false)}>
          <ModalHeader>Preview</ModalHeader>
          <ModalBody>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                ["Name",   `${form.first_name} ${form.last_name}`],
                ["Email",  form.email],
                ["Phone",  form.phone_number],
                ["DOB",    form.date_of_birth],
                ["Sex",    form.sex],
                ["Position", form.position],
                ["Status", form.employment_status],
                ...(!isEdit ? [
                  ["Country",  form.country],
                  ["City",     form.city],
                  ["Province", form.province],
                ] : []),
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="info-field-label">{l}</p>
                  <div className="form-input" style={{ cursor: "default" }}>{v || "—"}</div>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <button className="btn btn-outline" onClick={() => setPreview(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleConfirm}>
              {saving ? "Saving…" : "Confirm"}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}
