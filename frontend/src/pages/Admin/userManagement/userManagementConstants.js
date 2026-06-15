/** Activity log filter options and badge styling. */
export const LOG_PAGE_SIZE = 15;

export const ACTION_TYPES = [
  { value: "",               label: "All Actions" },
  { value: "LOGIN",          label: "Login" },
  { value: "LOGOUT",         label: "Logout" },
  { value: "CREATE",         label: "Create" },
  { value: "UPDATE",         label: "Update" },
  { value: "DELETE",         label: "Delete" },
  { value: "ARCHIVE",        label: "Archive" },
  { value: "RESET_PASSWORD", label: "Reset Password" },
  { value: "VIEW",           label: "View" },
];

export const ACTION_CONFIG = {
  LOGIN:          { cls: "log-badge--login",    label: "Login"          },
  LOGOUT:         { cls: "log-badge--logout",   label: "Logout"         },
  CREATE:         { cls: "log-badge--create",   label: "Create"         },
  UPDATE:         { cls: "log-badge--update",   label: "Update"         },
  DELETE:         { cls: "log-badge--delete",   label: "Delete"         },
  ARCHIVE:        { cls: "log-badge--archive",  label: "Archive"        },
  RESET_PASSWORD: { cls: "log-badge--reset",    label: "Reset Password" },
  VIEW:           { cls: "log-badge--view",     label: "View"           },
};
