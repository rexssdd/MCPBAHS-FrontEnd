export const USE_API = true;

/* ── Constants ───────────────────────────────────────────────── */
export const PALETTE    = ["#1a5c1a","#2a7a2a","#c4920a","#1d4ed8","#7c3aed","#dc2626","#0891b2","#db2777"];
export const STATUSES   = ["Active","On Leave","Inactive"];
export const ROLES_LIST = ["Teacher","Non-Teaching"];
/** Used for personnel list filtering (FSIS test matrix). */
export const DEPARTMENTS = ["STEM", "Languages", "Mathematics", "MAPEH", "Administration", "Guidance"];
export const getAvatarBg = name => PALETTE[name.charCodeAt(0) % PALETTE.length];
export const getInitials = name => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

/* ── Mock / default data (used when API is off or unavailable) ─ */
export const MOCK_FACULTY = [
  { id:"123456", firstName:"John Jay", middleName:"Simon",   lastName:"Doe",        role:"Teacher",      department:"STEM",          city:"Matina, Davao City",   postalCode:"8000", country:"Philippines", contact:"09123456789", email:"johnjaydoe@example.com",       dob:"12-01-1999", status:"Active",   teachingLoad:[{subject:"Science", section:"Grade 9 - Gumamela",    timeslot:"Mon–Wed 10–11am"}], advisory:{section:"Grade 9 - Gumamela",    students:30} },
  { id:"234567", firstName:"Maria",    middleName:"Cruz",    lastName:"Santos",     role:"Teacher",      department:"Mathematics",   city:"Buhangin, Davao City", postalCode:"8000", country:"Philippines", contact:"09198765432", email:"maria.santos@deped.gov.ph",    dob:"03-15-1985", status:"Active",   teachingLoad:[{subject:"Math",    section:"Grade 8 - Sampaguita",  timeslot:"Tue–Thu 8–9am"}],   advisory:{section:"Grade 8 - Sampaguita",  students:35} },
  { id:"345678", firstName:"Jose",     middleName:"Reyes",   lastName:"Bautista",   role:"Non-Teaching", department:"Administration",city:"Toril, Davao City",    postalCode:"8000", country:"Philippines", contact:"09171234567", email:"jose.bautista@deped.gov.ph",   dob:"07-22-1978", status:"On Leave", teachingLoad:[], advisory:null },
  { id:"456789", firstName:"Ana",      middleName:"Dela",    lastName:"Cruz",       role:"Teacher",      department:"Languages",     city:"Calinan, Davao City",  postalCode:"8000", country:"Philippines", contact:"09209876543", email:"ana.delacruz@deped.gov.ph",    dob:"11-05-1990", status:"Active",   teachingLoad:[{subject:"English", section:"Grade 10 - Rosal",      timeslot:"Mon–Fri 1–2pm"}],   advisory:{section:"Grade 10 - Rosal",      students:38} },
  { id:"567890", firstName:"Pedro",    middleName:"Lim",     lastName:"Garcia",     role:"Teacher",      department:"Languages",     city:"Mintal, Davao City",   postalCode:"8000", country:"Philippines", contact:"09151234321", email:"pedro.garcia@deped.gov.ph",    dob:"05-18-1982", status:"Active",   teachingLoad:[{subject:"Filipino",section:"Grade 7 - Ilang-Ilang", timeslot:"Wed–Fri 9–10am"}], advisory:{section:"Grade 7 - Ilang-Ilang", students:32} },
  { id:"678901", firstName:"Rosa",     middleName:"Mendoza", lastName:"Villanueva", role:"Non-Teaching", department:"Guidance",      city:"Talomo, Davao City",   postalCode:"8000", country:"Philippines", contact:"09186543210", email:"rosa.villanueva@deped.gov.ph", dob:"09-30-1975", status:"Active",   teachingLoad:[], advisory:null },
];

export const EMPTY_FORM = {
  firstName:"", middleName:"", lastName:"", role:"Teacher", department:"",
  city:"", postalCode:"", country:"Philippines",
  contact:"", email:"", dob:"", status:"Active",
};

export const validateFacultyForm = (form) => {
  const required = [
    "firstName", "middleName", "lastName", "email", "contact",
    "dob", "country", "city", "postalCode", "role", "status", "department",
  ];

  if (!form || typeof form !== "object") return false;

  const valuesValid = required.every(key => typeof form[key] === "string" && form[key].trim().length > 0);
  const roleValid = ["Teacher", "Non-Teaching"].includes(form.role);
  const statusValid = ["Active", "On Leave", "Inactive"].includes(form.status);
  const deptValid = DEPARTMENTS.includes(form.department);

  return valuesValid && roleValid && statusValid && deptValid;
};
