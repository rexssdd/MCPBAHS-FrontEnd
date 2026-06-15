/**
 * userDefaults.js
 * Shared fallback data generator — single source of truth.
 * Consumed by both UserManagement.jsx and useUserManagement.js.
 */

export const ROLES    = ["Admin", "Teacher", "Registrar", "Guidance", "Principal"];
export const PAGE_SIZE = 14;
export const EMPTY_FORM = { name: "", email: "", role: "", status: "Active" };

const FIRST_NAMES = ["Maria","Jose","Ana","Pedro","Rosa","Carlo","Liza","Marco","Jenny","Renz","Carla","Alvin","Bea","Dan","Luis","Grace","Mark","Claire","Ron","Sheila"];
const LAST_NAMES  = ["Santos","Bautista","Cruz","Garcia","Villanueva","Reyes","Tan","Lim","Torres","Rivera","Mendoza","Flores","Ramos","Aquino","Dela Cruz","Fernandez","Gomez","Navarro","Pascual","Soriano"];

export const generateDefaultUsers = () =>
  Array.from({ length: 40 }, (_, i) => ({
    id:      String(100000 + i + 1),
    staffId: String(200000 + i + 1),           // zero-padded 6-digit format
    name:    `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
    email:   `${FIRST_NAMES[i % FIRST_NAMES.length].toLowerCase()}.${LAST_NAMES[i % LAST_NAMES.length].toLowerCase().replace(" ", "")}@deped.gov.ph`,
    role:    ROLES[i % ROLES.length],           // cycle through all roles, not just Admin
    status:  "Active",
  }));