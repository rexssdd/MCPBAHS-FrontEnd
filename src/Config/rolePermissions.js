/**
 * rolePermissions.js
 * Central RBAC configuration for all roles in the system.
 * Add or modify roles here without touching page components.
 */

export const ROLE_PERMISSIONS = {
  admin: {
    canAdd: true,
    canEdit: true,
    canArchive: true,
    canBulkArchive: true,
    canViewDetails: true,
    editableFields: "all", // all fields are editable
  },

  principal: {
    canAdd: false,
    canEdit: false,       // set to true to enable limited editing for principal
    canArchive: false,
    canBulkArchive: false,
    canViewDetails: true,
    editableFields: [],   // no editable fields; read-only
  },

  registrar: {
    canAdd: true,
    canEdit: true,
    canArchive: false,
    canBulkArchive: false,
    canViewDetails: true,
    editableFields: [     // registrar can only edit contact + address fields
      "email",
      "phone",
      "country",
      "city",
      "postalCode",
    ],
  },
};

/**
 * Utility: get resolved permissions for a given role.
 * Falls back to the most restrictive permission set if role is unknown.
 */
export function getPermissions(role) {
  return (
    ROLE_PERMISSIONS[role] ?? {
      canAdd: false,
      canEdit: false,
      canArchive: false,
      canBulkArchive: false,
      canViewDetails: true,
      editableFields: [],
    }
  );
}