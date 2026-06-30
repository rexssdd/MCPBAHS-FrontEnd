// src/components/Sidebar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ONE sidebar component for ALL roles.
// Replaces AdminSideBar.jsx, PrincipalSideBar.jsx, RegistrarSideBar.jsx.
//
// Usage:
//   import Sidebar, { NAV_CONFIGS } from "../Components/Sidebar";
//   <Sidebar role="admin" user={user} onLogout={handleLogout} />
//
// Props:
//   role       — "admin" | "principal" | "registrar" | "teacher"  (required)
//   user       — { name, email }  (optional override; sidebar fetches from API if omitted)
//   onLogout   — fn()  called after confirm; handles redirect
//
// API integration:
//   GET  /api/auth/me                  → { name, email, role }   (fetches logged-in user)
//   GET  /api/notifications/unread-count → { count: number }     (notification badge)
//   POST /logout                       → 204 No Content           (server-side token revoke)
//   Falls back to prop `user` or default stub when API is unreachable.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import logo from "../assets/school-logo.png";
import "../Css/sidebar.css";
import { authHeaders } from "../utils/authToken";

/* ─── API CONFIG ─────────────────────────────────────────────────────────── */
// API_BASE must include /api/v1 so notification routes resolve correctly.
// VITE_API_BASE_URL is already "http://localhost:8000/api" — append /v1.
// VITE_BACKEND_URL is the bare origin — append /api/v1.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")}/v1`
  : import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "")}/api/v1`
    : "http://localhost:8000/api/v1";

// AUTH_BASE is the /api root (no /v1) — used for /logout and /auth/me
// which are registered outside the v1 prefix group.
const AUTH_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")
  : import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "")}/api`
    : "http://localhost:8000/api";

/** How often (ms) to re-poll the unread notification count. */
const NOTIF_POLL_INTERVAL = 60_000;   // 60 s

const DEFAULT_USER = { name: "User", email: "user@gmail.com" };

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const Icons = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  faculty: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="12" cy="14" r="1" />
    </svg>
  ),
  tvl: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  enrollment: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  scheduling: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  user: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  reports: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  notif: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  announcements: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  profile: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  logoutAlt: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

/* ─── ROLE CONFIGS ───────────────────────────────────────────────────────── */
export const NAV_CONFIGS = {
  admin: {
    main: [
      { label: "Dashboard",             path: "/admin/dashboard",         icon: Icons.dashboard   },
      { label: "Faculty and Staff",     path: "/admin/faculty-and-staff", icon: Icons.faculty     },
      { label: "TVL Offers",            path: "/admin/tvl-offers",        icon: Icons.tvl         },
      { label: "Events",                path: "/admin/events",            icon: Icons.calendar    },
      { label: "Enrollment",            path: "/admin/enrollmentlist",    icon: Icons.enrollment  },
      { label: "Scheduling & Section",  path: "/admin/scheduling",        icon: Icons.scheduling  },
      { label: "User Management",       path: "/admin/usermanagement",    icon: Icons.user        },
      { label: "Reports and DepEd",     path: "/admin/reports",           icon: Icons.reports     },

    ],
    account: [
      { label: "Notifications",         path: "/admin/notifications",     icon: Icons.notif,   showBadge: true },
      { label: "Profile",               path: "/view-profile",            icon: Icons.profile  },
    ],
  },

  principal: {
    main: [
      { label: "Dashboard",             path: "/principal/dashboard",      icon: Icons.dashboard      },
      { label: "Reports",               path: "/principal/reports",        icon: Icons.reports        },
      { label: "Announcements",         path: "/principal/announcements",  icon: Icons.announcements  },
      { label: "Events",                path: "/principal/events",         icon: Icons.calendar       },
      { label: "Enrollment",            path: "/principal/enrollmentlist", icon: Icons.enrollment     },
    ],
    account: [
      { label: "Notifications",         path: "/principal/notifications",  icon: Icons.notif,   showBadge: true },
      { label: "Profile",               path: "/view-profile",             icon: Icons.profile  },
    ],
  },

  registrar: {
    main: [
      { label: "Dashboard",             path: "/registrar/dashboard",      icon: Icons.dashboard   },
      { label: "Enrollment",            path: "/registrar/enrollment",     icon: Icons.enrollment  },
    ],
    account: [
      { label: "Notifications",         path: "/registrar/notifications",  icon: Icons.notif,   showBadge: true },
      { label: "Profile",               path: "/view-profile",             icon: Icons.profile  },
    ],
  },

  teacher: {
    main: [
      { label: "Dashboard",             path: "/teacher/dashboard",        icon: Icons.dashboard   },
      { label: "Reports",               path: "/teacher/reports",          icon: Icons.reports     },
      { label: "Scheduling & Section",  path: "/teacher/scheduling",       icon: Icons.scheduling  },
    ],
    account: [
      { label: "Notifications",         path: "/teacher/notifications",    icon: Icons.notif,   showBadge: true },
      { label: "Profile",               path: "/view-profile",             icon: Icons.profile  },
    ],
  },
};

/* ─── API HELPERS ────────────────────────────────────────────────────────── */

/**
 * Fetch the currently logged-in user from the server.
 * Returns null if the request fails (network error, 401, etc.).
 *
 * Expected response shape: { name: string, email: string, role: string }
 */
async function fetchCurrentUser() {
  try {
    const res = await fetch(`${AUTH_BASE}/auth/me`, {
      method: "GET",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      name:  data.name  ?? null,
      email: data.email ?? null,
      role:  data.role  ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the number of unread notifications for the current user.
 * Expected response shape: { count: number }
 * Returns 0 on any error so the badge simply stays hidden.
 */
async function fetchNotificationCount() {
  try {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      method: "GET",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
    });

    if (!res.ok) return 0;

    const data = await res.json();
    return typeof data.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}

/**
 * Call the server-side logout endpoint, then clear all local storage.
 */
async function callLogoutAPI() {
  try {
    await fetch(`${AUTH_BASE}/logout`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
    });
  } catch {
    // Server unreachable — still proceed with local cleanup
  } finally {
    localStorage.removeItem("auth");
    sessionStorage.clear();
  }
}

/* ─── BADGE ──────────────────────────────────────────────────────────────── */
/**
 * Renders a small pill showing the unread count.
 * Caps display at 99 and shows "99+" beyond that.
 */
function NotifBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="sb-notif-badge" aria-label={`${count} unread notifications`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ─── NAV ITEM ───────────────────────────────────────────────────────────── */
/**
 * @param {object}  item       — nav config item
 * @param {boolean} isActive   — whether this route is current
 * @param {number}  badge      — optional unread count (only rendered when item.showBadge is true)
 * @param {fn}      onClick
 */
function NavItem({ item, isActive, badge, onClick }) {
  return (
    <button
      className={`sb-item${isActive ? " sb-item--active" : ""}`}
      onClick={() => onClick(item)}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="sb-icon">{item.icon}</span>
      <span>{item.label}</span>
      {item.showBadge && <NotifBadge count={badge} />}
    </button>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────── */
export default function Sidebar({ role = "admin", user: userProp, onLogout }) {
  const { auth } = useAuth();
  const [showLogout, setShowLogout]     = useState(false);
  const [resolvedUser, setResolvedUser] = useState(null);
  const [notifCount, setNotifCount]     = useState(0);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const pollRef                         = useRef(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  /* ── Fetch current user on mount ── */
  useEffect(() => {
    if (userProp?.name || userProp?.email || auth?.user?.name || auth?.user?.email) {
      return;
    }
    fetchCurrentUser().then((apiUser) => {
      setResolvedUser(apiUser ?? DEFAULT_USER);
    });
  }, [userProp, auth?.user]);

  /* ── Fetch & poll notification count ── */
  useEffect(() => {
    // Initial fetch
    fetchNotificationCount().then(setNotifCount);

    // Poll every NOTIF_POLL_INTERVAL ms
    pollRef.current = setInterval(() => {
      fetchNotificationCount().then(setNotifCount);
    }, NOTIF_POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, []);

  /* ── Reset badge to 0 when user navigates to a Notifications page ── */
  useEffect(() => {
    const isOnNotifPage = location.pathname.includes("/notifications");
    if (isOnNotifPage) {
      setNotifCount(0);
    }
  }, [location.pathname]);

  const config   = NAV_CONFIGS[role] ?? NAV_CONFIGS.admin;
  const allItems = [...config.main, ...config.account];

  const activeLabel =
    allItems.find(
      (i) => location.pathname === i.path || location.pathname.startsWith(i.path + "/")
    )?.label ?? "";

  const handleClick = (item) => navigate(item.path);

  const handleLogout = async () => {
    clearInterval(pollRef.current);
    await callLogoutAPI();
    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  const displayUser = (userProp?.name || userProp?.email)
    ? userProp
    : (auth?.user?.name || auth?.user?.email)
      ? auth.user
      : (resolvedUser ?? DEFAULT_USER);

  const initials = displayUser.name
    ? displayUser.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "JD";

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="sb-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sb-mobile-overlay sb-mobile-overlay--visible"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sb-root${mobileOpen ? " sb-root--open" : ""}`}>

        {/* ── LOGO ── */}
        <div className="sb-header">
          <img className="sb-logo-img" src={logo} alt="School Logo" />
          <div>
            <div className="sb-brand-name">M.C.P.B.A.H.S</div>
            <div className="sb-brand-sub">School Management</div>
          </div>
          {/* Close button — only visible on mobile */}
          <button
            className="sb-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── MAIN MENU ── */}
        <nav className="sb-nav">
          <span className="sb-section-label">Main Menu</span>
          {config.main.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={activeLabel === item.label}
              badge={notifCount}
              onClick={handleClick}
            />
          ))}
        </nav>

        {/* ── ACCOUNT ── */}
        <div className="sb-account">
          <span className="sb-section-label">Account</span>
          {config.account.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isActive={activeLabel === item.label}
              badge={notifCount}
              onClick={handleClick}
            />
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div className="sb-footer">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-user-info">
            <span className="sb-user-name">{displayUser.name  || "User"}</span>
            <span className="sb-user-email">{displayUser.email || "user@deped.gov.ph"}</span>
          </div>
          <button
            className="sb-footer-btn"
            onClick={() => setShowLogout(true)}
            title="Logout"
            aria-label="Logout"
          >
            {Icons.logout}
          </button>
        </div>
      </aside>

      {/* ── LOGOUT MODAL ── */}
      {showLogout && (
        <div className="sb-overlay" onClick={() => setShowLogout(false)}>
          <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sb-modal-icon">
              {Icons.logoutAlt}
            </div>
            <h3 className="sb-modal-title">Sign out?</h3>
            <p className="sb-modal-body">
              You'll be returned to the login page. Any unsaved changes will be lost.
            </p>
            <div className="sb-modal-foot">
              <button
                className="sb-modal-btn sb-modal-btn--cancel"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button
                className="sb-modal-btn sb-modal-btn--danger"
                onClick={handleLogout}
              >
                {Icons.logout} Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}